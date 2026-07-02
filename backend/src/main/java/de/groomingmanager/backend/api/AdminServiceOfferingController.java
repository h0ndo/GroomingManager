package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/services")
@PreAuthorize("hasRole('admin')")
public class AdminServiceOfferingController {
  private final ServiceOfferingRepository serviceOfferingRepository;

  public AdminServiceOfferingController(ServiceOfferingRepository serviceOfferingRepository) {
    this.serviceOfferingRepository = serviceOfferingRepository;
  }

  @GetMapping
  public List<ServiceOfferingDto> allServices() {
    return serviceOfferingRepository.findAllByOrderByNameAsc().stream()
        .map(ServiceOfferingController::toDto)
        .toList();
  }

  @PostMapping
  public ServiceOfferingDto create(@Valid @RequestBody UpsertServiceOfferingRequest request) {
    Instant now = Instant.now();
    ServiceOffering offering = new ServiceOffering();
    offering.setName(request.name().trim());
    offering.setPrice(request.price());
    offering.setActive(request.active());
    offering.setCreatedAt(now);
    offering.setUpdatedAt(now);
    return ServiceOfferingController.toDto(serviceOfferingRepository.save(offering));
  }

  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(
      @PathVariable Long id, @Valid @RequestBody UpsertServiceOfferingRequest request) {
    ServiceOffering offering =
        serviceOfferingRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    offering.setName(request.name().trim());
    offering.setPrice(request.price());
    offering.setActive(request.active());
    offering.setUpdatedAt(Instant.now());
    serviceOfferingRepository.save(offering);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    ServiceOffering offering =
        serviceOfferingRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    serviceOfferingRepository.delete(offering);
  }
}
