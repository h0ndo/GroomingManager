package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class AppointmentController {
  private final AppointmentRepository appointmentRepository;
  private final ServiceOfferingRepository serviceOfferingRepository;

  public AppointmentController(
      AppointmentRepository appointmentRepository,
      ServiceOfferingRepository serviceOfferingRepository) {
    this.appointmentRepository = appointmentRepository;
    this.serviceOfferingRepository = serviceOfferingRepository;
  }

  @PostMapping("/api/appointments")
  @PreAuthorize("hasRole('kunde')")
  public AppointmentDto book(
      @Valid @RequestBody BookAppointmentRequest request, Authentication authentication) {
    String slot = request.timeSlot().trim();
    if (appointmentRepository.existsByAppointmentDateAndTimeSlot(request.appointmentDate(), slot)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Appointment slot is already booked.");
    }

    Appointment appointment = new Appointment();
    appointment.setOwnerSubject(authentication.getName());
    appointment.setAppointmentDate(request.appointmentDate());
    appointment.setTimeSlot(slot);
    appointment.setCreatedAt(Instant.now());

    if (request.serviceOfferingId() != null) {
      ServiceOffering service =
          serviceOfferingRepository
              .findByIdAndActiveTrue(request.serviceOfferingId())
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
      appointment.setServiceOfferingId(service.getId());
      appointment.setServiceName(service.getName());
      appointment.setServicePrice(service.getPrice());
    }

    return toDto(appointmentRepository.save(appointment));
  }

  @GetMapping("/api/appointments")
  @PreAuthorize("hasRole('kunde')")
  public List<AppointmentDto> ownAppointments(Authentication authentication) {
    return appointmentRepository
        .findByOwnerSubjectOrderByCreatedAtDesc(authentication.getName())
        .stream()
        .map(AppointmentController::toDto)
        .toList();
  }

  @GetMapping("/api/admin/appointments/recent")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<AppointmentDto> recentAppointments() {
    return appointmentRepository.findTop10ByOrderByCreatedAtDesc().stream()
        .map(AppointmentController::toDto)
        .toList();
  }

  @GetMapping("/api/admin/appointments/day")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<DayAppointmentDto> dayAppointments(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return appointmentRepository.findByAppointmentDateOrderByTimeSlotAscIdAsc(date).stream()
        .map(AppointmentController::toDayDto)
        .toList();
  }

  private static AppointmentDto toDto(Appointment appointment) {
    return new AppointmentDto(
        appointment.getId(),
        appointment.getOwnerSubject(),
        appointment.getAppointmentDate(),
        appointment.getTimeSlot(),
        appointment.getServiceOfferingId(),
        appointment.getServiceName(),
        appointment.getServicePrice(),
        appointment.getStatus().name());
  }

  private static DayAppointmentDto toDayDto(Appointment appointment) {
    return new DayAppointmentDto(
        appointment.getId(),
        appointment.getAppointmentDate(),
        appointment.getTimeSlot(),
        customerDisplayName(appointment.getOwnerSubject()),
        "Hund noch nicht zugeordnet",
        appointment.getServiceOfferingId(),
        fallback(appointment.getServiceName(), "Leistung noch nicht gewählt"),
        appointment.getStatus().name(),
        null,
        null);
  }

  private static String customerDisplayName(String ownerSubject) {
    String subject = ownerSubject == null ? "" : ownerSubject.trim();
    if (subject.isBlank()) {
      return "Kund:in ohne Profil";
    }
    return "Kund:in " + subject;
  }

  private static String fallback(String value, String fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    return value;
  }
}
