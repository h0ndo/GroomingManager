package de.groomingmanager.backend.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.AppointmentStatus;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
        .andExpect(jsonPath("$.servicePrice").value(45.50))
        .andExpect(jsonPath("$.status").value("REQUESTED"));

    ArgumentCaptor<Appointment> savedAppointment = ArgumentCaptor.forClass(Appointment.class);
    verify(appointmentRepository).save(savedAppointment.capture());
    assertThat(savedAppointment.getValue().getStatus()).isEqualTo(AppointmentStatus.REQUESTED);
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

  @Test
  void adminCanListDayAppointmentsWithCardFallbacks() throws Exception {
    Appointment appointment = appointment(8L, "kunde-1");
    appointment.setServiceName(null);
    when(appointmentRepository.findByAppointmentDateOrderByTimeSlotAscIdAsc(
            LocalDate.parse("2026-08-15")))
        .thenReturn(List.of(appointment));

    mockMvc
        .perform(
            get("/api/admin/appointments/day")
                .param("date", "2026-08-15")
                .with(jwtWithRole("admin", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(8))
        .andExpect(jsonPath("$[0].appointmentDate").value("2026-08-15"))
        .andExpect(jsonPath("$[0].timeSlot").value("10:00"))
        .andExpect(jsonPath("$[0].customerDisplayName").value("Kund:in kunde-1"))
        .andExpect(jsonPath("$[0].petName").value("Hund noch nicht zugeordnet"))
        .andExpect(jsonPath("$[0].serviceOfferingId").value(3))
        .andExpect(jsonPath("$[0].serviceName").value("Leistung noch nicht gewählt"))
        .andExpect(jsonPath("$[0].status").value("REQUESTED"));

    verify(appointmentRepository)
        .findByAppointmentDateOrderByTimeSlotAscIdAsc(eq(LocalDate.parse("2026-08-15")));
  }

  @Test
  void groomerCanListDayAppointments() throws Exception {
    when(appointmentRepository.findByAppointmentDateOrderByTimeSlotAscIdAsc(
            LocalDate.parse("2026-08-15")))
        .thenReturn(List.of(appointment(9L, "kunde-2")));

    mockMvc
        .perform(
            get("/api/admin/appointments/day")
                .param("date", "2026-08-15")
                .with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(9));
  }

  @Test
  void customerCannotListDayAppointments() throws Exception {
    mockMvc
        .perform(
            get("/api/admin/appointments/day")
                .param("date", "2026-08-15")
                .with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
  }

  @Test
  void dayAppointmentsRejectMissingDate() throws Exception {
    mockMvc
        .perform(get("/api/admin/appointments/day").with(jwtWithRole("admin", "ROLE_admin")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void dayAppointmentsRejectInvalidDate() throws Exception {
    mockMvc
        .perform(
            get("/api/admin/appointments/day")
                .param("date", "not-a-date")
                .with(jwtWithRole("admin", "ROLE_admin")))
        .andExpect(status().isBadRequest());
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
    appointment.setStatus(AppointmentStatus.REQUESTED);
    appointment.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return appointment;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
