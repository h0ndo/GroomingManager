package de.groomingmanager.backend.api;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.repository.CustomerRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CustomerController.class)
@Import(SecurityConfig.class)
class CustomerControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private CustomerRepository customerRepository;

  @Test
  void adminCanSearchCustomers() throws Exception {
    when(customerRepository.searchByQuery("Katja", PageRequest.of(0, 20)))
        .thenReturn(List.of(customerWithProfileImage(1L, "kunde-1", "Katja Krause", "avatar")));

    mockMvc
        .perform(get("/api/customers?query=Katja").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id").value(1))
        .andExpect(jsonPath("$[0].keycloakSubject").value("kunde-1"))
        .andExpect(jsonPath("$[0].displayName").value("Katja Krause"))
        .andExpect(jsonPath("$[0].email").value("katja@example.test"))
        .andExpect(jsonPath("$[0].phone").value("0123"))
        .andExpect(jsonPath("$[0].communicationNotes").value("bevorzugt SMS"))
        .andExpect(jsonPath("$[0].profileImageBase64").value("YXZhdGFy"));
  }

  @Test
  void customerSearchLimitBelowOneIsNormalizedToOne() throws Exception {
    when(customerRepository.searchByQuery("", PageRequest.of(0, 1))).thenReturn(List.of());

    mockMvc
        .perform(get("/api/customers?limit=0").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk());

    verify(customerRepository).searchByQuery("", PageRequest.of(0, 1));
  }

  @Test
  void customerSearchLimitAboveOneHundredIsCappedAtOneHundred() throws Exception {
    when(customerRepository.searchByQuery("", PageRequest.of(0, 100))).thenReturn(List.of());

    mockMvc
        .perform(get("/api/customers?limit=500").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk());

    verify(customerRepository).searchByQuery("", PageRequest.of(0, 100));
  }

  @Test
  void groomerCanSearchCustomers() throws Exception {
    when(customerRepository.searchByQuery("", PageRequest.of(0, 20)))
        .thenReturn(List.of(customer(2L, null, "Milo Mustermann")));

    mockMvc
        .perform(get("/api/customers").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].displayName").value("Milo Mustermann"));
  }

  @Test
  void customerCannotSearchAllCustomers() throws Exception {
    mockMvc
        .perform(get("/api/customers").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
  }

  @Test
  void customerCanReadOwnProfileByMeEndpoint() throws Exception {
    Customer customer = customer(1L, "kunde-1", "Katja Krause");
    customer.setProfileImage("kundin-bild".getBytes());
    when(customerRepository.findByKeycloakSubject("kunde-1")).thenReturn(Optional.of(customer));

    mockMvc
        .perform(get("/api/customer/me").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.displayName").value("Katja Krause"))
        .andExpect(jsonPath("$.profileImageBase64").value("a3VuZGluLWJpbGQ="));
  }

  @Test
  void customerCannotReadOtherCustomerById() throws Exception {
    when(customerRepository.findById(9L))
        .thenReturn(Optional.of(customer(9L, "other-kunde", "Fremde Kundin")));

    mockMvc
        .perform(get("/api/customers/9").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isNotFound());
  }

  @Test
  void adminCanCreateCustomer() throws Exception {
    when(customerRepository.save(any(Customer.class)))
        .thenAnswer(
            invocation -> {
              Customer customer = invocation.getArgument(0);
              customer.setId(12L);
              return customer;
            });

    mockMvc
        .perform(
            post("/api/customers")
                .with(jwtWithRole("admin-1", "ROLE_admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"keycloakSubject":" kunde-1 ","displayName":" Katja Krause ","email":"katja@example.test","phone":" 0123 ","communicationNotes":" bevorzugt SMS ","profileImageBase64":"a3VuZGluLWJpbGQ="}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(12))
        .andExpect(jsonPath("$.keycloakSubject").value("kunde-1"))
        .andExpect(jsonPath("$.displayName").value("Katja Krause"))
        .andExpect(jsonPath("$.email").value("katja@example.test"))
        .andExpect(jsonPath("$.communicationNotes").value("bevorzugt SMS"))
        .andExpect(jsonPath("$.profileImageBase64").value("a3VuZGluLWJpbGQ="));
  }

  @Test
  void invalidCustomerProfileImageReturnsBadRequest() throws Exception {
    mockMvc
        .perform(
            post("/api/customers")
                .with(jwtWithRole("admin-1", "ROLE_admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"displayName":"Katja Krause","profileImageBase64":"not-valid-base64"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void customerCanUpdateOwnProfileByMeEndpoint() throws Exception {
    Customer existing = customer(1L, "kunde-1", "Katja Krause");
    when(customerRepository.findByKeycloakSubject("kunde-1")).thenReturn(Optional.of(existing));
    when(customerRepository.save(existing)).thenReturn(existing);

    mockMvc
        .perform(
            put("/api/customer/me")
                .with(jwtWithRole("kunde-1", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"displayName":" Katja K. ","email":"katja@example.test","phone":"","communicationNotes":"abends erreichbar"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Katja K."))
        .andExpect(jsonPath("$.communicationNotes").value("abends erreichbar"));

    verify(customerRepository).save(existing);
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

  private static Customer customerWithProfileImage(
      Long id, String keycloakSubject, String displayName, String profileImage) {
    Customer customer = customer(id, keycloakSubject, displayName);
    customer.setProfileImage(profileImage.getBytes());
    return customer;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
