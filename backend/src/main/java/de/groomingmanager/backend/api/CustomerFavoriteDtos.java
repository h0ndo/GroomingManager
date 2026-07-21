package de.groomingmanager.backend.api;

record CustomerFavoriteDto(
    Long customerId, String firstName, String lastName, String profileImageBase64) {}
