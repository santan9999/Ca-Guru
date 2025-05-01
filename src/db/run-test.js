/**
 * Run Database Connection Test
 * 
 * This script runs the database connection test to help diagnose
 * issues with the Neon Tech database connection.
 */

// Import the required modules
const { execSync } = require('child_process');
const path = require('path');

console.log('Running database connection test...');
console.log('This will help diagnose issues with your Neon Tech database connection.');
console.log('Make sure your DATABASE_URL environment variable is set correctly.');
console.log('\n');

try {
  // Run the TypeScript file using ts-node
  execSync('npx ts-node -r tsconfig-paths/register src/db/test-connection.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..')
  });
} catch (error) {
  console.error('\nFailed to run the test script. Make sure you have ts-node installed.');
  console.log('You can install it with: npm install -g ts-node tsconfig-paths');
  console.log('\nAlternatively, you can run the test directly with:');
  console.log('npx ts-node -r tsconfig-paths/register src/db/test-connection.ts');
}