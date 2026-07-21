-- Personal customer favorites per groomer/admin user.
-- The groomer/admin reference is the Keycloak subject because app users live in Keycloak.

CREATE TABLE customer_favorites (
    id BIGSERIAL PRIMARY KEY,
    groomer_subject VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_customer_favorites_groomer_customer UNIQUE (groomer_subject, customer_id)
);

CREATE INDEX idx_customer_favorites_groomer_created
    ON customer_favorites (groomer_subject, created_at DESC, id DESC);

CREATE INDEX idx_customer_favorites_customer
    ON customer_favorites (customer_id);
