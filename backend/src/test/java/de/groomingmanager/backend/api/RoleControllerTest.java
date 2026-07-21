package de.groomingmanager.backend.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoleController.class)
@Import(SecurityConfig.class)
class RoleControllerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void roleEndpointsRequireAuthentication() throws Exception {
    mockMvc.perform(get("/api/admin/me")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/groomer/me")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/kunde/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void adminEndpointAllowsAdmin() throws Exception {
    mockMvc
        .perform(get("/api/admin/me").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.area").value("admin"))
        .andExpect(jsonPath("$.username").value("admin-1"))
        .andExpect(jsonPath("$.roles[0]").value("ROLE_admin"));
  }

  @Test
  void groomerEndpointAllowsGroomer() throws Exception {
    mockMvc
        .perform(get("/api/groomer/me").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.area").value("groomer"))
        .andExpect(jsonPath("$.username").value("groomer-1"))
        .andExpect(jsonPath("$.roles[0]").value("ROLE_groomer"));
  }

  @Test
  void kundeEndpointAllowsCustomer() throws Exception {
    mockMvc
        .perform(get("/api/kunde/me").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.area").value("kunde"))
        .andExpect(jsonPath("$.username").value("kunde-1"))
        .andExpect(jsonPath("$.roles[0]").value("ROLE_kunde"));
  }

  @Test
  void roleEndpointsRejectWrongRole() throws Exception {
    mockMvc
        .perform(get("/api/admin/me").with(jwtWithRole("kunde-1", "ROLE_kunde")))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(get("/api/groomer/me").with(jwtWithRole("admin-1", "ROLE_admin")))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(get("/api/kunde/me").with(jwtWithRole("groomer-1", "ROLE_groomer")))
        .andExpect(status().isForbidden());
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor jwtWithRole(
      String subject, String role) {
    return jwt().jwt(token -> token.subject(subject)).authorities(new SimpleGrantedAuthority(role));
  }
}
