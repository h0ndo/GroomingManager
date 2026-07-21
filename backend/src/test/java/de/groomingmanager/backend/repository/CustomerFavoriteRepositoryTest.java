package de.groomingmanager.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.CustomerFavorite;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class CustomerFavoriteRepositoryTest {

  @Autowired private CustomerFavoriteRepository customerFavoriteRepository;

  @Autowired private CustomerRepository customerRepository;

  @Autowired private TestEntityManager entityManager;

  @Test
  void storesFavoritesPerGroomerIndependently() {
    Customer customer = customerRepository.save(customer("Katja Krause"));
    Customer otherCustomer = customerRepository.save(customer("Milo Mustermann"));

    customerFavoriteRepository.save(new CustomerFavorite("groomer-1", customer));
    customerFavoriteRepository.save(new CustomerFavorite("groomer-2", customer));
    customerFavoriteRepository.save(new CustomerFavorite("groomer-1", otherCustomer));

    assertThat(
            customerFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .extracting(favorite -> favorite.getCustomer().getDisplayName())
        .containsExactly("Milo Mustermann", "Katja Krause");

    assertThat(
            customerFavoriteRepository.findByGroomerSubjectAndCustomerId(
                "groomer-2", customer.getId()))
        .isPresent();
  }

  @Test
  void rejectsDuplicateFavoriteForSameGroomerAndCustomer() {
    Customer customer = customerRepository.save(customer("Katja Krause"));
    customerFavoriteRepository.saveAndFlush(new CustomerFavorite("groomer-1", customer));

    assertThatThrownBy(
            () ->
                customerFavoriteRepository.saveAndFlush(
                    new CustomerFavorite("groomer-1", customer)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void removingCustomerRemovesItsFavorites() {
    Customer customer = customerRepository.save(customer("Katja Krause"));
    customerFavoriteRepository.saveAndFlush(new CustomerFavorite("groomer-1", customer));
    Long customerId = customer.getId();

    entityManager.clear();
    Customer managedCustomer = entityManager.find(Customer.class, customerId);

    entityManager.remove(managedCustomer);
    entityManager.flush();
    entityManager.clear();

    assertThat(
            customerFavoriteRepository.findByGroomerSubjectOrderByCreatedAtDescIdDesc("groomer-1"))
        .isEmpty();
  }

  private static Customer customer(String displayName) {
    Customer customer = new Customer(displayName);
    customer.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    customer.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return customer;
  }
}
