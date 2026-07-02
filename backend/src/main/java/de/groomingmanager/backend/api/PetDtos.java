package de.groomingmanager.backend.api;

import jakarta.validation.constraints.NotBlank;

record PetDto(
    Long id,
    String ownerSubject,
    String name,
    String breed,
    String size,
    String groomingNotes,
    String imageBase64) {}

record UpsertPetRequest(
    @NotBlank String name, String breed, String size, String groomingNotes, String imageBase64) {}
