-- Baseline schema for GroomingManager app database.

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL
);
