package de.groomingmanager.backend.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.groomingmanager.backend.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TestValidationController.class)
@Import(SecurityConfig.class)
class ApiErrorHandlerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void validationErrorsUseProblemDetailsWithFieldErrors() throws Exception {
    mockMvc
        .perform(
            post("/api/test-validation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}")
                .with(jwt()))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.type").value("https://grooming-manager.local/problems/validation-error"))
        .andExpect(jsonPath("$.title").value("Validation failed"))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.errors.name").exists());
  }
}
