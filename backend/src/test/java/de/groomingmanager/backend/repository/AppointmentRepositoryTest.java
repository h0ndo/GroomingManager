package de.groomingmanager.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.AppointmentStatus;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class AppointmentRepositoryTest {

  @Autowired private AppointmentRepository appointmentRepository;

  @Test
  void findsAppointmentsForDaySortedByTimeSlotThenId() {
    Appointment firstSameSlot = appointment("kunde-1", "2026-08-15", "09:00");
    Appointment otherDay = appointment("kunde-2", "2026-08-16", "08:00");
    Appointment laterSlot = appointment("kunde-3", "2026-08-15", "12:00");
    Appointment secondSameSlot = appointment("kunde-4", "2026-08-15", "09:00");
    appointmentRepository.save(firstSameSlot);
    appointmentRepository.save(otherDay);
    appointmentRepository.save(laterSlot);
    appointmentRepository.save(secondSameSlot);

    assertThat(
            appointmentRepository.findByAppointmentDateOrderByTimeSlotAscIdAsc(
                LocalDate.parse("2026-08-15")))
        .extracting(Appointment::getOwnerSubject)
        .containsExactly("kunde-1", "kunde-4", "kunde-3");
  }

  private static Appointment appointment(String ownerSubject, String date, String timeSlot) {
    Appointment appointment = new Appointment();
    appointment.setOwnerSubject(ownerSubject);
    appointment.setAppointmentDate(LocalDate.parse(date));
    appointment.setTimeSlot(timeSlot);
    appointment.setStatus(AppointmentStatus.REQUESTED);
    appointment.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    return appointment;
  }
}
