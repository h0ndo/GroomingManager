package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.Pet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {
  @EntityGraph(attributePaths = "customer")
  List<Pet> findByOwnerSubjectOrderByCreatedAtDesc(String ownerSubject);

  @EntityGraph(attributePaths = "customer")
  List<Pet> findAllByOrderByCreatedAtDesc(Pageable pageable);

  Optional<Pet> findByIdAndOwnerSubject(Long id, String ownerSubject);
}
