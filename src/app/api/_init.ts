// This file initializes the database connection when the API routes are first accessed
import { initializeDatabaseOnStartup } from '@/lib/init-db';

// The export is needed to make this a proper module
export const initDb = {
  initialized: true
};

// This will execute when the module is imported
console.log('Initializing database connection for API routes...');

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not set. API functionality will be limited.');
} else {
  initializeDatabaseOnStartup().catch(err => {
    console.error('Failed to initialize database for API routes:', err);
  });
}