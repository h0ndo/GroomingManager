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
    name = "customer_favorites",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_customer_favorites_groomer_customer",
            columnNames = {"groomer_subject", "customer_id"}),
    indexes = {
      @Index(
          name = "idx_customer_favorites_groomer_created",
          columnList = "groomer_subject, created_at"),
      @Index(name = "idx_customer_favorites_customer", columnList = "customer_id")
    })
public class CustomerFavorite {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Column(name = "groomer_subject", nullable = false)
  private String groomerSubject;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "customer_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Customer customer;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected CustomerFavorite() {}

  public CustomerFavorite(String groomerSubject, Customer customer) {
    this.groomerSubject = groomerSubject;
    this.customer = customer;
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

  public Customer getCustomer() {
    return customer;
  }

  public void setCustomer(Customer customer) {
    this.customer = customer;
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
