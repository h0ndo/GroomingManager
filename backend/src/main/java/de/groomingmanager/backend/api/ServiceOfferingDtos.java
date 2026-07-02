package de.groomingmanager.backend.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

record ServiceOfferingDto(Long id, String name, BigDecimal price, boolean active) {}

record UpsertServiceOfferingRequest(
    @NotBlank String name, @DecimalMin(value = "0.01") BigDecimal price, boolean active) {}
