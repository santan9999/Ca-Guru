/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the Neon Tech database and verifies that
 * the mock test tables are properly created. Run this script to diagnose
 * database connection issues.
 */

import { query } from '@/lib/db';
import { initDatabase } from '@/lib/db';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Connection successful! Current time:', result.rows[0].current_time);
    
    // Check if tables exist
    console.log('\n2. Checking if mock test tables exist...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('mock_tests', 'questions', 'test_submissions', 'test_results')
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables.join(', ') || 'None');
    
    const requiredTables = ['mock_tests', 'questions', 'test_submissions', 'test_results'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
      console.log('\nInitializing database to create missing tables...');
      await initDatabase();
      console.log('Database initialization complete. Please run this test again to verify.');
    } else {
      console.log('✅ All required tables exist!');
      
      // Test table structure
      console.log('\n3. Verifying table structure...');
      for (const table of requiredTables) {
        const columnsResult = await query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [table]);
        
        console.log(`Table ${table} columns:`);
        columnsResult.rows.forEach(row => {
          console.log(`  - ${row.column_name} (${row.data_type})`);
        });
      }
      
      console.log('\n✅ Database connection and structure verified successfully!');
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify that your DATABASE_URL environment variable is correctly set');
    console.log('2. Check that the Neon Tech database is accessible from your environment');
    console.log('3. Ensure you have the necessary permissions to access the database');
    console.log('4. Check for network issues or firewall restrictions');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);

// Export the function for use in other files
export { testDatabaseConnection };