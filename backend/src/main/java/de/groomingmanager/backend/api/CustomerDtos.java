package de.groomingmanager.backend.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

record CustomerDto(
    Long id,
    String keycloakSubject,
    String displayName,
    String email,
    String phone,
    String communicationNotes,
    String profileImageBase64) {}

record UpsertCustomerRequest(
    String keycloakSubject,
    @NotBlank String displayName,
    @Email String email,
    String phone,
    String communicationNotes,
    String profileImageBase64) {}
