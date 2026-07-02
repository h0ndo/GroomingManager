package de.groomingmanager.backend.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({ServiceOfferingController.class, AdminServiceOfferingController.class})
@Import(SecurityConfig.class)
class ServiceOfferingControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private ServiceOfferingRepository serviceOfferingRepository;

  @Test
  void publicServicesReturnOnlyActiveOfferingsOrderedByName() throws Exception {
    when(serviceOfferingRepository.findByActiveTrueOrderByNameAsc())
        .thenReturn(
            List.of(
                offering(2L, "Haare schneiden (Klein)", "30.00", true),
                offering(1L, "Krallen kuerzen", "10.00", true)));

    mockMvc
        .perform(get("/api/services"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(2))
        .andExpect(jsonPath("$[0].name").value("Haare schneiden (Klein)"))
        .andExpect(jsonPath("$[0].price").value(30.00))
        .andExpect(jsonPath("$[0].active").value(true));
  }

  @Test
  void adminCanCreateServiceOffering() throws Exception {
    when(serviceOfferingRepository.save(any(ServiceOffering.class)))
        .thenAnswer(
            invocation -> {
              ServiceOffering offering = invocation.getArgument(0);
              offering.setId(42L);
              return offering;
            });

    mockMvc
        .perform(
            post("/api/admin/services")
                .with(jwtWithRole("admin", "ROLE_admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name":" Baden & Schneiden ","price":45.5,"active":true}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(42))
        .andExpect(jsonPath("$.name").value("Baden & Schneiden"))
        .andExpect(jsonPath("$.price").value(45.50))
        .andExpect(jsonPath("$.active").value(true));
  }

  @Test
  void adminCanDeleteServiceOffering() throws Exception {
    ServiceOffering offering = offering(7L, "Krallen kuerzen", "10.00", true);
    when(serviceOfferingRepository.findById(7L)).thenReturn(Optional.of(offering));

    mockMvc
        .perform(delete("/api/admin/services/7").with(jwtWithRole("admin", "ROLE_admin")))
        .andExpect(status().isNoContent());

    verify(serviceOfferingRepository).delete(offering);
  }

  @Test
  void nonAdminCannotCreateServiceOffering() throws Exception {
    mockMvc
        .perform(
            post("/api/admin/services")
                .with(jwtWithRole("kunde", "ROLE_kunde"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name":"Bad","price":1}
                    """))
        .andExpect(status().isForbidden());
  }

  private static ServiceOffering offering(Long id, String name, String price, boolean active) {
    ServiceOffering offering = new ServiceOffering();
    offering.setId(id);
    offering.setName(name);
    offering.setPrice(new BigDecimal(price));
    offering.setActive(active);
    offering.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    offering.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return offering;
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
