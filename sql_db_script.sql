-- Create database
CREATE DATABASE IF NOT EXISTS fintech;
USE fintech;

-- Enable UUID function (MySQL 8+ has UUID())
-- For UUID as primary keys we use CHAR(36)

-- 1. Core Tables
CREATE TABLE organizations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type ENUM('INVESTMENT', 'BANK') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_memberships (
    organization_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role ENUM('ADMIN', 'PORTFOLIO_MANAGER', 'ANALYST', 'LENDING_OFFICER', 'RISK_MANAGER') NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, user_id),
    CONSTRAINT fk_tm_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Investment Persona Tables
CREATE TABLE portfolios (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    organization_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_score INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_port_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE portfolio_holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id CHAR(36) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_ticker VARCHAR(50),
    quantity DECIMAL(18,4) NOT NULL,
    purchase_price DECIMAL(18,4) NOT NULL,
    purchase_date DATE NOT NULL,
    CONSTRAINT fk_ph_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- 3. Bank Persona Tables
CREATE TABLE loan_applications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    document_id CHAR(36) NOT NULL,
    organization_id CHAR(36) NOT NULL,
    applicant_name VARCHAR(255),
    loan_amount DECIMAL(18,2),
    credit_score INT,
    status ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    ai_recommendation TEXT,
    processed_at TIMESTAMP NULL,
    CONSTRAINT fk_la_doc FOREIGN KEY (document_id) REFERENCES documents(id),
    CONSTRAINT fk_la_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE loan_approval_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_key VARCHAR(100) NOT NULL,
    operator ENUM('GREATER_THAN', 'LESS_THAN', 'EQUALS') NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_lar_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type ENUM('ONLINE', 'IN_PERSON', 'ATM_WITHDRAWAL') NOT NULL,
    location VARCHAR(255),
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_score FLOAT,
    CONSTRAINT fk_tx_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 4. Customer Persona Tables
CREATE TABLE financial_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    goal_name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(18,2) NOT NULL,
    current_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    target_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE investment_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    user_id CHAR(36) NOT NULL,
    product_category ENUM('INDEX_FUND', 'REAL_ESTATE', 'SIP', 'GOVERNMENT_BOND') NOT NULL,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    expected_return VARCHAR(255),
    description TEXT,
    CONSTRAINT fk_ip_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Shared/System Tables
CREATE TABLE documents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    organization_id CHAR(36),
    uploaded_by_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    document_type ENUM('INVESTMENT_PLAN', 'LOAN_APPLICATION', 'FINANCIAL_REPORT') NOT NULL,
    status ENUM('PENDING', 'ANALYZED', 'ERROR') NOT NULL DEFAULT 'PENDING',
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_user FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE knowledge_base_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    uploaded_by_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    document_category ENUM('LOAN_COMPLIANCE', 'ESG_POLICY', 'REGULATORY_STANDARD') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kbd_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_kbd_user FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN jwt_version INT DEFAULT 1; -- For token invalidation