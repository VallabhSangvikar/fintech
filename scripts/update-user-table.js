import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateUserTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fintech',
  });

  try {
    console.log('🔄 Updating users table with new fields...');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('last_login_at', 'is_active', 'jwt_version')
    `, [process.env.DB_NAME]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Add missing columns
    if (!existingColumns.includes('last_login_at')) {
      await connection.execute('ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL');
      console.log('✅ Added last_login_at column');
    }

    if (!existingColumns.includes('is_active')) {
      await connection.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true');
      console.log('✅ Added is_active column');
    }

    if (!existingColumns.includes('jwt_version')) {
      await connection.execute('ALTER TABLE users ADD COLUMN jwt_version INT DEFAULT 1');
      console.log('✅ Added jwt_version column');
    }

    // Update existing users to have the new fields
    await connection.execute('UPDATE users SET is_active = true WHERE is_active IS NULL');
    await connection.execute('UPDATE users SET jwt_version = 1 WHERE jwt_version IS NULL');

    console.log('🎉 User table updated successfully!');

  } catch (error) {
    console.error('❌ Error updating user table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
updateUserTable().catch(console.error);
