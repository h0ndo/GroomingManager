package de.groomingmanager.backend.api;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RoleController {

  @GetMapping("/admin/me")
  @PreAuthorize("hasRole('admin')")
  public RoleResponse admin(Authentication authentication) {
    return response("admin", authentication);
  }

  @GetMapping("/fuehrungskraft/me")
  @PreAuthorize("hasRole('fuehrungskraft')")
  public RoleResponse fuehrungskraft(Authentication authentication) {
    return response("fuehrungskraft", authentication);
  }

  @GetMapping("/angestellter/me")
  @PreAuthorize("hasRole('angestellter')")
  public RoleResponse angestellter(Authentication authentication) {
    return response("angestellter", authentication);
  }

  @GetMapping("/kunde/me")
  @PreAuthorize("hasRole('kunde')")
  public RoleResponse kunde(Authentication authentication) {
    return response("kunde", authentication);
  }

  private RoleResponse response(String area, Authentication authentication) {
    List<String> roles =
        authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .sorted()
            .toList();
    return new RoleResponse(area, authentication.getName(), roles);
  }

  public record RoleResponse(String area, String username, List<String> roles) {}
}
