-- Persist fachliche Pet/Customer assignment for dogs created from customer workspaces.

ALTER TABLE pets
    ADD COLUMN customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;

UPDATE pets pet
SET customer_id = customer.id
FROM customers customer
WHERE pet.customer_id IS NULL
  AND (
      pet.owner_subject = customer.keycloak_subject
      OR pet.owner_subject = concat('customer:', customer.id)
  );

CREATE INDEX idx_pets_customer_created
    ON pets (customer_id, created_at DESC);
