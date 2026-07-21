package de.groomingmanager.backend.api;

import java.util.List;
import java.util.Map;

record WorkspaceBootstrapDto(
    String subject,
    List<String> roles,
    List<WorkspaceDomainDto> domains,
    List<WorkspaceInstanceDto> instances) {}

record WorkspaceDomainDto(
    String id,
    String label,
    String kind,
    boolean visible,
    Map<String, Object> summary,
    List<String> actions) {}

record WorkspaceInstanceDto(
    String type,
    String id,
    String label,
    String description,
    String parentDomainId,
    List<String> actions) {}
