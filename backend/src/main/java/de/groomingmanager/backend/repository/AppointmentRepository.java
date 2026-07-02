package de.groomingmanager.backend.repository;

import de.groomingmanager.backend.domain.Appointment;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
  boolean existsByAppointmentDateAndTimeSlot(LocalDate appointmentDate, String timeSlot);

  List<Appointment> findByOwnerSubjectOrderByCreatedAtDesc(String ownerSubject);

  List<Appointment> findTop10ByOrderByCreatedAtDesc();
}
