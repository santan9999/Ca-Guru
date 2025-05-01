/**
 * Question Generator for CA Mock Tests
 * 
 * This module uses the DeepSeek API to dynamically generate questions for mock tests
 * based on the subject, difficulty level, and exam level.
 */

import { generateDeepSeekResponse, isDeepSeekAvailable } from './deepseek';

// Types for mock test data
export type QuestionType = 'MCQ' | 'Subjective';

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number; // Index of the correct option for MCQs
  isCompulsory?: boolean; // Whether this is a compulsory question
  marks?: number; // Marks allocated to this question
};

/**
 * Generate a system prompt for creating CA exam questions
 */
function generateQuestionPrompt(subject: string, difficulty: string, examLevel: string, questionType: QuestionType): string {
  return `You are an expert question creator for Chartered Accountancy (CA) exams in India.

Create a ${questionType === 'MCQ' ? 'multiple-choice question' : 'subjective question'} for the subject: ${subject}, with ${difficulty} difficulty level, appropriate for ${examLevel} CA exam level.

${questionType === 'MCQ' ? 'The question should have exactly 4 options with one correct answer. Make sure the options are plausible but only one is clearly correct.' : 'The question should require a detailed explanation or analysis as an answer.'}

The question should test conceptual understanding and application of knowledge, not just memorization.

Your response must be in the following JSON format only, with no additional text:
{
  "text": "The question text here",
  ${questionType === 'MCQ' ? '"options": ["Option A", "Option B", "Option C", "Option D"],\n  "correctAnswer": 0,' : ''}
  "marks": ${questionType === 'MCQ' ? '1' : '16'}
}

Note: For MCQs, correctAnswer is the index (0-3) of the correct option in the options array.`;
}

/**
 * Generate a single question using the DeepSeek API
 */
export async function generateQuestion(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionType: QuestionType,
  questionIndex: number
): Promise<Question> {
  // If DeepSeek API is not available, return a placeholder question
  if (!isDeepSeekAvailable) {
    return {
      id: `${subject.toLowerCase()}-q${questionIndex}`,
      text: `Sample ${questionType} question for ${subject} (AI generation unavailable)`,
      type: questionType,
      options: questionType === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: questionType === 'MCQ' ? 0 : undefined,
      isCompulsory: questionIndex < 3, // First few questions are compulsory
      marks: questionType === 'MCQ' ? 1 : 16
    };
  }

  try {
    // Generate the system prompt for question creation
    const systemPrompt = generateQuestionPrompt(subject, difficulty, examLevel, questionType);
    
    // Get response from DeepSeek API
    const response = await generateDeepSeekResponse(systemPrompt, `Create a ${difficulty} ${questionType} question for ${subject}`);
    
    // Parse the JSON response
    const questionData = JSON.parse(response);
    
    // Create and return the question object
    return {
      id: `${subject.toLowerCase()}-ai-${questionType.toLowerCase()}-${questionIndex}`,
      text: questionData.text,
      type: questionType,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      isCompulsory: questionIndex < 3, // First few questions are compulsory
      marks: questionData.marks || (questionType === 'MCQ' ? 1 : 16)
    };
  } catch (error) {
    console.error('Error generating question:', error);
    
    // Return a fallback question in case of error
    return {
      id: `${subject.toLowerCase()}-q${questionIndex}`,
      text: `Question ${questionIndex + 1}: This is a fallback ${questionType} question for ${subject} due to generation error`,
      type: questionType,
      options: questionType === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: questionType === 'MCQ' ? 0 : undefined,
      isCompulsory: questionIndex < 3,
      marks: questionType === 'MCQ' ? 1 : 16
    };
  }
}

// Simple in-memory cache for generated questions to avoid duplicate API calls
const questionCache: Record<string, Question[]> = {};

/**
 * Generate a cache key for storing/retrieving questions
 */
function generateCacheKey(subject: string, difficulty: string, examLevel: string, paperType: string): string {
  return `${subject}-${difficulty}-${examLevel}-${paperType}`;
}

/**
 * Generate multiple questions for a mock test with optimized batch processing
 */
export async function generateQuestionsForTest(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionCount: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed'
): Promise<Question[]> {
  console.time('Question generation time');
  
  // Check if we have cached questions for this combination
  const cacheKey = generateCacheKey(subject, difficulty, examLevel, paperType);
  if (questionCache[cacheKey] && questionCache[cacheKey].length >= questionCount) {
    console.log(`Using ${questionCount} cached questions for ${subject}`);
    console.timeEnd('Question generation time');
    return questionCache[cacheKey].slice(0, questionCount);
  }
  
  const questions: Question[] = [];
  
  // Determine the distribution of question types based on paper type
  let mcqCount = 0;
  let subjectiveCount = 0;
  
  switch (paperType) {
    case 'Objective':
      mcqCount = questionCount;
      break;
    case 'Subjective':
      subjectiveCount = questionCount;
      break;
    case 'Mixed':
      // For mixed papers, distribute questions with more weight to MCQs
      mcqCount = Math.ceil(questionCount * 0.7); // 70% MCQs
      subjectiveCount = questionCount - mcqCount; // 30% Subjective
      break;
  }
  
  // Use Promise.all for parallel processing of question generation
  // This significantly reduces the total time by making concurrent API calls
  
  // Generate MCQ questions in parallel batches
  if (mcqCount > 0) {
    const mcqPromises = Array.from({ length: mcqCount }, (_, i) => 
      generateQuestion(subject, difficulty, examLevel, 'MCQ', i)
    );
    
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < mcqPromises.length; i += batchSize) {
      const batch = mcqPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      questions.push(...batchResults);
      console.log(`Generated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(mcqPromises.length/batchSize)} of MCQ questions`);
    }
  }
  
  // Generate subjective questions in parallel batches
  if (subjectiveCount > 0) {
    const subjPromises = Array.from({ length: subjectiveCount }, (_, i) => 
      generateQuestion(subject, difficulty, examLevel, 'Subjective', mcqCount + i)
    );
    
    // Process in smaller batches for subjective questions as they're more complex
    const batchSize = 3;
    for (let i = 0; i < subjPromises.length; i += batchSize) {
      const batch = subjPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      questions.push(...batchResults);
      console.log(`Generated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(subjPromises.length/batchSize)} of subjective questions`);
    }
  }
  
  // Cache the generated questions for future use
  questionCache[cacheKey] = [...questions];
  
  console.timeEnd('Question generation time');
  return questions;
}