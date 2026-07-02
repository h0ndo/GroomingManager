package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
public class ServiceOfferingController {
  private final ServiceOfferingRepository serviceOfferingRepository;

  public ServiceOfferingController(ServiceOfferingRepository serviceOfferingRepository) {
    this.serviceOfferingRepository = serviceOfferingRepository;
  }

  @GetMapping
  public List<ServiceOfferingDto> activeServices() {
    return serviceOfferingRepository.findByActiveTrueOrderByNameAsc().stream()
        .map(ServiceOfferingController::toDto)
        .toList();
  }

  static ServiceOfferingDto toDto(ServiceOffering offering) {
    return new ServiceOfferingDto(
        offering.getId(), offering.getName(), offering.getPrice(), offering.isActive());
  }
}
