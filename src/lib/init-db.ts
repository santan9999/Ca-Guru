import { initDatabase } from './db';
import initializeSchemas from '@/db/init-schemas';

// This function initializes the database when the application starts
export async function initializeDatabaseOnStartup() {
  try {
    console.log('Initializing database...');
    // First initialize the basic database structure
    await initDatabase();
    
    // Then initialize the specific schemas for our application
    await initializeSchemas();
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // In production, you might want to implement retry logic or alert systems
  }
}

// Execute database initialization
// This will run when this module is imported
initializeDatabaseOnStartup().catch(console.error);