package de.groomingmanager.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "appointments")
public class Appointment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "owner_subject", nullable = false)
  private String ownerSubject = "";

  @Column(name = "appointment_date", nullable = false)
  private LocalDate appointmentDate;

  @Column(name = "time_slot", nullable = false)
  private String timeSlot = "";

  @Column(name = "service_offering_id")
  private Long serviceOfferingId;

  @Column(name = "service_name")
  private String serviceName;

  @Column(name = "service_price", precision = 10, scale = 2)
  private BigDecimal servicePrice;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getOwnerSubject() {
    return ownerSubject;
  }

  public void setOwnerSubject(String ownerSubject) {
    this.ownerSubject = ownerSubject;
  }

  public LocalDate getAppointmentDate() {
    return appointmentDate;
  }

  public void setAppointmentDate(LocalDate appointmentDate) {
    this.appointmentDate = appointmentDate;
  }

  public String getTimeSlot() {
    return timeSlot;
  }

  public void setTimeSlot(String timeSlot) {
    this.timeSlot = timeSlot;
  }

  public Long getServiceOfferingId() {
    return serviceOfferingId;
  }

  public void setServiceOfferingId(Long serviceOfferingId) {
    this.serviceOfferingId = serviceOfferingId;
  }

  public String getServiceName() {
    return serviceName;
  }

  public void setServiceName(String serviceName) {
    this.serviceName = serviceName;
  }

  public BigDecimal getServicePrice() {
    return servicePrice;
  }

  public void setServicePrice(BigDecimal servicePrice) {
    this.servicePrice = servicePrice;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
