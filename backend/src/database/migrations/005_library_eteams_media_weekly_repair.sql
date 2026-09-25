-- ============================================================================
-- TECUMP / TUMCU Migration 005: Library, E-Teams, Landing Media, Ministry Media,
-- Weekly Programmes & Member Gallery Schema Unification
-- Safe for MySQL 8.0.29+ and Hostinger cloud instances. Idempotent.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. RECONCILE WEEKLY PROGRAMMES
-- Accommodate day, title, time, venue, leader, description, active, display_order
ALTER TABLE weekly_programmes
  ADD COLUMN IF NOT EXISTS day VARCHAR(20) NOT NULL DEFAULT 'Sunday' AFTER id,
  ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT 'Fellowship Program' AFTER day,
  ADD COLUMN IF NOT EXISTS time VARCHAR(100) NOT NULL DEFAULT '5:00 PM - 7:00 PM' AFTER programme_type,
  ADD COLUMN IF NOT EXISTS leader VARCHAR(150) NULL AFTER venue,
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER leader,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER description,
  ADD COLUMN IF NOT EXISTS display_order SMALLINT NOT NULL DEFAULT 1 AFTER is_active,
  ADD COLUMN IF NOT EXISTS alternating_mode ENUM('none','monday_alternate','custom') NOT NULL DEFAULT 'none' AFTER display_order,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL AFTER created_at;

-- Allow scheduled_at and created_by to be nullable if used in simple weekly schedule mode
ALTER TABLE weekly_programmes
  MODIFY COLUMN scheduled_at DATETIME NULL,
  MODIFY COLUMN created_by CHAR(36) NULL;

-- 2. ENHANCE MINISTRIES FOR PERSISTENT BACKGROUND & BRANDING
ALTER TABLE ministries
  ADD COLUMN IF NOT EXISTS background_image_url VARCHAR(500) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL AFTER background_image_url,
  ADD COLUMN IF NOT EXISTS leader_id CHAR(36) NULL AFTER photo_url,
  ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(100) NULL AFTER leader_id,
  ADD COLUMN IF NOT EXISTS meeting_venue VARCHAR(200) NULL AFTER meeting_time,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

-- 3. ENHANCE LIBRARY RESOURCES FOR PHYSICAL & DIGITAL LIBRARY
ALTER TABLE library_resources
  ADD COLUMN IF NOT EXISTS isbn VARCHAR(50) NULL AFTER category,
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER isbn,
  ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(100) NULL AFTER cover_image_url,
  ADD COLUMN IF NOT EXISTS condition_status ENUM('excellent','good','fair','needs_repair') NOT NULL DEFAULT 'good' AFTER shelf_location,
  ADD COLUMN IF NOT EXISTS borrowed_count INT NOT NULL DEFAULT 0 AFTER condition_status,
  ADD COLUMN IF NOT EXISTS librarian_notes TEXT NULL AFTER borrowed_count,
  ADD COLUMN IF NOT EXISTS status ENUM('available','maintenance','archived') NOT NULL DEFAULT 'available' AFTER librarian_notes,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

-- 4. ENHANCE LIBRARY BORROWINGS
ALTER TABLE library_borrowings
  ADD COLUMN IF NOT EXISTS status ENUM('active','returned','overdue') NOT NULL DEFAULT 'active' AFTER overdue_notice_sent,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS issued_by CHAR(36) NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS returned_to CHAR(36) NULL AFTER issued_by,
  ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

-- 5. ENHANCE LIBRARY RESERVATIONS / REQUESTS
ALTER TABLE library_reservations
  ADD COLUMN IF NOT EXISTS needed_date DATE NULL AFTER status,
  ADD COLUMN IF NOT EXISTS return_period_days SMALLINT NOT NULL DEFAULT 14 AFTER needed_date,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER return_period_days,
  ADD COLUMN IF NOT EXISTS approved_by CHAR(36) NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN IF NOT EXISTS rejected_reason VARCHAR(255) NULL AFTER approved_at,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

-- Modify reservation status enum if needed to support full workflow
ALTER TABLE library_reservations
  MODIFY COLUMN status ENUM('pending','approved','ready_for_collection','fulfilled','rejected','cancelled') NOT NULL DEFAULT 'pending';

