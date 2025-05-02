/**
 * Client-side utility for fetching AI-generated questions
 * 
 * This module provides functions to fetch dynamically generated questions
 * from the API when a user starts a mock test.
 */

/**
 * Test template interface to replace 'any' type
 */
interface TestTemplate {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: number;
  questionCount: number;
  examLevel?: 'Foundation' | 'Intermediate' | 'Final';
  paperType?: 'Subjective' | 'Objective' | 'Mixed';
}

/**
 * Fetch AI-generated questions for a mock test with automatic refresh
 * @param subject - The subject of the test
 * @param difficulty - The difficulty level
 * @param examLevel - The CA exam level
 * @param questionCount - Number of questions to generate
 * @param paperType - Type of paper (Subjective/Objective/Mixed)
 * @param onProgress - Optional callback for progress updates
 * @returns The generated questions
 */
export async function fetchAIGeneratedQuestions(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionCount: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed',
  onProgress?: (status: {isGenerating: boolean, progress: number}) => void
) {
  try {
    // First request to get fallback questions immediately
    let response = await fetch('/api/generate-questions', {
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

    // Parse initial response with fallback questions
    let data = await response.json();
    let questions = data.questions;
    
    // Check if questions are still being generated
    if (data.isGenerating && onProgress) {
      onProgress({isGenerating: true, progress: 0});
      
      // Try up to 3 times to get real questions
      let attempts = 0;
      const maxAttempts = 3;
      
      while (data.isGenerating && attempts < maxAttempts) {
        // Wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 3000 + attempts * 2000));
        
        // Update progress
        if (onProgress) {
          onProgress({isGenerating: true, progress: (attempts + 1) / (maxAttempts + 1)});
        }
        
        // Request real questions with refresh header
        response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-is-refresh': 'true',
          },
          body: JSON.stringify({
            subject,
            difficulty,
            examLevel,
            questionCount,
            paperType,
          }),
        });
        
        if (response.ok) {
          data = await response.json();
          
          // If we got real questions, use them
          if (!data.isGenerating) {
            questions = data.questions;
            if (onProgress) {
              onProgress({isGenerating: false, progress: 1});
            }
            break;
          }
        }
        
        attempts++;
      }
      
      // Final progress update
      if (onProgress) {
        onProgress({isGenerating: false, progress: 1});
      }
    }
    
    // Ensure each question has a unique ID to avoid duplicate key issues
    return questions.map((q: any, index: number) => ({
      ...q,
      id: q.id || `${subject.toLowerCase()}-question-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error('Error fetching AI-generated questions:', error);
    throw error;
  }
}

/**
 * Create a mock test with AI-generated questions
 * @param testTemplate - The test template to use
 * @param onProgress - Optional callback for progress updates
 * @returns A complete mock test with AI-generated questions
 */
export async function createMockTestWithAIQuestions(
  testTemplate: TestTemplate,
  onProgress?: (status: {isGenerating: boolean, progress: number}) => void
) {
  try {
    // Generate questions based on template specifications
    const questions = await fetchAIGeneratedQuestions(
      testTemplate.subject,
      testTemplate.difficulty,
      testTemplate.examLevel || 'Intermediate', // Default to Intermediate if not specified
      testTemplate.questionCount,
      testTemplate.paperType || 'Mixed', // Default to Mixed if not specified
      onProgress
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