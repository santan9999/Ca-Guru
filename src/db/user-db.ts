import { query } from '@/lib/db';

/**
 * Ensures a user exists in the database
 * If the user doesn't exist, it creates a new user record
 * This helps prevent foreign key constraint errors when saving test history
 */
export async function ensureUserExists(userId: string, email?: string, name?: string): Promise<boolean> {
  try {
    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    
    // If user exists, return true
    if (userCheck.rows.length > 0) {
      return true;
    }
    
    // User doesn't exist, create a new user record
    await query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
      [userId, email || null, name || null]
    );
    
    console.log(`Created new user record for ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return false;
  }
}