import { NextRequest, NextResponse } from 'next/server';
import { mysqlPool, connectMongoDB } from '@/lib/database';

export async function GET() {
  const results = {
    mysql: { connected: false, error: null as string | null },
    mongodb: { connected: false, error: null as string | null },
  };

  // Test MySQL connection
  try {
    const connection = await mysqlPool.getConnection();
    await connection.execute('SELECT 1 as test');
    connection.release();
    results.mysql.connected = true;
  } catch (error) {
    results.mysql.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Test MongoDB connection
  try {
    const db = await connectMongoDB();
    await db.admin().ping();
    results.mongodb.connected = true;
  } catch (error) {
    results.mongodb.error = error instanceof Error ? error.message : 'Unknown error';
  }

  const allConnected = results.mysql.connected && results.mongodb.connected;

  return NextResponse.json(
    {
      success: allConnected,
      databases: results,
      message: allConnected 
        ? 'All databases connected successfully!' 
        : 'Some database connections failed'
    },
    { 
      status: allConnected ? 200 : 500 
    }
  );
}
