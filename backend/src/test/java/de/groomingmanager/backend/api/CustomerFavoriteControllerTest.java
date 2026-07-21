package de.groomingmanager.backend.api;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.CustomerFavorite;
import de.groomingmanager.backend.repository.CustomerFavoriteRepository;
import de.groomingmanager.backend.repository.CustomerRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CustomerFavoriteController.class)
@Import(SecurityConfig.class)
class CustomerFavoriteControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private CustomerFavoriteRepository customerFavoriteRepository;
  @MockitoBean private CustomerRepository customerRepository;

  @Test
  void groomerCanListOwnCustomerFavorites() throws Exception {
    Customer customer = customer(7L, "kunde-7", "Katja Krause");
    customer.setProfileImage("avatar".getBytes());
    when(customerFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .thenReturn(List.of(new CustomerFavorite("groomer-1", customer)));

    mockMvc
        .perform(get("/api/customer-favorites").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].customerId").value(7))
        .andExpect(jsonPath("$[0].firstName").value("Katja"))
        .andExpect(jsonPath("$[0].lastName").value("Krause"))
        .andExpect(jsonPath("$[0].profileImageBase64").value("YXZhdGFy"));

    verify(customerFavoriteRepository).findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1");
  }

  @Test
  void adminCanPinCustomerAsOwnFavoriteWithoutRequestGroomerId() throws Exception {
    Customer customer = customer(7L, "kunde-7", "Katja Krause");
    when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
    when(customerFavoriteRepository.findByGroomerSubjectAndCustomerId("admin-1", 7L))
        .thenReturn(Optional.empty());
    when(customerFavoriteRepository.save(any(CustomerFavorite.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value(7))
        .andExpect(jsonPath("$.firstName").value("Katja"))
        .andExpect(jsonPath("$.lastName").value("Krause"));

    verify(customerFavoriteRepository).findByGroomerSubjectAndCustomerId("admin-1", 7L);
    verify(customerFavoriteRepository).save(any(CustomerFavorite.class));
  }

  @Test
  void groomerCanPinFirstCustomerFavoriteWhenCurrentCountIsZero() throws Exception {
    Customer customer = customer(7L, "kunde-7", "Katja Krause");
    when(customerFavoriteRepository.findByGroomerSubjectAndCustomerId("groomer-1", 7L))
        .thenReturn(Optional.empty());
    when(customerFavoriteRepository.countByGroomerSubject("groomer-1")).thenReturn(0L);
    when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
    when(customerFavoriteRepository.save(any(CustomerFavorite.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value(7));

    verify(customerFavoriteRepository).countByGroomerSubject("groomer-1");
    verify(customerFavoriteRepository).save(any(CustomerFavorite.class));
  }

  @Test
  void groomerCanPinSixthCustomerFavorite() throws Exception {
    Customer customer = customer(7L, "kunde-7", "Katja Krause");
    when(customerFavoriteRepository.findByGroomerSubjectAndCustomerId("groomer-1", 7L))
        .thenReturn(Optional.empty());
    when(customerFavoriteRepository.countByGroomerSubject("groomer-1")).thenReturn(5L);
    when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
    when(customerFavoriteRepository.save(any(CustomerFavorite.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value(7));

    verify(customerFavoriteRepository).countByGroomerSubject("groomer-1");
    verify(customerFavoriteRepository).save(any(CustomerFavorite.class));
  }

  @Test
  void groomerCannotPinSeventhCustomerFavorite() throws Exception {
    when(customerFavoriteRepository.findByGroomerSubjectAndCustomerId("groomer-1", 7L))
        .thenReturn(Optional.empty());
    when(customerFavoriteRepository.countByGroomerSubject("groomer-1")).thenReturn(6L);

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("Maximal 6 Kundenfavoriten erlaubt."));

    verify(customerFavoriteRepository).countByGroomerSubject("groomer-1");
    verify(customerRepository, never()).findById(7L);
    verify(customerFavoriteRepository, never()).save(any(CustomerFavorite.class));
  }

  @Test
  void pinningExistingCustomerFavoriteDoesNotIncreaseCount() throws Exception {
    Customer customer = customer(7L, "kunde-7", "Katja Krause");
    CustomerFavorite favorite = new CustomerFavorite("groomer-1", customer);
    when(customerFavoriteRepository.findByGroomerSubjectAndCustomerId("groomer-1", 7L))
        .thenReturn(Optional.of(favorite));

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value(7));

    verify(customerFavoriteRepository, never()).countByGroomerSubject("groomer-1");
    verify(customerFavoriteRepository, never()).save(any(CustomerFavorite.class));
  }

  @Test
  void customerCannotUseFavoriteEndpoints() throws Exception {
    mockMvc
        .perform(get("/api/customer-favorites").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(post("/api/customer-favorites/7").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(delete("/api/customer-favorites/7").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
  }

  @Test
  void groomerCanRemoveOnlyOwnFavorite() throws Exception {
    mockMvc
        .perform(delete("/api/customer-favorites/7").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isNoContent());

    verify(customerFavoriteRepository).deleteByGroomerSubjectAndCustomerId("groomer-1", 7L);
  }

  private static Customer customer(Long id, String keycloakSubject, String displayName) {
    Customer customer = new Customer(displayName);
    customer.setId(id);
    customer.setKeycloakSubject(keycloakSubject);
    customer.setEmail("katja@example.test");
    customer.setPhone("0123");
    customer.setCommunicationNotes("bevorzugt SMS");
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
