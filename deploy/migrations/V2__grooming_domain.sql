-- Grooming domain migrated from the previous GroomingManager backend.

CREATE TABLE service_offerings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_offerings_active_name
    ON service_offerings (active, name);

CREATE TABLE pets (
    id BIGSERIAL PRIMARY KEY,
    owner_subject VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255) NOT NULL DEFAULT '',
    size VARCHAR(80) NOT NULL DEFAULT '',
    grooming_notes TEXT NOT NULL DEFAULT '',
    image BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_owner_created
    ON pets (owner_subject, created_at DESC);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    owner_subject VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    service_offering_id BIGINT REFERENCES service_offerings(id) ON DELETE SET NULL,
    service_name VARCHAR(255),
    service_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_appointments_date_slot UNIQUE (appointment_date, time_slot)
);

CREATE INDEX idx_appointments_owner_created
    ON appointments (owner_subject, created_at DESC);
CREATE INDEX idx_appointments_date
    ON appointments (appointment_date);
