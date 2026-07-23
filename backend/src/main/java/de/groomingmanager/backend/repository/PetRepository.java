package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.Pet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {
  List<Pet> findByOwnerSubjectOrderByCreatedAtDesc(String ownerSubject);

  List<Pet> findAllByOrderByCreatedAtDesc(Pageable pageable);

  Optional<Pet> findByIdAndOwnerSubject(Long id, String ownerSubject);
}
