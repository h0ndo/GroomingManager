package de.groomingmanager.backend.api;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
import de.groomingmanager.backend.domain.DogFavorite;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.DogFavoriteRepository;
import de.groomingmanager.backend.repository.PetRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DogFavoriteController.class)
@Import(SecurityConfig.class)
class DogFavoriteControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private DogFavoriteRepository dogFavoriteRepository;
  @MockitoBean private PetRepository petRepository;
  @MockitoBean private CustomerRepository customerRepository;

  @Test
  void groomerCanListOwnDogFavoritesWithCustomerContext() throws Exception {
    Pet pet = pet(11L, "kunde-1", "Flocke");
    when(dogFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .thenReturn(List.of(new DogFavorite("groomer-1", pet)));
    when(customerRepository.findByKeycloakSubject("kunde-1"))
        .thenReturn(Optional.of(customer(7L, "kunde-1", "Katja Krause")));

    mockMvc
        .perform(get("/api/dog-favorites").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].dogId").value(11))
        .andExpect(jsonPath("$[0].id").value(11))
        .andExpect(jsonPath("$[0].name").value("Flocke"))
        .andExpect(jsonPath("$[0].customerId").value(7))
        .andExpect(jsonPath("$[0].customerName").value("Katja Krause"))
        .andExpect(jsonPath("$[0].breed").value("Pudel"))
        .andExpect(jsonPath("$[0].size").value("klein"))
        .andExpect(jsonPath("$[0].groomingNotes").value("sensibel an den Pfoten"));

    verify(dogFavoriteRepository).findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1");
  }

  @Test
  void adminCanPinDogAsOwnFavorite() throws Exception {
    Pet pet = pet(11L, "kunde-1", "Flocke");
    when(dogFavoriteRepository.findByGroomerSubjectAndPetId("admin-1", 11L))
        .thenReturn(Optional.empty());
    when(dogFavoriteRepository.countByGroomerSubject("admin-1")).thenReturn(0L);
    when(petRepository.findById(11L)).thenReturn(Optional.of(pet));
    when(customerRepository.findByKeycloakSubject("kunde-1"))
        .thenReturn(Optional.of(customer(7L, "kunde-1", "Katja Krause")));
    when(dogFavoriteRepository.save(any(DogFavorite.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    mockMvc
        .perform(post("/api/dog-favorites/11").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dogId").value(11))
        .andExpect(jsonPath("$.customerId").value(7));

    verify(dogFavoriteRepository).save(any(DogFavorite.class));
  }

  @Test
  void pinningExistingDogFavoriteDoesNotIncreaseCount() throws Exception {
    Pet pet = pet(11L, "kunde-1", "Flocke");
    when(dogFavoriteRepository.findByGroomerSubjectAndPetId("groomer-1", 11L))
        .thenReturn(Optional.of(new DogFavorite("groomer-1", pet)));
    when(customerRepository.findByKeycloakSubject("kunde-1"))
        .thenReturn(Optional.of(customer(7L, "kunde-1", "Katja Krause")));

    mockMvc
        .perform(post("/api/dog-favorites/11").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dogId").value(11));

    verify(dogFavoriteRepository, never()).countByGroomerSubject("groomer-1");
    verify(dogFavoriteRepository, never()).save(any(DogFavorite.class));
  }

  @Test
  void groomerCannotPinSeventhDogFavorite() throws Exception {
    when(dogFavoriteRepository.findByGroomerSubjectAndPetId("groomer-1", 11L))
        .thenReturn(Optional.empty());
    when(dogFavoriteRepository.countByGroomerSubject("groomer-1")).thenReturn(6L);

    mockMvc
        .perform(post("/api/dog-favorites/11").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("Maximal 6 Hundefavoriten erlaubt."));

    verify(petRepository, never()).findById(11L);
    verify(dogFavoriteRepository, never()).save(any(DogFavorite.class));
  }

  @Test
  void customerCannotUseDogFavoriteEndpoints() throws Exception {
    mockMvc
        .perform(get("/api/dog-favorites").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(post("/api/dog-favorites/11").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(delete("/api/dog-favorites/11").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
  }

  @Test
  void groomerCanRemoveOnlyOwnDogFavorite() throws Exception {
    mockMvc
        .perform(delete("/api/dog-favorites/11").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isNoContent());

    verify(dogFavoriteRepository).deleteByGroomerSubjectAndPetId("groomer-1", 11L);
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
