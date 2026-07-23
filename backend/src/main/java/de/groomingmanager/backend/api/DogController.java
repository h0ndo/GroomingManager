package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DogController {
  private static final int DEFAULT_LIMIT = 20;
  private static final int MAX_LIMIT = 100;

  private final PetRepository petRepository;
  private final CustomerRepository customerRepository;

  public DogController(PetRepository petRepository, CustomerRepository customerRepository) {
    this.petRepository = petRepository;
    this.customerRepository = customerRepository;
  }

  @GetMapping("/api/dogs")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<DogDto> list(@RequestParam(defaultValue = "20") Integer limit) {
    return petRepository
        .findAllByOrderByCreatedAtDesc(PageRequest.of(0, normalizeLimit(limit)))
        .stream()
        .map(pet -> DogDto.from(pet, customerFor(pet)))
        .toList();
  }

  private Customer customerFor(Pet pet) {
    if (pet.getCustomer() != null) {
      return pet.getCustomer();
    }
    return customerRepository.findByKeycloakSubject(pet.getOwnerSubject()).orElse(null);
  }

  private static int normalizeLimit(Integer limit) {
    if (limit == null) {
      return DEFAULT_LIMIT;
    }
    return Math.max(1, Math.min(limit, MAX_LIMIT));
  }
}
