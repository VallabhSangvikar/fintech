-- Credit Health Tables for FinTech Platform
-- This extends the existing database with credit monitoring and analysis capabilities

USE fintech;

-- Credit Profile Table - Main credit information for users
CREATE TABLE credit_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    current_score INT NOT NULL DEFAULT 0,
    score_rating ENUM('Poor', 'Fair', 'Good', 'Very Good', 'Excellent') NOT NULL DEFAULT 'Poor',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    score_change_30d INT DEFAULT 0,
    score_change_90d INT DEFAULT 0,
    score_trend ENUM('up', 'down', 'stable') NOT NULL DEFAULT 'stable',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Accounts - Credit cards, loans, mortgages etc.
CREATE TABLE credit_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    account_type ENUM('credit_card', 'auto_loan', 'personal_loan', 'mortgage', 'student_loan', 'home_equity') NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    institution_name VARCHAR(255),
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(12,2) NULL, -- Only for credit cards
    minimum_payment DECIMAL(10,2) DEFAULT 0.00,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    account_status ENUM('active', 'closed', 'delinquent', 'charged_off') NOT NULL DEFAULT 'active',
    opened_date DATE,
    payment_history_score DECIMAL(5,2) DEFAULT 100.00, -- Percentage of on-time payments
    utilization_rate DECIMAL(5,2) DEFAULT 0.00, -- For credit cards
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Score History - Track score changes over time
CREATE TABLE credit_score_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    score INT NOT NULL,
    score_rating ENUM('Poor', 'Fair', 'Good', 'Very Good', 'Excellent') NOT NULL,
    score_date DATE NOT NULL,
    change_reason TEXT, -- What caused the change
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_csh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, score_date)
);

-- Credit Factors - Things affecting credit score
CREATE TABLE credit_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    impact_type ENUM('positive', 'negative', 'neutral') NOT NULL,
    impact_score INT DEFAULT 0, -- How much it affects score (-100 to +100)
    description TEXT,
    recommendation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Inquiries - Hard and soft credit pulls
CREATE TABLE credit_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    inquiry_type ENUM('hard', 'soft') NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    inquiry_reason VARCHAR(255), -- Auto loan, credit card, etc.
    inquiry_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ci_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Recommendations - AI-generated suggestions
CREATE TABLE credit_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    recommendation_type ENUM('pay_down_debt', 'increase_limit', 'dispute_error', 'diversify_credit', 'payment_reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    potential_impact INT DEFAULT 0, -- Estimated score improvement
    estimated_timeline VARCHAR(100), -- "3-6 months", etc.
    status ENUM('active', 'completed', 'dismissed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Alerts - Notifications for score changes, new accounts, etc.
CREATE TABLE credit_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    alert_type ENUM('score_change', 'new_account', 'payment_due', 'high_utilization', 'inquiry_detected') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data for testing
INSERT INTO credit_profiles (user_id, current_score, score_rating, score_change_30d, score_change_90d, score_trend) 
SELECT id, 
    CASE 
        WHEN RAND() < 0.1 THEN 850 + FLOOR(RAND() * 50)  -- Excellent: 850-900
        WHEN RAND() < 0.3 THEN 740 + FLOOR(RAND() * 110) -- Very Good: 740-850
        WHEN RAND() < 0.6 THEN 670 + FLOOR(RAND() * 70)  -- Good: 670-740
        WHEN RAND() < 0.8 THEN 580 + FLOOR(RAND() * 90)  -- Fair: 580-670
        ELSE 300 + FLOOR(RAND() * 280)                    -- Poor: 300-580
    END as score,
    CASE 
        WHEN RAND() < 0.1 THEN 'Excellent'
        WHEN RAND() < 0.3 THEN 'Very Good'
        WHEN RAND() < 0.6 THEN 'Good'
        WHEN RAND() < 0.8 THEN 'Fair'
        ELSE 'Poor'
    END as rating,
    FLOOR(RAND() * 30) - 15 as change_30d,  -- -15 to +15
    FLOOR(RAND() * 60) - 30 as change_90d,  -- -30 to +30
    CASE 
        WHEN RAND() < 0.4 THEN 'up'
        WHEN RAND() < 0.7 THEN 'stable'
        ELSE 'down'
    END as trend
FROM users 
WHERE id NOT IN (SELECT user_id FROM credit_profiles);