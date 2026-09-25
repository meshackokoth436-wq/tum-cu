-- Public/member-facing leadership profiles. Kept separate from RBAC appointments.
CREATE TABLE IF NOT EXISTS leadership_public_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  assignment_id CHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(150) NULL,
  photo_url VARCHAR(500) NULL,
  public_email VARCHAR(150) NULL,
  public_phone VARCHAR(30) NULL,
  bio TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lpp_assignment FOREIGN KEY (assignment_id) REFERENCES leadership_assignments(id) ON DELETE CASCADE,
  INDEX idx_lpp_visible_order (is_visible, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
