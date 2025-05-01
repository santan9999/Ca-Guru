/**
 * Database Schema Initialization Script
 * 
 * This script reads and executes the SQL schema files to initialize the database structure
 * for test history, progress tracking, and adaptive learning.
 */

import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

// Path to schema files
const schemasDir = path.join(process.cwd(), 'src', 'db', 'schemas');

/**
 * Execute SQL from a file
 */
async function executeSqlFile(filePath: string): Promise<void> {
  try {
    console.log(`Executing SQL schema file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      await query(`${statement};`);
    }
    
    console.log(`Successfully executed schema file: ${filePath}`);
  } catch (error) {
    console.error(`Error executing schema file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Initialize all database schemas
 */
export async function initializeSchemas(): Promise<void> {
  try {
    console.log('Initializing database schemas...');
    
    // Execute schema files in order
    await executeSqlFile(path.join(schemasDir, 'progress-tracking-schema.sql'));
    await executeSqlFile(path.join(schemasDir, 'test-history-schema.sql'));
    await executeSqlFile(path.join(schemasDir, 'adaptive-learning-schema.sql'));
    
    console.log('Database schemas initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schemas:', error);
    throw error;
  }
}

// Export the initialization function
export default initializeSchemas;