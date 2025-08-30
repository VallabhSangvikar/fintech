import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fintech',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnections() {
  console.log('Testing database connections...\n');

  let mysqlSuccess = false;
  let mongoSuccess = false;

  // Test MySQL
  try {
    const connection = await mysqlPool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    console.log('✅ MySQL connected');
    mysqlSuccess = true;
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
  }

  // Test MongoDB
  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set in .env.local');
    } else {
      const mongoClient = new MongoClient(process.env.MONGODB_URI);
      await mongoClient.connect();
      await mongoClient.db('fintech_nosql').admin().ping();
      await mongoClient.close();
      console.log('✅ MongoDB connected');
      mongoSuccess = true;
    }
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
  }

  return mysqlSuccess && mongoSuccess;
}

async function main() {
  try {
    const success = await testConnections();
    
    if (success) {
      console.log('\n🎉 All databases connected successfully!');
    } else {
      console.log('\n⚠️  Please check your database configuration in .env.local');
    }
    
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    try {
      await mysqlPool.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    process.exit(0);
  }
}

main();