-- 6. PERSISTENT LANDING MEDIA TABLES (Authoritative MySQL Storage)
CREATE TABLE IF NOT EXISTS landing_media_config (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  rotate_interval_ms INT NOT NULL DEFAULT 4000,
  background_src VARCHAR(500) NOT NULL DEFAULT '/tum-gate-monument.jpg',
  background_opacity DECIMAL(3,2) NOT NULL DEFAULT 0.80,
  background_blur_px SMALLINT NOT NULL DEFAULT 1,
  background_title VARCHAR(200) NOT NULL DEFAULT 'TUM Main Entrance Gate Monument',
  last_updated_by VARCHAR(150) NOT NULL DEFAULT 'System Administrator',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS landing_media_slides (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NOT NULL,
  eyebrow VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS landing_media_gallery (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  alt VARCHAR(255) NOT NULL DEFAULT 'TUMCU Community',
  caption VARCHAR(255) NULL,
  span VARCHAR(50) NOT NULL DEFAULT 'standard',
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. MEMBER GALLERY ALBUMS (Google Photos & Curated CU Photos)
CREATE TABLE IF NOT EXISTS gallery_albums (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category ENUM('sunday_services','worship_services','prayer_meetings','conferences','retreats','evangelism','missions','fellowships','special_events','other') NOT NULL DEFAULT 'special_events',
  event_type VARCHAR(100) NULL,
  event_date DATE NOT NULL,
  description TEXT NULL,
  cover_image_url VARCHAR(500) NOT NULL,
  google_photos_url VARCHAR(1000) NULL,
  photo_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_published (is_published, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ENHANCE EVANGELISM TEAMS FOR NORET & SORET
ALTER TABLE evangelism_teams
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(50) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL AFTER short_name,
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER region,
  ADD COLUMN IF NOT EXISTS mission_purpose TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS vision TEXT NULL AFTER mission_purpose,
  ADD COLUMN IF NOT EXISTS scripture_theme VARCHAR(255) NULL AFTER vision,
  ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) NULL AFTER scripture_theme,
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL AFTER cover_image_url,
  ADD COLUMN IF NOT EXISTS meeting_schedule VARCHAR(200) NULL AFTER logo_url,
  ADD COLUMN IF NOT EXISTS meeting_venue VARCHAR(200) NULL AFTER meeting_schedule,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER meeting_venue,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

-- 9. E-TEAM PROGRAMMES & ACTIVITIES
CREATE TABLE IF NOT EXISTS eteam_programmes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  activity_type ENUM('fellowship','prayer','evangelism','mission','discipleship','bible_study','training','bonding','outreach','followup','special') NOT NULL DEFAULT 'fellowship',
  scheduled_date DATE NOT NULL,
  time_slot VARCHAR(100) NOT NULL DEFAULT '5:00 PM - 7:00 PM',
  venue VARCHAR(200) NOT NULL,
  description TEXT NULL,
  leader_name VARCHAR(150) NULL,
  status ENUM('scheduled','completed','cancelled','postponed') NOT NULL DEFAULT 'scheduled',
  cover_image_url VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ep_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_ep_team_date (team_id, scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. E-TEAM EVENT PHOTOS & ALBUMS
CREATE TABLE IF NOT EXISTS eteam_gallery (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  caption TEXT NULL,
  image_url VARCHAR(500) NOT NULL,
  google_photos_url VARCHAR(1000) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eg_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_eg_team_date (team_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. E-TEAM OUTREACH & MISSION REPORTS
CREATE TABLE IF NOT EXISTS eteam_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  activity_date DATE NOT NULL,
  location VARCHAR(200) NOT NULL,
  participants_count INT NOT NULL DEFAULT 0,
  souls_reached INT NOT NULL DEFAULT 0,
  outreach_type VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  outcomes TEXT NULL,
  follow_up_notes TEXT NULL,
  submitted_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_erpt_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_erpt_team (team_id, activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. E-TEAM ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS eteam_announcements (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority ENUM('normal','high','urgent') NOT NULL DEFAULT 'normal',
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  created_by CHAR(36) NOT NULL,
  CONSTRAINT fk_eann_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_eann_team (team_id, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
