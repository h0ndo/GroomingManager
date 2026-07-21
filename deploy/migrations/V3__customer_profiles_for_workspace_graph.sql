-- Extend customers into fachliche Kund:innenprofile for workspace graph data.

ALTER TABLE customers
    ADD COLUMN keycloak_subject VARCHAR(255),
    ADD COLUMN email VARCHAR(255),
    ADD COLUMN phone VARCHAR(255),
    ADD COLUMN communication_notes TEXT NOT NULL DEFAULT '',
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX uq_customers_keycloak_subject
    ON customers (keycloak_subject)
    WHERE keycloak_subject IS NOT NULL;

CREATE INDEX idx_customers_display_name_lower
    ON customers (lower(display_name));
