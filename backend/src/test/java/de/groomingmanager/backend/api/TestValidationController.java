package de.groomingmanager.backend.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test-validation")
class TestValidationController {

  @PostMapping
  ValidationPayload validate(@Valid @RequestBody ValidationPayload payload) {
    return payload;
  }

  record ValidationPayload(@NotBlank String name) {}
}
