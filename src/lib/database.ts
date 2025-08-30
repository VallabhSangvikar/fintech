import mysql from 'mysql2/promise';
import { MongoClient, Db } from 'mongodb';

// MySQL connection pool
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

// MongoDB connection
let mongoClient: MongoClient;
let mongodb: Db;

export async function connectMongoDB() {
  if (mongodb) {
    return mongodb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    mongodb = mongoClient.db('fintech_nosql');
    
    // Create collections and indexes
    await createCollections();
    
    console.log('✅ Connected to MongoDB');
    return mongodb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function createCollections() {
  if (!mongodb) return;

  // AI Sessions collection
  const aiSessionsCollection = mongodb.collection('ai_sessions');
  await aiSessionsCollection.createIndex({ userId: 1 });
  await aiSessionsCollection.createIndex({ organizationId: 1 });
  await aiSessionsCollection.createIndex({ lastUpdatedAt: -1 });

  // Customer Profiles collection
  const customerProfilesCollection = mongodb.collection('customer_profiles');
  await customerProfilesCollection.createIndex({ userId: 1 }, { unique: true });
  await customerProfilesCollection.createIndex({ riskAppetite: 1 });
  await customerProfilesCollection.createIndex({ primaryFinancialGoal: 1 });

  // Investment Tips collection
  const investmentTipsCollection = mongodb.collection('investment_tips');
  await investmentTipsCollection.createIndex({ category: 1 });
  await investmentTipsCollection.createIndex({ publishedAt: -1 });
  await investmentTipsCollection.createIndex({ isActive: 1 });
  await investmentTipsCollection.createIndex({ tags: 1 });

  // Document Analysis Results collection
  const documentAnalysisCollection = mongodb.collection('document_analysis_results');
  await documentAnalysisCollection.createIndex({ documentId: 1 }, { unique: true });
  await documentAnalysisCollection.createIndex({ analysisType: 1 });
  await documentAnalysisCollection.createIndex({ processedAt: -1 });
}

// Database initialization function
export async function initializeDatabase() {
  try {
    // Test MySQL connection
    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();

    // Test MongoDB connection
    await connectMongoDB();
    console.log('✅ MongoDB connected successfully');

    console.log('✅ Database initialization complete');
    return { success: true };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { success: false, error };
  }
}

// Cleanup function
export async function closeDatabaseConnections() {
  try {
    await mysqlPool.end();
    if (mongoClient) {
      await mongoClient.close();
    }
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
}

export { mongodb, mysqlPool };
