package de.groomingmanager.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.groomingmanager.backend.domain.DogFavorite;
import de.groomingmanager.backend.domain.Pet;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class DogFavoriteRepositoryTest {

  @Autowired private DogFavoriteRepository dogFavoriteRepository;

  @Autowired private PetRepository petRepository;

  @Autowired private TestEntityManager entityManager;

  @Test
  void storesFavoritesPerGroomerIndependently() {
    Pet pet = petRepository.save(pet("kunde-1", "Flocke"));
    Pet otherPet = petRepository.save(pet("kunde-2", "Milo"));

    dogFavoriteRepository.save(new DogFavorite("groomer-1", pet));
    dogFavoriteRepository.save(new DogFavorite("groomer-2", pet));
    dogFavoriteRepository.save(new DogFavorite("groomer-1", otherPet));

    assertThat(dogFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .extracting(favorite -> favorite.getPet().getName())
        .containsExactly("Milo", "Flocke");

    assertThat(dogFavoriteRepository.findByGroomerSubjectAndPetId("groomer-2", pet.getId()))
        .isPresent();
  }

  @Test
  void rejectsDuplicateFavoriteForSameGroomerAndDog() {
    Pet pet = petRepository.save(pet("kunde-1", "Flocke"));
    dogFavoriteRepository.saveAndFlush(new DogFavorite("groomer-1", pet));

    assertThatThrownBy(() -> dogFavoriteRepository.saveAndFlush(new DogFavorite("groomer-1", pet)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void removingDogRemovesItsFavorites() {
    Pet pet = petRepository.saveAndFlush(pet("kunde-1", "Flocke"));
    dogFavoriteRepository.saveAndFlush(new DogFavorite("groomer-1", pet));
    Long petId = pet.getId();

    entityManager.clear();
    Pet managedPet = entityManager.find(Pet.class, petId);

    entityManager.remove(managedPet);
    entityManager.flush();
    entityManager.clear();

    assertThat(dogFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .isEmpty();
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
