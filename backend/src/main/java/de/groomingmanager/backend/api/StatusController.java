package de.groomingmanager.backend.api;

import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
public class StatusController {

  @GetMapping
  public StatusResponse status() {
    return new StatusResponse("ok", Instant.now());
  }

  public record StatusResponse(String status, Instant timestamp) {}
}
