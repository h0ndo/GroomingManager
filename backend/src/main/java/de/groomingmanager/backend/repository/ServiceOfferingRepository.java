package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.ServiceOffering;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
  List<ServiceOffering> findByActiveTrueOrderByNameAsc();

  List<ServiceOffering> findAllByOrderByNameAsc();

  Optional<ServiceOffering> findByIdAndActiveTrue(Long id);
}
