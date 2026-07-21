package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.CustomerFavorite;
import de.groomingmanager.backend.repository.CustomerFavoriteRepository;
import de.groomingmanager.backend.repository.CustomerRepository;
import java.util.Base64;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CustomerFavoriteController {

  private static final int MAX_FAVORITES_PER_GROOMER = 6;
  private static final String MAX_FAVORITES_MESSAGE = "Maximal 6 Kundenfavoriten erlaubt.";

  private final CustomerFavoriteRepository customerFavoriteRepository;
  private final CustomerRepository customerRepository;

  public CustomerFavoriteController(
      CustomerFavoriteRepository customerFavoriteRepository,
      CustomerRepository customerRepository) {
    this.customerFavoriteRepository = customerFavoriteRepository;
    this.customerRepository = customerRepository;
  }

  @GetMapping("/api/customer-favorites")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<CustomerFavoriteDto> list(Authentication authentication) {
    return customerFavoriteRepository
        .findByGroomerSubjectOrderByCreatedAtDescIdDesc(authentication.getName())
        .stream()
        .map(CustomerFavoriteController::toDto)
        .toList();
  }

  @PostMapping("/api/customer-favorites/{customerId}")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  @Transactional
  public CustomerFavoriteDto pin(@PathVariable Long customerId, Authentication authentication) {
    return customerFavoriteRepository
        .findByGroomerSubjectAndCustomerId(authentication.getName(), customerId)
        .map(CustomerFavoriteController::toDto)
        .orElseGet(() -> createFavorite(authentication.getName(), customerId));
  }

  @DeleteMapping("/api/customer-favorites/{customerId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  @Transactional
  public void remove(@PathVariable Long customerId, Authentication authentication) {
    customerFavoriteRepository.deleteByGroomerSubjectAndCustomerId(
        authentication.getName(), customerId);
  }

  private CustomerFavoriteDto createFavorite(String groomerSubject, Long customerId) {
    if (customerFavoriteRepository.countByGroomerSubject(groomerSubject)
        >= MAX_FAVORITES_PER_GROOMER) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, MAX_FAVORITES_MESSAGE);
    }

    Customer customer =
        customerRepository
            .findById(customerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return toDto(customerFavoriteRepository.save(new CustomerFavorite(groomerSubject, customer)));
  }

  private static CustomerFavoriteDto toDto(CustomerFavorite favorite) {
    Customer customer = favorite.getCustomer();
    NameParts nameParts = nameParts(customer.getDisplayName());
    return new CustomerFavoriteDto(
        customer.getId(),
        nameParts.firstName(),
        nameParts.lastName(),
        customer.getProfileImage() == null
            ? null
            : Base64.getEncoder().encodeToString(customer.getProfileImage()));
  }

  private static NameParts nameParts(String displayName) {
    String trimmed = displayName == null ? "" : displayName.trim();
    if (trimmed.isBlank()) {
      return new NameParts("", "");
    }
    int splitAt = trimmed.lastIndexOf(' ');
    if (splitAt < 0) {
      return new NameParts(trimmed, "");
    }
    return new NameParts(trimmed.substring(0, splitAt), trimmed.substring(splitAt + 1));
  }

  private record NameParts(String firstName, String lastName) {}
}
