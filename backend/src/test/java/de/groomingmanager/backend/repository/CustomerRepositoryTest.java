package de.groomingmanager.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import de.groomingmanager.backend.domain.Customer;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class CustomerRepositoryTest {

  @Autowired private CustomerRepository customerRepository;

  @Test
  void blankCustomerSearchReturnsStableDisplayNameOrderWithRequestedLimit() {
    customerRepository.save(customer("Zora Zimmer", "zora@example.test", "0300"));
    customerRepository.save(customer("anna Arnold", "anna@example.test", "0100"));
    customerRepository.save(customer("Berta Bauer", "berta@example.test", "0200"));

    assertThat(customerRepository.searchByQuery("", PageRequest.of(0, 2)))
        .extracting(Customer::getDisplayName)
        .containsExactly("anna Arnold", "Berta Bauer");
  }

  @Test
  void customerSearchMatchesDisplayNameEmailAndPhoneCaseInsensitively() {
    customerRepository.save(customer("Katja Krause", "katja@example.test", "+49 170 111"));
    customerRepository.save(customer("Milo Mustermann", "milo@example.test", "+49 170 222"));
    customerRepository.save(customer("Rudi Reuter", "rudi@example.test", "+49 170 333"));

    assertThat(customerRepository.searchByQuery("KRAUSE", PageRequest.of(0, 10)))
        .extracting(Customer::getDisplayName)
        .containsExactly("Katja Krause");
    assertThat(customerRepository.searchByQuery("MILO@EXAMPLE", PageRequest.of(0, 10)))
        .extracting(Customer::getDisplayName)
        .containsExactly("Milo Mustermann");
    assertThat(customerRepository.searchByQuery("333", PageRequest.of(0, 10)))
        .extracting(Customer::getDisplayName)
        .containsExactly("Rudi Reuter");
  }

  private static Customer customer(String displayName, String email, String phone) {
    Customer customer = new Customer(displayName);
    customer.setEmail(email);
    customer.setPhone(phone);
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }
}
