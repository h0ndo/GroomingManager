-- Personal dog favorites per groomer/admin user.
-- The groomer/admin reference is the Keycloak subject because app users live in Keycloak.

CREATE TABLE dog_favorites (
    id BIGSERIAL PRIMARY KEY,
    groomer_subject VARCHAR(255) NOT NULL,
    pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dog_favorites_groomer_pet UNIQUE (groomer_subject, pet_id)
);

CREATE INDEX idx_dog_favorites_groomer_created
    ON dog_favorites (groomer_subject, created_at DESC, id DESC);

CREATE INDEX idx_dog_favorites_pet
    ON dog_favorites (pet_id);
