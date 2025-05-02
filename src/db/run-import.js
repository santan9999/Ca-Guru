/**
 * Run Mock Data Import
 * 
 * This script runs the mock data import to populate the Neon Tech database
 * with test templates, questions, and submissions.
 */

// Import the required modules
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running mock data import...');
console.log('This will populate your Neon Tech database with mock test data.');
console.log('Make sure your DATABASE_URL environment variable is set correctly.');
console.log('\n');

try {
  // Run the TypeScript file using ts-node
  execSync('npx ts-node -r tsconfig-paths/register src/db/import-mock-data.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..')
  });
} catch {
  console.error('\nFailed to run the import script. Make sure you have ts-node installed.');
  console.log('You can install it with: npm install -g ts-node tsconfig-paths');
  console.log('\nAlternatively, you can run the import directly with:');
  console.log('npx ts-node -r tsconfig-paths/register src/db/import-mock-data.ts');
}