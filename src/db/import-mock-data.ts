/**
 * Mock Test Data Import Script
 * 
 * This script imports test templates into the Neon Tech database and
 * generates AI-based questions for each template. Questions are dynamically
 * created using the DeepSeek API instead of using predefined mock data.
 */

import { query } from '@/lib/db';
import { testTemplates, testSubmissions } from '@/app/api/mock-tests/route';
import { saveMockTest, saveTestSubmission } from './mock-tests-db';
import { generateQuestionsForTest } from '@/lib/question-generator';
import { Question } from '@/lib/question-generator';

// Define MockTest type to match the one in mock-tests-db.ts
type MockTest = {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examLevel: 'Foundation' | 'Intermediate' | 'Final';
  paperType: 'Subjective' | 'Objective' | 'Mixed';
  questions: Question[];
};

async function importMockData() {
  console.log('Starting mock data import...');
  
  try {
    // Import test templates
    console.log('\n1. Importing test templates...');
    let importedTests = 0;
    
    // Generate tests from templates and save them
    for (const [templateId, template] of Object.entries(testTemplates)) {
      console.log(`Importing template: ${template.title}`);
      
      // Create a mock test object from the template
      const mockTest: MockTest = {
        id: `template-${templateId}`,
        title: template.title,
        subject: template.subject,
        duration: template.duration,
        questionCount: template.questionCount,
        difficulty: template.difficulty,
        examLevel: template.examLevel, // Use the template's exam level
        paperType: template.paperType, // Use the template's paper type
        questions: []
      };
      
      // Generate questions dynamically using AI
      try {
        console.log(`Generating AI questions for ${template.subject}...`);
        mockTest.questions = await generateQuestionsForTest(
          template.subject,
          template.difficulty,
          mockTest.examLevel,
          template.questionCount,
          mockTest.paperType
        );
        console.log(`Generated ${mockTest.questions.length} questions successfully`);
      } catch (error) {
        console.error(`Error generating questions for template ${templateId}:`, error);
        // Fallback to empty questions array if generation fails
        mockTest.questions = [];
      }
      
      // Save the mock test to the database
      const success = await saveMockTest(mockTest);
      if (success) {
        importedTests++;
      }
    }
    
    console.log(`✅ Imported ${importedTests} test templates`);
    
    // Skip importing existing mock tests since we're generating questions dynamically
    console.log('\n2. Skipping import of predefined mock tests (using AI generation instead)');
    
    // Import test submissions
    console.log('\n3. Importing test submissions...');
    let importedSubmissions = 0;
    
    for (const submission of testSubmissions) {
      console.log(`Importing submission for test: ${submission.testId}`);
      
      // Save the test submission to the database
      const success = await saveTestSubmission(submission);
      if (success) {
        importedSubmissions++;
      }
    }
    
    console.log(`✅ Imported ${importedSubmissions} test submissions`);
    
    console.log('\n✅ Mock data import completed successfully!');
  } catch (error) {
    console.error('❌ Mock data import failed:', error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify that your DATABASE_URL environment variable is correctly set');
    console.log('2. Check that the Neon Tech database is accessible from your environment');
    console.log('3. Ensure the database tables have been created using the provided SQL script');
    console.log('4. Run the test-connection.ts script to verify database connectivity');
  }
}

// Run the import
importMockData().catch(console.error);

// Export the function for use in other files
export { importMockData };