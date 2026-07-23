package de.groomingmanager.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class PetRepositoryTest {

  @Autowired private PetRepository petRepository;

  @Autowired private CustomerRepository customerRepository;

  @Autowired private TestEntityManager entityManager;

  @Test
  void persistsCustomerAssignmentForPet() {
    Customer customer = customerRepository.save(customer("Katja Krause", "kunde-1"));
    Pet pet = pet("kunde-1", "Flocke");
    pet.setCustomer(customer);

    Pet saved = petRepository.saveAndFlush(pet);
    entityManager.clear();

    Pet reloaded = petRepository.findById(saved.getId()).orElseThrow();

    assertThat(reloaded.getCustomer().getId()).isEqualTo(customer.getId());
    assertThat(reloaded.getCustomer().getDisplayName()).isEqualTo("Katja Krause");
  }

  private static Customer customer(String displayName, String keycloakSubject) {
    Customer customer = new Customer(displayName);
    customer.setKeycloakSubject(keycloakSubject);
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }

  private static Pet pet(String ownerSubject, String name) {
    Pet pet = new Pet();
    pet.setOwnerSubject(ownerSubject);
    pet.setName(name);
    pet.setBreed("Pudel");
    pet.setSize("klein");
    pet.setGroomingNotes("sensibel an den Pfoten");
    pet.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    pet.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return pet;
  }
}
