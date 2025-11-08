const mysql = require('mysql2/promise');

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'vallabh18',
    database: 'fintech'
  });

  try {
    console.log('🔄 Updating investment_products schema...');
    
    // Update product_category enum
    await connection.execute(
      `ALTER TABLE investment_products 
       MODIFY COLUMN product_category 
       ENUM('INDEX_FUND', 'REAL_ESTATE', 'SIP', 'GOVERNMENT_BOND', 'STOCKS', 'GOLD') NOT NULL`
    );
    console.log('✅ product_category updated');

    // Update risk_level enum
    await connection.execute(
      `ALTER TABLE investment_products 
       MODIFY COLUMN risk_level 
       ENUM('LOW', 'MEDIUM', 'HIGH', 'CONSERVATIVE', 'MODERATE', 'AGGRESSIVE') NOT NULL`
    );
    console.log('✅ risk_level updated');

    console.log('\n✅ Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

updateSchema().catch(console.error);
