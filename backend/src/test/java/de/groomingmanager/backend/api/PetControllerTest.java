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
import de.groomingmanager.backend.domain.Pet;
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
