-- Optional physical-library catalogue. Physical books remain in the real CU/school library;
-- TECUMP only tracks title/copy availability and lending transactions.
CREATE TABLE IF NOT EXISTS library_physical_books (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NULL,
  category VARCHAR(120) NULL,
  total_copies INT UNSIGNED NOT NULL DEFAULT 1,
  available_copies INT UNSIGNED NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lpb_title (title),
  INDEX idx_lpb_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE library_physical_loans ADD COLUMN IF NOT EXISTS physical_book_id VARCHAR(64) NULL AFTER id;
ALTER TABLE library_physical_loans ADD INDEX IF NOT EXISTS idx_lpl_book (physical_book_id);
