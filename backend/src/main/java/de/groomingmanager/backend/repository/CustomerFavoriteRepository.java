package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.CustomerFavorite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerFavoriteRepository extends JpaRepository<CustomerFavorite, Long> {

  @EntityGraph(attributePaths = "customer")
  List<CustomerFavorite> findByGroomerSubjectOrderByCreatedAtDescIdDesc(String groomerSubject);

  @EntityGraph(attributePaths = "customer")
  Optional<CustomerFavorite> findByGroomerSubjectAndCustomerId(
      String groomerSubject, Long customerId);

  long countByGroomerSubject(String groomerSubject);

  boolean existsByGroomerSubjectAndCustomerId(String groomerSubject, Long customerId);

  void deleteByGroomerSubjectAndCustomerId(String groomerSubject, Long customerId);
}
