package de.groomingmanager.backend.api;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
import java.time.Instant;
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

@WebMvcTest(DogController.class)
@Import(SecurityConfig.class)
class DogControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PetRepository petRepository;
  @MockitoBean private CustomerRepository customerRepository;

  @Test
  void groomerCanListDogsWithCustomerContext() throws Exception {
    Customer customer = customer(7L, "kunde-1", "Katja Krause");
    Pet pet = pet(11L, "kunde-1", "Flocke");
    pet.setCustomer(customer);
    when(petRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100)))
        .thenReturn(List.of(pet));

    mockMvc
        .perform(get("/api/dogs?limit=100").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].dogId").value(11))
        .andExpect(jsonPath("$[0].id").value(11))
        .andExpect(jsonPath("$[0].name").value("Flocke"))
        .andExpect(jsonPath("$[0].customerId").value(7))
        .andExpect(jsonPath("$[0].customerName").value("Katja Krause"));

    verify(petRepository).findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100));
  }

  @Test
  void dogListFallsBackToLegacyOwnerSubjectCustomerLookup() throws Exception {
    when(petRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 20)))
        .thenReturn(List.of(pet(12L, "kunde-2", "Milo")));
    when(customerRepository.findByKeycloakSubject("kunde-2"))
        .thenReturn(Optional.of(customer(8L, "kunde-2", "Mara Meier")));

    mockMvc
        .perform(get("/api/dogs").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].customerId").value(8))
        .andExpect(jsonPath("$[0].customerDisplayName").value("Mara Meier"));
  }

  @Test
  void adminDogListLimitIsCappedAtOneHundred() throws Exception {
    when(petRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100))).thenReturn(List.of());

    mockMvc
        .perform(get("/api/dogs?limit=999").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk());

    verify(petRepository).findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100));
  }

  @Test
  void customerCannotUseDogListEndpoint() throws Exception {
    mockMvc
        .perform(get("/api/dogs?limit=100").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
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

  private static Customer customer(Long id, String keycloakSubject, String displayName) {
    Customer customer = new Customer(displayName);
    customer.setId(id);
    customer.setKeycloakSubject(keycloakSubject);
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
