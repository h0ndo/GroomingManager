package de.groomingmanager.backend.api;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WorkspaceController.class)
@Import(SecurityConfig.class)
class WorkspaceControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private CustomerRepository customerRepository;
  @MockitoBean private PetRepository petRepository;
  @MockitoBean private AppointmentRepository appointmentRepository;
  @MockitoBean private ServiceOfferingRepository serviceOfferingRepository;

  @Test
  void adminBootstrapContainsAdminAndCustomerDomains() throws Exception {
    when(customerRepository.searchByQuery("", PageRequest.of(0, 10)))
        .thenReturn(List.of(customer(1L, "kunde-1", "Katja Krause")));
    when(appointmentRepository.findTop10ByOrderByCreatedAtDesc())
        .thenReturn(List.of(appointment(7L, "kunde-1")));
    when(serviceOfferingRepository.findByActiveTrueOrderByNameAsc())
        .thenReturn(List.of(service(3L, "Baden & Schneiden", "45.50")));

    mockMvc
        .perform(get("/api/workspace/bootstrap").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.subject").value("admin-1"))
        .andExpect(jsonPath("$.roles", contains("ROLE_admin")))
        .andExpect(jsonPath("$.domains[*].id", hasItem("admin")))
        .andExpect(jsonPath("$.domains[*].id", hasItem("customers")))
        .andExpect(
            jsonPath("$.domains[?(@.id == 'customers')].actions[0]", hasItem("customer.create")))
        .andExpect(jsonPath("$.instances[?(@.id == 'customer:1')].label", hasItem("Katja Krause")))
        .andExpect(
            jsonPath("$.instances[?(@.id == 'service:3')].parentDomainId", hasItem("services")))
        .andExpect(
            jsonPath(
                "$.instances[?(@.id == 'appointment:7')].parentDomainId", hasItem("appointments")));
  }

  @Test
  void groomerBootstrapDoesNotContainAdminDomain() throws Exception {
    when(customerRepository.searchByQuery("", PageRequest.of(0, 10))).thenReturn(List.of());
    when(appointmentRepository.findTop10ByOrderByCreatedAtDesc()).thenReturn(List.of());
    when(serviceOfferingRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of());

    mockMvc
        .perform(get("/api/workspace/bootstrap").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roles", contains("ROLE_groomer")))
        .andExpect(jsonPath("$.domains[*].id", not(hasItem("admin"))))
        .andExpect(jsonPath("$.domains[*].id", hasItem("customers")))
        .andExpect(jsonPath("$.domains[?(@.id == 'services')].actions[0]").doesNotExist());
  }

  @Test
  void customerBootstrapContainsOnlyOwnPetInstances() throws Exception {
    when(customerRepository.findByKeycloakSubject("kunde-1"))
        .thenReturn(Optional.of(customer(1L, "kunde-1", "Katja Krause")));
    when(petRepository.findByOwnerSubjectOrderByCreatedAtDesc("kunde-1"))
        .thenReturn(List.of(pet(2L, "kunde-1", "Flocke")));
    when(appointmentRepository.findByOwnerSubjectOrderByCreatedAtDesc("kunde-1"))
        .thenReturn(List.of(appointment(7L, "kunde-1")));
    when(serviceOfferingRepository.findByActiveTrueOrderByNameAsc())
        .thenReturn(List.of(service(3L, "Baden & Schneiden", "45.50")));

    mockMvc
        .perform(get("/api/workspace/bootstrap").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.subject").value("kunde-1"))
        .andExpect(
            jsonPath("$.domains[*].id", contains("profile", "dogs", "appointments", "services")))
        .andExpect(
            jsonPath("$.instances[?(@.id == 'customer:1')].parentDomainId", hasItem("profile")))
        .andExpect(jsonPath("$.instances[?(@.id == 'pet:2')].label", hasItem("Flocke")))
        .andExpect(
            jsonPath(
                "$.instances[?(@.id == 'appointment:7')].parentDomainId", hasItem("appointments")))
        .andExpect(jsonPath("$.instances[*].id", not(hasItem("pet:99"))));
  }

  @Test
  void authenticatedWithoutWorkspaceRoleIsForbidden() throws Exception {
    mockMvc
        .perform(get("/api/workspace/bootstrap").with(jwtWithRole("viewer-1", "ROLE_viewer")))
        .andExpect(status().isForbidden());
  }

  @Test
  void unauthenticatedBootstrapIsUnauthorized() throws Exception {
    mockMvc.perform(get("/api/workspace/bootstrap")).andExpect(status().isUnauthorized());
  }

  private static Customer customer(Long id, String keycloakSubject, String displayName) {
    Customer customer = new Customer(displayName);
    customer.setId(id);
    customer.setKeycloakSubject(keycloakSubject);
    customer.setEmail("katja@example.test");
    customer.setPhone("0123");
    customer.setCommunicationNotes("bevorzugt SMS");
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }

  private static Pet pet(Long id, String ownerSubject, String name) {
    Pet pet = new Pet();
    pet.setId(id);
    pet.setOwnerSubject(ownerSubject);
    pet.setName(name);
    pet.setBreed("Pudel");
    pet.setSize("klein");
    pet.setGroomingNotes("sensibel an den Pfoten");
    pet.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    pet.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return pet;
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

  private static ServiceOffering service(Long id, String name, String price) {
    ServiceOffering service = new ServiceOffering();
    service.setId(id);
    service.setName(name);
    service.setPrice(new BigDecimal(price));
    service.setActive(true);
    service.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    service.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return service;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
