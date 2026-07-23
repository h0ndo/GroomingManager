package de.groomingmanager.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(
    name = "dog_favorites",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_dog_favorites_groomer_pet",
            columnNames = {"groomer_subject", "pet_id"}),
    indexes = {
      @Index(
          name = "idx_dog_favorites_groomer_created",
          columnList = "groomer_subject, created_at"),
      @Index(name = "idx_dog_favorites_pet", columnList = "pet_id")
    })
public class DogFavorite {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Column(name = "groomer_subject", nullable = false)
  private String groomerSubject;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "pet_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Pet pet;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected DogFavorite() {}

  public DogFavorite(String groomerSubject, Pet pet) {
    this.groomerSubject = groomerSubject;
    this.pet = pet;
  }

  public Long getId() {
    return id;
  }

  public String getGroomerSubject() {
    return groomerSubject;
  }

  public void setGroomerSubject(String groomerSubject) {
    this.groomerSubject = groomerSubject;
  }

  public Pet getPet() {
    return pet;
  }

  public void setPet(Pet pet) {
    this.pet = pet;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
