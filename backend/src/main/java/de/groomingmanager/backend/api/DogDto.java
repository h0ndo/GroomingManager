package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import java.util.Base64;

record DogDto(
    Long dogId,
    Long petId,
    Long id,
    String name,
    String dogName,
    Long customerId,
    String customerName,
    String customerDisplayName,
    String ownerDisplayName,
    String breed,
    String size,
    String groomingNotes,
    String imageBase64) {

  static DogDto from(Pet pet, Customer customer) {
    String customerName = customer == null ? null : customer.getDisplayName();
    Long customerId = customer == null ? null : customer.getId();
    String imageBase64 =
        pet.getImage() == null ? null : Base64.getEncoder().encodeToString(pet.getImage());
    return new DogDto(
        pet.getId(),
        pet.getId(),
        pet.getId(),
        pet.getName(),
        pet.getName(),
        customerId,
        customerName,
        customerName,
        customerName,
        pet.getBreed(),
        pet.getSize(),
        pet.getGroomingNotes(),
        imageBase64);
  }
}
