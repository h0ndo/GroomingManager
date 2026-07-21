-- Dev-only customer seed for local GroomingManager databases.
-- Not part of Flyway production migrations. Re-runnable without creating duplicates.

WITH seed_customers(display_name, email, phone, communication_notes, keycloak_subject) AS (
    VALUES
        ('Katja Gross', 'katja.gross@grooming-manager.local', '+49 30 1000001', 'Bekannte Testkundin; bevorzugt SMS am Nachmittag.', NULL),
        ('Mila Muster', 'mila.muster@grooming-manager.local', '+49 30 1000002', 'Bekannte Testkundin; reagiert schnell per E-Mail.', NULL),
        ('Alex Sommer', 'alex.sommer@grooming-manager.local', '+49 30 1000003', 'Bekannter Testkunde; flexible Terminfenster.', NULL),
        ('Testfamilie Alpha', 'testfamilie.alpha@grooming-manager.local', '+49 30 2000001', 'Overflow-Suche Testfamilie; Hund bellt bei Föhn.', NULL),
        ('Testfamilie Beta', 'testfamilie.beta@grooming-manager.local', '+49 30 2000002', 'Overflow-Suche Testfamilie; bitte kurze Erinnerungen senden.', NULL),
        ('Testfamilie Gamma', 'testfamilie.gamma@grooming-manager.local', '+49 30 2000003', 'Overflow-Suche Testfamilie; bevorzugt Vormittag.', NULL),
        ('Testfamilie Delta', 'testfamilie.delta@grooming-manager.local', '+49 30 2000004', 'Overflow-Suche Testfamilie; Pflegehinweise telefonisch klären.', NULL),
        ('Testfamilie Epsilon', 'testfamilie.epsilon@grooming-manager.local', '+49 30 2000005', 'Overflow-Suche Testfamilie; bringt eigenen Maulkorb mit.', NULL),
        ('Testfamilie Zeta', 'testfamilie.zeta@grooming-manager.local', '+49 30 2000006', 'Overflow-Suche Testfamilie; nach Termin Fotos senden.', NULL),
        ('Testfamilie Eta', 'testfamilie.eta@grooming-manager.local', '+49 30 2000007', 'Overflow-Suche Testfamilie; bevorzugt ruhige Randzeiten.', NULL),
        ('Testfamilie Theta', 'testfamilie.theta@grooming-manager.local', '+49 30 2000008', 'Overflow-Suche Testfamilie; sensibler Hund, Pausen einplanen.', NULL),
        ('Rosa Richter', 'rosa.richter@grooming-manager.local', '+49 30 1000012', 'Weitere lokale Testkundin; bevorzugt Anruf.', NULL)
)
UPDATE customers AS customer
SET display_name = seed.display_name,
    phone = seed.phone,
    communication_notes = seed.communication_notes,
    keycloak_subject = seed.keycloak_subject,
    updated_at = now()
FROM seed_customers AS seed
WHERE lower(customer.email) = lower(seed.email);

WITH seed_customers(display_name, email, phone, communication_notes, keycloak_subject) AS (
    VALUES
        ('Katja Gross', 'katja.gross@grooming-manager.local', '+49 30 1000001', 'Bekannte Testkundin; bevorzugt SMS am Nachmittag.', NULL),
        ('Mila Muster', 'mila.muster@grooming-manager.local', '+49 30 1000002', 'Bekannte Testkundin; reagiert schnell per E-Mail.', NULL),
        ('Alex Sommer', 'alex.sommer@grooming-manager.local', '+49 30 1000003', 'Bekannter Testkunde; flexible Terminfenster.', NULL),
        ('Testfamilie Alpha', 'testfamilie.alpha@grooming-manager.local', '+49 30 2000001', 'Overflow-Suche Testfamilie; Hund bellt bei Föhn.', NULL),
        ('Testfamilie Beta', 'testfamilie.beta@grooming-manager.local', '+49 30 2000002', 'Overflow-Suche Testfamilie; bitte kurze Erinnerungen senden.', NULL),
        ('Testfamilie Gamma', 'testfamilie.gamma@grooming-manager.local', '+49 30 2000003', 'Overflow-Suche Testfamilie; bevorzugt Vormittag.', NULL),
        ('Testfamilie Delta', 'testfamilie.delta@grooming-manager.local', '+49 30 2000004', 'Overflow-Suche Testfamilie; Pflegehinweise telefonisch klären.', NULL),
        ('Testfamilie Epsilon', 'testfamilie.epsilon@grooming-manager.local', '+49 30 2000005', 'Overflow-Suche Testfamilie; bringt eigenen Maulkorb mit.', NULL),
        ('Testfamilie Zeta', 'testfamilie.zeta@grooming-manager.local', '+49 30 2000006', 'Overflow-Suche Testfamilie; nach Termin Fotos senden.', NULL),
        ('Testfamilie Eta', 'testfamilie.eta@grooming-manager.local', '+49 30 2000007', 'Overflow-Suche Testfamilie; bevorzugt ruhige Randzeiten.', NULL),
        ('Testfamilie Theta', 'testfamilie.theta@grooming-manager.local', '+49 30 2000008', 'Overflow-Suche Testfamilie; sensibler Hund, Pausen einplanen.', NULL),
        ('Rosa Richter', 'rosa.richter@grooming-manager.local', '+49 30 1000012', 'Weitere lokale Testkundin; bevorzugt Anruf.', NULL)
)
INSERT INTO customers (display_name, email, phone, communication_notes, keycloak_subject)
SELECT seed.display_name,
       seed.email,
       seed.phone,
       seed.communication_notes,
       seed.keycloak_subject
FROM seed_customers AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM customers AS existing_customer
    WHERE lower(existing_customer.email) = lower(seed.email)
);
