package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.repository.CustomerRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CustomerController {
  private static final int DEFAULT_LIMIT = 20;
  private static final int MAX_LIMIT = 100;

  private final CustomerRepository customerRepository;

  public CustomerController(CustomerRepository customerRepository) {
    this.customerRepository = customerRepository;
  }

  @GetMapping("/api/customers")
  @PreAuthorize("hasRole('admin') or hasRole('groomer')")
  public List<CustomerDto> search(
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "20") Integer limit) {
    return customerRepository
        .searchByQuery(safeTrim(query), PageRequest.of(0, normalizeLimit(limit)))
        .stream()
        .map(CustomerController::toDto)
        .toList();
  }

  @PostMapping("/api/customers")
  @PreAuthorize("hasRole('admin')")
  public CustomerDto create(@Valid @RequestBody UpsertCustomerRequest request) {
    Customer customer = new Customer(safeTrim(request.displayName()));
    applyRequest(customer, request, true);
    Instant now = Instant.now();
    customer.setCreatedAt(now);
    customer.setUpdatedAt(now);
    return toDto(customerRepository.save(customer));
  }

  @GetMapping("/api/customers/{id}")
  @PreAuthorize("hasRole('admin') or hasRole('groomer') or hasRole('kunde')")
  public CustomerDto read(@PathVariable Long id, Authentication authentication) {
    Customer customer =
        customerRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    assertCanAccess(customer, authentication);
    return toDto(customer);
  }

  @PutMapping("/api/customers/{id}")
  @PreAuthorize("hasRole('admin') or hasRole('groomer') or hasRole('kunde')")
  public CustomerDto update(
      @PathVariable Long id,
      @Valid @RequestBody UpsertCustomerRequest request,
      Authentication authentication) {
    Customer customer =
        customerRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    assertCanAccess(customer, authentication);
    applyRequest(customer, request, hasAnyRole(authentication, "ROLE_admin", "ROLE_groomer"));
    customer.setUpdatedAt(Instant.now());
    return toDto(customerRepository.save(customer));
  }

  @GetMapping("/api/customer/me")
  @PreAuthorize("hasRole('kunde')")
  public CustomerDto me(Authentication authentication) {
    return customerRepository
        .findByKeycloakSubject(authentication.getName())
        .map(CustomerController::toDto)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @PutMapping("/api/customer/me")
  @PreAuthorize("hasRole('kunde')")
  public CustomerDto updateMe(
      @Valid @RequestBody UpsertCustomerRequest request, Authentication authentication) {
    Customer customer =
        customerRepository
            .findByKeycloakSubject(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    applyRequest(customer, request, false);
    customer.setUpdatedAt(Instant.now());
    return toDto(customerRepository.save(customer));
  }

  private static void applyRequest(
      Customer customer, UpsertCustomerRequest request, boolean allowSubjectUpdate) {
    customer.setDisplayName(safeTrim(request.displayName()));
    if (allowSubjectUpdate) {
      customer.setKeycloakSubject(blankToNull(request.keycloakSubject()));
    }
    customer.setEmail(blankToNull(request.email()));
    customer.setPhone(blankToNull(request.phone()));
    customer.setCommunicationNotes(safeTrim(request.communicationNotes()));
    if (request.profileImageBase64() != null && !request.profileImageBase64().isBlank()) {
      try {
        customer.setProfileImage(Base64.getDecoder().decode(request.profileImageBase64()));
      } catch (IllegalArgumentException exception) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Profile image is not valid base64.");
      }
    }
  }

  private static void assertCanAccess(Customer customer, Authentication authentication) {
    if (hasAnyRole(authentication, "ROLE_admin", "ROLE_groomer")) {
      return;
    }
    if (authentication.getName().equals(customer.getKeycloakSubject())) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  }

  private static boolean hasAnyRole(Authentication authentication, String... roles) {
    for (String role : roles) {
      boolean hasRole =
          authentication.getAuthorities().stream()
              .anyMatch(authority -> role.equals(authority.getAuthority()));
      if (hasRole) {
        return true;
      }
    }
    return false;
  }

  private static int normalizeLimit(Integer limit) {
    if (limit == null) {
      return DEFAULT_LIMIT;
    }
    return Math.max(1, Math.min(limit, MAX_LIMIT));
  }

  private static CustomerDto toDto(Customer customer) {
    return new CustomerDto(
        customer.getId(),
        customer.getKeycloakSubject(),
        customer.getDisplayName(),
        customer.getEmail(),
        customer.getPhone(),
        customer.getCommunicationNotes(),
        customer.getProfileImage() == null
            ? null
            : Base64.getEncoder().encodeToString(customer.getProfileImage()));
  }

  private static String safeTrim(String value) {
    return value == null ? "" : value.trim();
  }

  private static String blankToNull(String value) {
    String trimmed = safeTrim(value);
    return trimmed.isBlank() ? null : trimmed;
  }
}
