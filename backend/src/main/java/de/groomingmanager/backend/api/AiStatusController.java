package de.groomingmanager.backend.api;

import de.groomingmanager.backend.config.LlmProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiStatusController {

  private final LlmProperties llmProperties;

  public AiStatusController(LlmProperties llmProperties) {
    this.llmProperties = llmProperties;
  }

  @GetMapping("/status")
  public AiStatus status() {
    return new AiStatus(
        llmProperties.enabled(), llmProperties.model(), llmProperties.visionEnabled());
  }

  public record AiStatus(boolean enabled, String model, boolean visionEnabled) {}
}
