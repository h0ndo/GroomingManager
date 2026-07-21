package de.groomingmanager.backend.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

record AppointmentDto(
    Long id,
    String ownerSubject,
    LocalDate appointmentDate,
    String timeSlot,
    Long serviceOfferingId,
    String serviceName,
    BigDecimal servicePrice,
    String status) {}

record DayAppointmentDto(
    Long id,
    LocalDate appointmentDate,
    String timeSlot,
    String customerDisplayName,
    String petName,
    Long serviceOfferingId,
    String serviceName,
    String status,
    String assignedGroomerSubject,
    String assignedGroomerDisplayName) {}

record BookAppointmentRequest(
    @NotNull LocalDate appointmentDate, @NotBlank String timeSlot, Long serviceOfferingId) {}
