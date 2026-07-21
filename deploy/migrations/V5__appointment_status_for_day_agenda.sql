ALTER TABLE appointments
    ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'REQUESTED';

ALTER TABLE appointments
    ADD CONSTRAINT chk_appointments_status
    CHECK (status IN ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

CREATE INDEX idx_appointments_day_agenda
    ON appointments (appointment_date, time_slot, id);
