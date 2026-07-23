package de.groomingmanager.backend.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PetController.class)
@Import(SecurityConfig.class)
class PetControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PetRepository petRepository;

  @MockitoBean private CustomerRepository customerRepository;

  @Test
  void customerCanListOwnPets() throws Exception {
    when(petRepository.findByOwnerSubjectOrderByCreatedAtDesc("kunde-1"))
        .thenReturn(List.of(pet(1L, "kunde-1", "Flocke")));

    mockMvc
        .perform(get("/api/pets").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(1))
        .andExpect(jsonPath("$[0].name").value("Flocke"))
        .andExpect(jsonPath("$[0].breed").value("Pudel"))
        .andExpect(jsonPath("$[0].size").value("klein"))
        .andExpect(jsonPath("$[0].groomingNotes").value("sensibel an den Pfoten"));
  }

  @Test
  void customerCanCreatePet() throws Exception {
    when(petRepository.save(any(Pet.class)))
        .thenAnswer(
            invocation -> {
              Pet pet = invocation.getArgument(0);
              pet.setId(9L);
              return pet;
            });

    mockMvc
        .perform(
            post("/api/pets")
                .with(jwtWithRole("kunde-1", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name":" Flocke ","breed":"Pudel","size":"klein","groomingNotes":"sensibel"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(9))
        .andExpect(jsonPath("$.ownerSubject").value("kunde-1"))
        .andExpect(jsonPath("$.name").value("Flocke"));
  }

  @Test
  void managerCanCreatePetForExistingCustomer() throws Exception {
    Customer customer = customer(42L, "kunde-42");
    when(customerRepository.findById(42L)).thenReturn(Optional.of(customer));
    when(petRepository.save(any(Pet.class)))
        .thenAnswer(
            invocation -> {
              Pet pet = invocation.getArgument(0);
              pet.setId(10L);
              return pet;
            });

    mockMvc
        .perform(
            post("/api/customers/42/pets")
                .with(jwtWithRole("groomer-1", "ROLE_groomer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name":" Nala ","breed":"Labradoodle","size":"mittel","groomingNotes":"ruhig","imageBase64":"aGk="}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(10))
        .andExpect(jsonPath("$.customerId").value(42))
        .andExpect(jsonPath("$.customerDisplayName").value("Katja Gross"))
        .andExpect(jsonPath("$.ownerSubject").value("kunde-42"))
        .andExpect(jsonPath("$.name").value("Nala"));
  }

  @Test
  void managerCreatePetForMissingCustomerReturnsNotFound() throws Exception {
    when(customerRepository.findById(99L)).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/customers/99/pets")
                .with(jwtWithRole("admin-1", "ROLE_admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Nala\"}"))
        .andExpect(status().isNotFound());
  }

  @Test
  void managerCreatePetForCustomerRequiresValidName() throws Exception {
    Customer customer = customer(42L, "kunde-42");
    when(customerRepository.findById(42L)).thenReturn(Optional.of(customer));

    mockMvc
        .perform(
            post("/api/customers/42/pets")
                .with(jwtWithRole("groomer-1", "ROLE_groomer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\" \"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void customerCannotCreatePetForAnotherCustomerProfile() throws Exception {
    mockMvc
        .perform(
            post("/api/customers/42/pets")
                .with(jwtWithRole("kunde-1", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Nala\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void managerCreatedPetFallsBackToCustomerIdOwnerWhenCustomerHasNoSubject() throws Exception {
    Customer customer = customer(43L, null);
    when(customerRepository.findById(43L)).thenReturn(Optional.of(customer));
    when(petRepository.save(any(Pet.class)))
        .thenAnswer(
            invocation -> {
              Pet pet = invocation.getArgument(0);
              pet.setId(11L);
              return pet;
            });

    mockMvc
        .perform(
            post("/api/customers/43/pets")
                .with(jwtWithRole("admin-1", "ROLE_admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Bruno\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value(43))
        .andExpect(jsonPath("$.ownerSubject").value("customer:43"));
  }

  @Test
  void customerCannotDeleteSomeoneElsesPet() throws Exception {
    when(petRepository.findByIdAndOwnerSubject(5L, "kunde-1")).thenReturn(Optional.empty());

    mockMvc
        .perform(delete("/api/pets/5").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isNotFound());
  }

  @Test
  void customerCanDeleteOwnPet() throws Exception {
    Pet pet = pet(5L, "kunde-1", "Flocke");
    when(petRepository.findByIdAndOwnerSubject(5L, "kunde-1")).thenReturn(Optional.of(pet));

    mockMvc
        .perform(delete("/api/pets/5").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isNoContent());

    verify(petRepository).delete(pet);
  }

  private static Customer customer(Long id, String keycloakSubject) {
    Customer customer = new Customer("Katja Gross");
    customer.setId(id);
    customer.setKeycloakSubject(keycloakSubject);
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

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
