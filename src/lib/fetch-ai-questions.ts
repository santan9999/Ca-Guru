/**
 * Client-side utility for fetching AI-generated questions
 * 
 * This module provides functions to fetch dynamically generated questions
 * from the API when a user starts a mock test.
 */

/**
 * Fetch AI-generated questions for a mock test
 * @param subject - The subject of the test
 * @param difficulty - The difficulty level
 * @param examLevel - The CA exam level
 * @param questionCount - Number of questions to generate
 * @param paperType - Type of paper (Subjective/Objective/Mixed)
 * @returns The generated questions
 */
export async function fetchAIGeneratedQuestions(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionCount: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed'
) {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        difficulty,
        examLevel,
        questionCount,
        paperType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate questions');
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Error fetching AI-generated questions:', error);
    throw error;
  }
}

/**
 * Create a mock test with AI-generated questions
 * @param testTemplate - The test template to use
 * @returns A complete mock test with AI-generated questions
 */
export async function createMockTestWithAIQuestions(testTemplate: any) {
  try {
    // Generate questions based on template specifications
    const questions = await fetchAIGeneratedQuestions(
      testTemplate.subject,
      testTemplate.difficulty,
      testTemplate.examLevel || 'Intermediate', // Default to Intermediate if not specified
      testTemplate.questionCount,
      testTemplate.paperType || 'Mixed' // Default to Mixed if not specified
    );

    // Create a mock test object with the generated questions
    return {
      id: `template-${testTemplate.id}-${Date.now()}`, // Generate a unique ID
      title: testTemplate.title,
      subject: testTemplate.subject,
      duration: testTemplate.duration,
      questionCount: testTemplate.questionCount,
      difficulty: testTemplate.difficulty,
      examLevel: testTemplate.examLevel || 'Intermediate',
      paperType: testTemplate.paperType || 'Mixed',
      questions: questions,
    };
  } catch (error) {
    console.error('Error creating mock test with AI questions:', error);
    throw error;
  }
}