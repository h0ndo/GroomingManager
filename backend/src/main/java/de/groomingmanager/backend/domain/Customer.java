package de.groomingmanager.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "customers")
public class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Column(nullable = false)
  private String displayName;

  @Column(unique = true)
  private String keycloakSubject;

  @Email private String email;

  private String phone;

  @Column(nullable = false)
  private String communicationNotes = "";

  @Column(name = "profile_image", columnDefinition = "bytea")
  private byte[] profileImage;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  protected Customer() {}

  public Customer(String displayName) {
    this.displayName = displayName;
  }

  public Long getId() {
    return id;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getKeycloakSubject() {
    return keycloakSubject;
  }

  public void setKeycloakSubject(String keycloakSubject) {
    this.keycloakSubject = keycloakSubject;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getCommunicationNotes() {
    return communicationNotes;
  }

  public void setCommunicationNotes(String communicationNotes) {
    this.communicationNotes = communicationNotes;
  }

  public byte[] getProfileImage() {
    return profileImage;
  }

  public void setProfileImage(byte[] profileImage) {
    this.profileImage = profileImage;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    updatedAt = now;
    if (communicationNotes == null) {
      communicationNotes = "";
    }
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
    if (communicationNotes == null) {
      communicationNotes = "";
    }
  }
}
