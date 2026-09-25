-- ============================================================================
-- TECUMP Migration 006
-- Authentication hardening, simplified physical-library register, and
-- database-consistent E-Team contracts.
-- ============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Scoped E-Team RBAC is a first-class database scope.
ALTER TABLE user_roles
  MODIFY COLUMN scope_type ENUM('global','committee','ministry','executive','e_team') NOT NULL DEFAULT 'global';

-- 2. Physical books are NOT catalogued in TECUMP. Only the lending register
-- keeps a title snapshot when a librarian physically issues a book.
CREATE TABLE IF NOT EXISTS library_physical_loans (
  id CHAR(36) NOT NULL PRIMARY KEY,
  book_title VARCHAR(255) NOT NULL,
  user_id CHAR(36) NOT NULL,
  borrower_name VARCHAR(150) NOT NULL,
  borrower_email VARCHAR(190) NULL,
  borrower_phone VARCHAR(30) NULL,
  borrower_admission_number VARCHAR(80) NULL,
  borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at DATE NOT NULL,
  returned_at DATETIME NULL,
  status ENUM('active','returned') NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  issued_by CHAR(36) NOT NULL,
  returned_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lpl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_lpl_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_lpl_returned_by FOREIGN KEY (returned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_lpl_user (user_id, borrowed_at),
  INDEX idx_lpl_status_due (status, due_at),
  INDEX idx_lpl_title (book_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Explicit permissions used by the simplified librarian workflow.
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'library.checkout', 'library', 'Record a physical book loan'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'library.checkout');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'library.return', 'library', 'Record a physical book return'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'library.return');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'library.view_reports', 'library', 'View librarian borrowing statistics'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'library.view_reports');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.view', 'evangelism', 'View Evangelism Teams'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.view');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.manage_team', 'evangelism', 'Manage an assigned Evangelism Team'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.manage_team');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.manage_programmes', 'evangelism', 'Manage assigned E-Team programmes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.manage_programmes');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.manage_gallery', 'evangelism', 'Manage assigned E-Team gallery'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.manage_gallery');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.manage_reports', 'evangelism', 'Manage assigned E-Team reports'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.manage_reports');
INSERT INTO permissions (id, code, module, description)
SELECT UUID(), 'eteams.manage_announcements', 'evangelism', 'Manage assigned E-Team announcements'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'eteams.manage_announcements');

-- 4. One generic scoped chairperson role. Team assignment is represented by
-- user_roles.scope_type='e_team' and scope_id=<evangelism_teams.id>.
INSERT INTO roles (id, code, name, category, description, is_system_role)
SELECT UUID(), 'e_team_chairperson', 'E-Team Chairperson', 'committee',
       'Chairperson of a specific Evangelism Team; access is scoped to that team.', 0
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'e_team_chairperson');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'e_team_chairperson'
  AND p.code IN ('eteams.view','eteams.manage_team','eteams.manage_programmes','eteams.manage_gallery','eteams.manage_reports','eteams.manage_announcements','reports.view','reports.create','meetings.view','events.view','prayer.view','prayer.create','finance.request','attendance.record')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 5. Give each E-Team a stable machine-readable code.
ALTER TABLE evangelism_teams
  ADD COLUMN IF NOT EXISTS code VARCHAR(50) NULL AFTER name;

UPDATE evangelism_teams SET code = CASE
  WHEN id = 'eteam-noret' THEN 'NORET'
  WHEN id = 'eteam-soret' THEN 'SORET'
  ELSE CONCAT('ETEAM-', LEFT(id, 20))
END
WHERE code IS NULL OR code = '';

ALTER TABLE evangelism_teams ADD UNIQUE KEY uq_evangelism_team_code (code);

-- 6. Make E-Team leader nullable so the team itself can exist before a
-- chairperson is appointed through the leadership UI.
ALTER TABLE evangelism_teams
  MODIFY COLUMN leader_id CHAR(36) NULL;

-- 7. Remove stale E-Team identities if they are present, then create the two
-- authoritative TUMCU teams. Existing team IDs are retained where possible.
UPDATE evangelism_teams
SET name = 'NET MINISTRIES TRUST TUM UNIT',
    short_name = 'NET TUM UNIT',
    region = COALESCE(NULLIF(region, ''), 'TUM / Missions & Evangelism'),
    description = 'TUMCU evangelistic team connected with NET Ministries Trust, supporting evangelism, discipleship, fellowship, prayer and mission outreach.',
    mission_purpose = 'To mobilise TUMCU students for evangelism, discipleship, prayer, fellowship and mission outreach.',
    updated_at = NOW()
WHERE code IN ('NET','NORET') AND id = 'eteam-noret';

UPDATE evangelism_teams
SET name = 'NORET-SORET',
    short_name = 'NORET-SORET',
    region = COALESCE(NULLIF(region, ''), 'North Rift & South Rift'),
    description = 'A combined North Rift and South Rift evangelistic team serving students through fellowship, prayer, missions, outreach, discipleship and follow-up.',
    mission_purpose = 'To connect North Rift and South Rift students for evangelism, missions, fellowship, discipleship and follow-up.',
    updated_at = NOW()
WHERE code IN ('SORET','NORET-SORET') AND id = 'eteam-soret';

INSERT INTO evangelism_teams (id, name, short_name, region, description, mission_purpose, is_active, leader_id)
SELECT 'eteam-net-tum', 'NET MINISTRIES TRUST TUM UNIT', 'NET TUM UNIT', 'TUM / Missions & Evangelism',
       'TUMCU evangelistic team connected with NET Ministries Trust, supporting evangelism, discipleship, fellowship, prayer and mission outreach.',
       'To mobilise TUMCU students for evangelism, discipleship, prayer, fellowship and mission outreach.', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM evangelism_teams WHERE id = 'eteam-net-tum' OR code = 'NET-TUM');

UPDATE evangelism_teams SET code = 'NET-TUM'
WHERE id = 'eteam-net-tum';

INSERT INTO evangelism_teams (id, name, short_name, region, description, mission_purpose, is_active, leader_id)
SELECT 'eteam-noret-soret', 'NORET-SORET', 'NORET-SORET', 'North Rift & South Rift',
       'A combined North Rift and South Rift evangelistic team serving students through fellowship, prayer, missions, outreach, discipleship and follow-up.',
       'To connect North Rift and South Rift students for evangelism, missions, fellowship, discipleship and follow-up.', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM evangelism_teams WHERE id = 'eteam-noret-soret' OR code = 'NORET-SORET');

UPDATE evangelism_teams SET code = 'NORET-SORET'
WHERE id = 'eteam-noret-soret';

-- Keep the two old rows usable if they existed, but prevent them from being
-- displayed as separate public teams.
UPDATE evangelism_teams
SET is_active = 0, updated_at = NOW()
WHERE code IN ('NORET','SORET') AND id NOT IN ('eteam-net-tum','eteam-noret-soret');

-- 8. Normalise the activity tables to the column names used by the API.
-- They were created correctly in migration 005; this section documents the
-- contract and leaves existing data untouched.

SET FOREIGN_KEY_CHECKS = 1;
