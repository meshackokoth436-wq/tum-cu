-- 009: Persistent ministry landing-page profiles
-- MySQL is the authoritative source for ministry profile content.
ALTER TABLE ministries
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL AFTER code,
  ADD COLUMN IF NOT EXISTS landing_image_url VARCHAR(500) NULL AFTER photo_url,
  ADD COLUMN IF NOT EXISTS landing_caption TEXT NULL AFTER landing_image_url;
