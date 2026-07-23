package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PetController {
  private final PetRepository petRepository;
  private final CustomerRepository customerRepository;

  public PetController(PetRepository petRepository, CustomerRepository customerRepository) {
    this.petRepository = petRepository;
    this.customerRepository = customerRepository;
  }

  @GetMapping("/api/pets")
  public List<PetDto> list(Authentication authentication) {
    return petRepository.findByOwnerSubjectOrderByCreatedAtDesc(authentication.getName()).stream()
        .map(PetController::toDto)
        .toList();
  }

  @PostMapping("/api/pets")
  public PetDto create(
      @Valid @RequestBody UpsertPetRequest request, Authentication authentication) {
    Instant now = Instant.now();
    Pet pet = new Pet();
    pet.setOwnerSubject(authentication.getName());
    applyRequest(pet, request);
    pet.setCreatedAt(now);
    pet.setUpdatedAt(now);
    return toDto(petRepository.save(pet));
  }

  @PostMapping("/api/customers/{customerId}/pets")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public PetDto createForCustomer(
      @PathVariable Long customerId, @Valid @RequestBody UpsertPetRequest request) {
    Customer customer =
        customerRepository
            .findById(customerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    Instant now = Instant.now();
    Pet pet = new Pet();
    pet.setOwnerSubject(petOwnerSubjectForCustomer(customer));
    applyRequest(pet, request);
    pet.setCreatedAt(now);
    pet.setUpdatedAt(now);
    return toDto(petRepository.save(pet));
  }

  @PutMapping("/api/pets/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(
      @PathVariable Long id,
      @Valid @RequestBody UpsertPetRequest request,
      Authentication authentication) {
    Pet pet = ownPet(id, authentication);
    applyRequest(pet, request);
    pet.setUpdatedAt(Instant.now());
    petRepository.save(pet);
  }

  @DeleteMapping("/api/pets/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id, Authentication authentication) {
    petRepository.delete(ownPet(id, authentication));
  }

  private Pet ownPet(Long id, Authentication authentication) {
    return petRepository
        .findByIdAndOwnerSubject(id, authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  private static void applyRequest(Pet pet, UpsertPetRequest request) {
    pet.setName(request.name().trim());
    pet.setBreed(safeTrim(request.breed()));
    pet.setSize(safeTrim(request.size()));
    pet.setGroomingNotes(safeTrim(request.groomingNotes()));
    if (request.imageBase64() != null && !request.imageBase64().isBlank()) {
      try {
        pet.setImage(Base64.getDecoder().decode(request.imageBase64()));
      } catch (IllegalArgumentException exception) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pet image is not valid base64.");
      }
    }
  }

  private static PetDto toDto(Pet pet) {
    return new PetDto(
        pet.getId(),
        pet.getOwnerSubject(),
        pet.getName(),
        pet.getBreed(),
        pet.getSize(),
        pet.getGroomingNotes(),
        pet.getImage() == null ? null : Base64.getEncoder().encodeToString(pet.getImage()));
  }

  private static String safeTrim(String value) {
    return value == null ? "" : value.trim();
  }

  private static String petOwnerSubjectForCustomer(Customer customer) {
    String subject = safeTrim(customer.getKeycloakSubject());

    return subject.isBlank() ? "customer:" + customer.getId() : subject;
  }
}
