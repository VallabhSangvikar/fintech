// Credit Health Database Setup Script
// Run this to create credit health related tables

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'vallabh18',
  database: 'fintech'
};

async function setupCreditHealthTables() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    
    // Credit Profile Table
    console.log('📋 Creating credit_profiles table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_profiles (
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
      )
    `);
    
    // Credit Accounts Table
    console.log('💳 Creating credit_accounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        account_type ENUM('credit_card', 'auto_loan', 'personal_loan', 'mortgage', 'student_loan', 'home_equity') NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        institution_name VARCHAR(255),
        current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        credit_limit DECIMAL(12,2) NULL,
        minimum_payment DECIMAL(10,2) DEFAULT 0.00,
        interest_rate DECIMAL(5,2) DEFAULT 0.00,
        account_status ENUM('active', 'closed', 'delinquent', 'charged_off') NOT NULL DEFAULT 'active',
        opened_date DATE,
        payment_history_score DECIMAL(5,2) DEFAULT 100.00,
        utilization_rate DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ca_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Credit Score History Table
    console.log('📈 Creating credit_score_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_score_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        score INT NOT NULL,
        score_rating ENUM('Poor', 'Fair', 'Good', 'Very Good', 'Excellent') NOT NULL,
        score_date DATE NOT NULL,
        change_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_csh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, score_date)
      )
    `);
    
    // Credit Factors Table
    console.log('⚖️ Creating credit_factors table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        factor_name VARCHAR(255) NOT NULL,
        impact_type ENUM('positive', 'negative', 'neutral') NOT NULL,
        impact_score INT DEFAULT 0,
        description TEXT,
        recommendation TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Credit Inquiries Table
    console.log('🔍 Creating credit_inquiries table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        inquiry_type ENUM('hard', 'soft') NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        inquiry_reason VARCHAR(255),
        inquiry_date DATE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ci_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Credit Recommendations Table
    console.log('💡 Creating credit_recommendations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        recommendation_type ENUM('pay_down_debt', 'increase_limit', 'dispute_error', 'diversify_credit', 'payment_reminder') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        potential_impact INT DEFAULT 0,
        estimated_timeline VARCHAR(100),
        status ENUM('active', 'completed', 'dismissed') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Credit Alerts Table
    console.log('🚨 Creating credit_alerts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        alert_type ENUM('score_change', 'new_account', 'payment_due', 'high_utilization', 'inquiry_detected') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ All credit health tables created successfully!');
    console.log('🎉 Database setup complete. You can now use the Credit Health features.');
    
  } catch (error) {
    console.error('❌ Error setting up credit health tables:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the setup
setupCreditHealthTables();