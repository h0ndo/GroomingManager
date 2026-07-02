package de.groomingmanager.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "customers")
public class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Column(nullable = false)
  private String displayName;

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
}
