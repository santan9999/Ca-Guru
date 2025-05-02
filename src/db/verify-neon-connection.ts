/**
 * Neon Database Connection Verification Script
 * 
 * This script verifies the connection to the Neon PostgreSQL database
 * and provides detailed error information if the connection fails.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function verifyNeonConnection() {
  console.log('Verifying Neon PostgreSQL connection...');
  
  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.log('Please ensure your .env.local file contains a valid DATABASE_URL.');
    return false;
  }
  
  console.log(`Database URL found: ${process.env.DATABASE_URL.substring(0, 40)}...`);
  
  // Create a PostgreSQL connection pool with detailed logging
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon Tech PostgreSQL
    },
    max: 1, // Use a single connection for testing
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('Attempting to connect to Neon PostgreSQL...');
    
    // Test the connection with a simple query
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Check which database we're connected to
    const dbResult = await client.query('SELECT current_database()');
    console.log(`Connected to database: ${dbResult.rows[0].current_database}`);
    
    // Check if our tables exist
    console.log('Checking for required tables...');
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database. Database may need initialization.');
    } else {
      console.log('Tables found in database:');
      tablesResult.rows.forEach((row, i) => {
        console.log(`  ${i+1}. ${row.table_name}`);
      });
    }
    
    // Release the client back to the pool
    client.release();
    
    // Close the pool
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Neon PostgreSQL database:');
    console.error(error);
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify that your DATABASE_URL in .env.local is correct');
    console.log('2. Check that your Neon project is active and not suspended');
    console.log('3. Ensure your IP address is allowed in Neon firewall settings');
    console.log('4. Try connecting with psql or another PostgreSQL client to verify credentials');
    console.log('5. Check if your Neon compute is scaled to zero and needs to be reactivated');
    
    try {
      await pool.end();
    } catch {
      // Ignore errors when ending the pool
    }
    
    return false;
  }
}

// Run the verification
verifyNeonConnection().then(success => {
  if (success) {
    console.log('\n✅ Neon database connection verification completed successfully!');
  } else {
    console.log('\n❌ Neon database connection verification failed.');
    process.exit(1);
  }
}).catch(err => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});