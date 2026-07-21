package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.Customer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

  Optional<Customer> findByKeycloakSubject(String keycloakSubject);

  @Query(
      """
      select customer
      from Customer customer
      where :query = ''
         or lower(customer.displayName) like lower(concat('%', :query, '%'))
         or lower(coalesce(customer.email, '')) like lower(concat('%', :query, '%'))
         or lower(coalesce(customer.phone, '')) like lower(concat('%', :query, '%'))
      order by lower(customer.displayName) asc, customer.id asc
      """)
  List<Customer> searchByQuery(@Param("query") String query, Pageable pageable);
}
