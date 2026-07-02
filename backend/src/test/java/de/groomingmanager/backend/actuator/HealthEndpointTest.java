package de.groomingmanager.backend.actuator;

import static org.assertj.core.api.Assertions.assertThat;

import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.PetRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "spring.autoconfigure.exclude="
          + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
    })
class HealthEndpointTest {

  @Autowired private TestRestTemplate restTemplate;

  @MockitoBean private AppointmentRepository appointmentRepository;
  @MockitoBean private PetRepository petRepository;
  @MockitoBean private ServiceOfferingRepository serviceOfferingRepository;

  @Test
  void exposesLivenessProbe() {
    ResponseEntity<String> response =
        restTemplate.getForEntity("/actuator/health/liveness", String.class);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).contains("UP");
  }

  @Test
  void exposesReadinessProbe() {
    ResponseEntity<String> response =
        restTemplate.getForEntity("/actuator/health/readiness", String.class);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).contains("UP");
  }
}
