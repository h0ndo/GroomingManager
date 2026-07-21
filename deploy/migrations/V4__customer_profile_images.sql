-- Add optional customer profile images for personalized workspace/profile views.

ALTER TABLE customers
    ADD COLUMN profile_image BYTEA;