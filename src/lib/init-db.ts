import { initializeDatabase } from './db';

// This function initializes the database when the application starts
export async function initializeDatabaseOnStartup() {
  try {
    console.log('Initializing database...');
    
    // If database URL is not configured, skip initialization
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL provided, skipping database initialization');
      return false;
    }
    
    // Initialize the basic database structure
    try {
      await initializeDatabase();
      console.log('Database connection initialized successfully');
    } catch (dbError) {
      console.error('Failed to initialize database connection:', dbError);
      return false;
    }
    
    // Then initialize the specific schemas - wrap in try/catch to handle import errors
    try {
      // Dynamic import to avoid issues with circular dependencies
      const { default: initializeSchemas } = await import('@/db/init-schemas');
      await initializeSchemas();
      console.log('Database schemas initialized successfully');
    } catch (schemaError) {
      console.error('Failed to initialize database schemas:', schemaError);
      // Still return true since the database connection was successful
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Initialize database on server startup
if (typeof window === 'undefined') {
  initializeDatabaseOnStartup()
    .then(success => {
      if (success) {
        console.log('Database initialization complete');
      } else {
        console.log('Database initialization skipped or failed');
      }
    })
    .catch(error => {
      console.error('Error during database initialization:', error);
    });
}