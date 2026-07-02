package de.groomingmanager.backend.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AppointmentController.class)
@Import(SecurityConfig.class)
class AppointmentControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private AppointmentRepository appointmentRepository;
  @MockitoBean private ServiceOfferingRepository serviceOfferingRepository;

  @Test
  void customerCanBookAppointmentWithServiceSnapshot() throws Exception {
    ServiceOffering service = serviceOffering(3L, "Baden & Schneiden", "45.50");
    when(serviceOfferingRepository.findByIdAndActiveTrue(3L)).thenReturn(Optional.of(service));
    when(appointmentRepository.existsByAppointmentDateAndTimeSlot(
            LocalDate.parse("2026-08-15"), "10:00"))
        .thenReturn(false);
    when(appointmentRepository.save(any(Appointment.class)))
        .thenAnswer(
            invocation -> {
              Appointment appointment = invocation.getArgument(0);
              appointment.setId(77L);
              return appointment;
            });

    mockMvc
        .perform(
            post("/api/appointments")
                .with(jwtWithRole("kunde-1", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"appointmentDate":"2026-08-15","timeSlot":"10:00","serviceOfferingId":3}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(77))
        .andExpect(jsonPath("$.ownerSubject").value("kunde-1"))
        .andExpect(jsonPath("$.serviceName").value("Baden & Schneiden"))
        .andExpect(jsonPath("$.servicePrice").value(45.50));
  }

  @Test
  void bookingRejectsAlreadyBookedSlot() throws Exception {
    when(appointmentRepository.existsByAppointmentDateAndTimeSlot(
            LocalDate.parse("2026-08-15"), "10:00"))
        .thenReturn(true);

    mockMvc
        .perform(
            post("/api/appointments")
                .with(jwtWithRole("kunde-1", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"appointmentDate":"2026-08-15","timeSlot":"10:00","serviceOfferingId":3}
                    """))
        .andExpect(status().isConflict());
  }

  @Test
  void adminCanListRecentAppointments() throws Exception {
    when(appointmentRepository.findTop10ByOrderByCreatedAtDesc())
        .thenReturn(List.of(appointment(8L, "kunde-1")));

    mockMvc
        .perform(get("/api/admin/appointments/recent").with(jwtWithRole("admin", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(8))
        .andExpect(jsonPath("$[0].ownerSubject").value("kunde-1"));
  }

  private static ServiceOffering serviceOffering(Long id, String name, String price) {
    ServiceOffering service = new ServiceOffering();
    service.setId(id);
    service.setName(name);
    service.setPrice(new BigDecimal(price));
    service.setActive(true);
    return service;
  }

  private static Appointment appointment(Long id, String ownerSubject) {
    Appointment appointment = new Appointment();
    appointment.setId(id);
    appointment.setOwnerSubject(ownerSubject);
    appointment.setAppointmentDate(LocalDate.parse("2026-08-15"));
    appointment.setTimeSlot("10:00");
    appointment.setServiceOfferingId(3L);
    appointment.setServiceName("Baden & Schneiden");
    appointment.setServicePrice(new BigDecimal("45.50"));
    appointment.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return appointment;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
