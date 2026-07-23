package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.DogFavorite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DogFavoriteRepository extends JpaRepository<DogFavorite, Long> {

  @EntityGraph(attributePaths = "pet")
  List<DogFavorite> findByGroomerSubjectOrderByCreatedAtDescIdDesc(String groomerSubject);

  @EntityGraph(attributePaths = "pet")
  Optional<DogFavorite> findByGroomerSubjectAndPetId(String groomerSubject, Long petId);

  long countByGroomerSubject(String groomerSubject);

  boolean existsByGroomerSubjectAndPetId(String groomerSubject, Long petId);

  void deleteByGroomerSubjectAndPetId(String groomerSubject, Long petId);
}
