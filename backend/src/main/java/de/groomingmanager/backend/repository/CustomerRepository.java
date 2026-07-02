package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {}
