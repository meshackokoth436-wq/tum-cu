-- TECUMP Migration 010: Persistent landing-page backdrop carousel
-- MySQL is authoritative for backdrop metadata and ordering.
CREATE TABLE IF NOT EXISTS landing_media_backdrops (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_landing_backdrops_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO landing_media_backdrops (id, src, title, is_active, display_order)
SELECT * FROM (
  SELECT 'backdrop-1', '/tum-gate-monument.jpg', 'TUM Main Entrance Monument & Heritage', 1, 1
  UNION ALL SELECT 'backdrop-2', '/community/community-1.jpg', 'Student Intercession & Prayer Gathering', 1, 2
  UNION ALL SELECT 'backdrop-3', '/community/community-2.jpg', 'Joyful Praise & Worship in Unity', 1, 3
  UNION ALL SELECT 'backdrop-4', '/community/community-3.jpg', 'Christian Fellowship & Discipleship', 1, 4
  UNION ALL SELECT 'backdrop-5', '/community/community-5.jpg', 'Campus Evangelism & Servant Leadership', 1, 5
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM landing_media_backdrops LIMIT 1);
