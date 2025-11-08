-- Use the correct database
USE fintech;

-- Add created_at column to investment_products table (check first)
-- MySQL doesn't support "IF NOT EXISTS" for ADD COLUMN directly,
-- so use a conditional approach
SET @col_exists := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'investment_products'
    AND COLUMN_NAME = 'created_at'
);

-- If column doesn't exist, add it
SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE investment_products ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;',
  'SELECT "Column already exists";'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records (safe even if column existed)
UPDATE investment_products
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

-- Add indexes (no IF NOT EXISTS in MySQL before 8.3)
-- So we check first before creating
SET @idx_user := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'investment_products'
    AND INDEX_NAME = 'idx_investment_products_user_id'
);
SET @stmt := IF(
  @idx_user = 0,
  'CREATE INDEX idx_investment_products_user_id ON investment_products(user_id);',
  'SELECT "Index idx_investment_products_user_id already exists";'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_created := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'investment_products'
    AND INDEX_NAME = 'idx_investment_products_created_at'
);
SET @stmt := IF(
  @idx_created = 0,
  'CREATE INDEX idx_investment_products_created_at ON investment_products(created_at);',
  'SELECT "Index idx_investment_products_created_at already exists";'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create investment_tips table (this part is fine)
CREATE TABLE IF NOT EXISTS investment_tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('MARKET_ANALYSIS', 'RISK_MANAGEMENT', 'PORTFOLIO_OPTIMIZATION', 'SECTOR_INSIGHTS') NOT NULL,
    aiConfidenceScore INT DEFAULT 85,
    marketImpact ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    applicableRiskLevel JSON, -- Store as JSON array: ["LOW", "MEDIUM"] etc.
    tags JSON, -- Store as JSON array
    publishedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    isPersonalized BOOLEAN NOT NULL DEFAULT TRUE,
    sourcesUsed JSON, -- Store as JSON array of news sources used
    CONSTRAINT fk_it_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_published (user_id, publishedAt),
    INDEX idx_active_expires (isActive, expiresAt)
);
