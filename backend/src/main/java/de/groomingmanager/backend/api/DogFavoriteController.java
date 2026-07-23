package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.DogFavorite;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.DogFavoriteRepository;
import de.groomingmanager.backend.repository.PetRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DogFavoriteController {

  private static final int MAX_FAVORITES_PER_GROOMER = 6;
  private static final String MAX_FAVORITES_MESSAGE = "Maximal 6 Hundefavoriten erlaubt.";

  private final DogFavoriteRepository dogFavoriteRepository;
  private final PetRepository petRepository;
  private final CustomerRepository customerRepository;

  public DogFavoriteController(
      DogFavoriteRepository dogFavoriteRepository,
      PetRepository petRepository,
      CustomerRepository customerRepository) {
    this.dogFavoriteRepository = dogFavoriteRepository;
    this.petRepository = petRepository;
    this.customerRepository = customerRepository;
  }

  @GetMapping("/api/dog-favorites")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<DogDto> list(Authentication authentication) {
    return dogFavoriteRepository
        .findByGroomerSubjectOrderByCreatedAtDescIdDesc(authentication.getName())
        .stream()
        .map(this::toDto)
        .toList();
  }

  @PostMapping("/api/dog-favorites/{dogId}")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  @Transactional
  public DogDto pin(@PathVariable Long dogId, Authentication authentication) {
    return dogFavoriteRepository
        .findByGroomerSubjectAndPetId(authentication.getName(), dogId)
        .map(this::toDto)
        .orElseGet(() -> createFavorite(authentication.getName(), dogId));
  }

  @DeleteMapping("/api/dog-favorites/{dogId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  @Transactional
  public void remove(@PathVariable Long dogId, Authentication authentication) {
    dogFavoriteRepository.deleteByGroomerSubjectAndPetId(authentication.getName(), dogId);
  }

  private DogDto createFavorite(String groomerSubject, Long dogId) {
    if (dogFavoriteRepository.countByGroomerSubject(groomerSubject) >= MAX_FAVORITES_PER_GROOMER) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, MAX_FAVORITES_MESSAGE);
    }

    Pet pet =
        petRepository
            .findById(dogId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return toDto(dogFavoriteRepository.save(new DogFavorite(groomerSubject, pet)));
  }

  private DogDto toDto(DogFavorite favorite) {
    Pet pet = favorite.getPet();
    Customer customer =
        customerRepository.findByKeycloakSubject(pet.getOwnerSubject()).orElse(null);
    return DogDto.from(pet, customer);
  }
}
