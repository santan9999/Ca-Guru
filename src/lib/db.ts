// Database utility for CA Guru AI
// This utility handles database connections and operations

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Singleton database pool instance
let pool: Pool | null = null;
let isInitialized = false;

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not set. Database functionality will be limited.');
}

// Create a database connection pool with SSL
const createPool = () => {
  if (!process.env.DATABASE_URL) return null;
  
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  
  return pool;
};

// Get or create the database connection
export const getDbConnection = async () => {
  if (!pool) {
    pool = createPool();
    if (!pool) return null;
    
    // Test the connection
    try {
      await pool.query('SELECT NOW()');
      console.log('Connected to Neon PostgreSQL database');
    } catch (error) {
      console.error('Error connecting to database:', error);
      pool = null;
      return null;
    }
  }
  
  return pool;
};

// Initialize database schema
export const initializeSchema = async () => {
  // Only initialize once
  if (isInitialized) {
    return;
  }
  
  console.log('Initializing database schemas...');
  
  const schemasDir = path.join(process.cwd(), 'src', 'db', 'schemas');
  const schemaFiles = [
    'users-schema.sql',
    'progress-tracking-schema.sql',
    'test-history-schema.sql',
    'adaptive-learning-schema.sql'
  ];
  
  const pool = await getDbConnection();
  if (!pool) {
    console.error('Cannot initialize schema: No database connection');
    return;
  }
  
  // Execute each schema file
  for (const file of schemaFiles) {
    const filePath = path.join(schemasDir, file);
    console.log(`Executing SQL schema file: ${filePath}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`Successfully executed schema file: ${filePath}`);
    } catch (error) {
      console.error(`Error executing schema file ${filePath}:`, error);
    }
  }
  
  console.log('Database schemas initialized successfully');
  isInitialized = true;
};

// Initialize the database
export const initializeDatabase = async () => {
  console.log('Initializing database...');
  
  const pool = await getDbConnection();
  if (!pool) {
    console.error('Failed to initialize database: No database connection');
    return;
  }
  
  console.log('Database initialized successfully');
  await initializeSchema();
  console.log('Database initialization complete');
};

// Query the database with error handling
export const executeQuery = async (query: string, params: any[] = []) => {
  const pool = await getDbConnection();
  if (!pool) {
    console.error('Cannot execute query: No database connection');
    return null;
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
};

// Initialize the database once at startup, not per request
if (typeof window === 'undefined') {
  initializeDatabase().catch(console.error);
}