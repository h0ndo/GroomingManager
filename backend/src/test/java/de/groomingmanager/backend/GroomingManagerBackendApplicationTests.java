package de.groomingmanager.backend;

import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.CustomerFavoriteRepository;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
    properties = {
      "spring.autoconfigure.exclude="
          + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
    })
class GroomingManagerBackendApplicationTests {

  @MockitoBean private AppointmentRepository appointmentRepository;
  @MockitoBean private CustomerFavoriteRepository customerFavoriteRepository;
  @MockitoBean private CustomerRepository customerRepository;
  @MockitoBean private PetRepository petRepository;
  @MockitoBean private ServiceOfferingRepository serviceOfferingRepository;

  @Test
  void contextLoads() {}
}
