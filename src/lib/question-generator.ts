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

// Enhanced, persistent cache for generated questions with TTL
const questionCache: Record<string, {
  questions: Question[],
  timestamp: number
}> = {};

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Helper function to delay execution for a specified time
 * @param ms - Time to delay in milliseconds
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  // If DeepSeek API is not available, return a better fallback question
  if (!isDeepSeekAvailable) {
    return generateFallbackQuestion(subject, difficulty, examLevel, questionType, questionIndex, "API not available");
  }

  try {
    // Generate the system prompt for question creation
    const systemPrompt = generateQuestionPrompt(subject, difficulty, examLevel, questionType);
    
    // Generate a shorter prompt to reduce processing time
    const userPrompt = `Create a ${difficulty} ${questionType} question on ${subject} in JSON format only.`;
    
    // Get response from DeepSeek API with a shorter timeout
    const response = await generateDeepSeekResponse(systemPrompt, userPrompt);
    
    // Parse the JSON response
    let questionData;
    try {
      questionData = JSON.parse(response);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.log('Raw response:', response);
      
      // Return a fallback question when JSON parsing fails
      return generateFallbackQuestion(subject, difficulty, examLevel, questionType, questionIndex, "JSON parsing error");
    }
    
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
  } catch (err) {
    console.error('Error generating question:', err);
    
    // Handle the error properly by ensuring it's an Error object
    const error = err instanceof Error ? err : new Error(String(err));
    
    // Return a fallback question in case of error
    return generateFallbackQuestion(subject, difficulty, examLevel, questionType, questionIndex, error.message || "Generation error");
  }
}

/**
 * Generate a fallback question when API fails
 */
function generateFallbackQuestion(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionType: QuestionType,
  questionIndex: number,
  errorReason: string
): Question {
  // Create a more realistic fallback question based on the subject
  let questionText = '';
  let options: string[] | undefined;
  let correctAnswer: number | undefined;
  
  // Generate subject-specific fallback questions
  switch (subject) {
    case 'Taxation':
      if (questionType === 'MCQ') {
        questionText = 'Which section of Income Tax Act provides deduction for payment of life insurance premium?';
        options = ['Section 80C', 'Section 80D', 'Section 80G', 'Section 10(10D)'];
        correctAnswer = 0;
      } else {
        questionText = 'Explain the concept of Minimum Alternate Tax (MAT) under the Income Tax Act and its implications for companies.';
      }
      break;
      
    case 'Corporate Law':
      if (questionType === 'MCQ') {
        questionText = 'Which of the following is NOT a type of company under the Companies Act, 2013?';
        options = ['Private Company', 'Public Company', 'One Person Company', 'Partnership Company'];
        correctAnswer = 3;
      } else {
        questionText = 'Explain the doctrine of ultra vires and its implications on company contracts with reference to relevant case laws.';
      }
      break;
      
    case 'Accounting Standards':
      if (questionType === 'MCQ') {
        questionText = 'Which Ind AS deals with Revenue Recognition?';
        options = ['Ind AS 101', 'Ind AS 115', 'Ind AS 116', 'Ind AS 109'];
        correctAnswer = 1;
      } else {
        questionText = 'Explain the key differences between AS 19 and Ind AS 116 on Leases with suitable examples.';
      }
      break;
      
    case 'Auditing':
      if (questionType === 'MCQ') {
        questionText = 'Which of the following is NOT an audit assertion for classes of transactions?';
        options = ['Occurrence', 'Accuracy', 'Classification', 'Ownership'];
        correctAnswer = 3;
      } else {
        questionText = 'Discuss the audit procedures to verify Property, Plant and Equipment as per SA 500.';
      }
      break;
      
    default:
      // Generic fallback
      if (questionType === 'MCQ') {
        questionText = `${subject} question ${questionIndex + 1}: Which of the following statements is correct?`;
        options = ['Option A is correct', 'Option B is correct', 'Option C is correct', 'Option D is correct'];
        correctAnswer = 0;
      } else {
        questionText = `${subject} question ${questionIndex + 1}: Explain the key principles and concepts related to ${subject} with reference to recent developments.`;
      }
  }
  
  // Add a non-visible indicator this is a fallback question for debugging
  const fallbackId = `${subject.toLowerCase()}-fallback-${questionType.toLowerCase()}-${questionIndex}`;
  
  // Log the fallback for debugging
  console.log(`Using fallback question ${fallbackId} due to: ${errorReason}`);
  
  return {
    id: fallbackId,
    text: questionText,
    type: questionType,
    options: questionType === 'MCQ' ? options : undefined,
    correctAnswer: questionType === 'MCQ' ? correctAnswer : undefined,
    isCompulsory: questionIndex < 3,
    marks: questionType === 'MCQ' ? 1 : 16
  };
}

/**
 * Generate more fallback questions for immediate display
 */
export function generateMultipleFallbackQuestions(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  count: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed'
): Question[] {
  const questions: Question[] = [];
  
  // Determine distribution of question types
  let mcqCount = 0;
  let subjectiveCount = 0;
  
  switch (paperType) {
    case 'Objective':
      mcqCount = count;
      break;
    case 'Subjective':
      subjectiveCount = count;
      break;
    case 'Mixed':
      mcqCount = Math.ceil(count * 0.7);
      subjectiveCount = count - mcqCount;
      break;
  }
  
  // Generate MCQ fallback questions
  for (let i = 0; i < mcqCount; i++) {
    questions.push(generateFallbackQuestion(
      subject, difficulty, examLevel, 'MCQ', i, 'Immediate fallback'
    ));
  }
  
  // Generate subjective fallback questions
  for (let i = 0; i < subjectiveCount; i++) {
    questions.push(generateFallbackQuestion(
      subject, difficulty, examLevel, 'Subjective', mcqCount + i, 'Immediate fallback'
    ));
  }
  
  return questions;
}

/**
 * Generate a cache key for storing/retrieving questions
 */
function generateCacheKey(subject: string, difficulty: string, examLevel: string, paperType: string): string {
  return `${subject}-${difficulty}-${examLevel}-${paperType}`;
}

/**
 * Check if a cached entry is still valid
 */
function isCacheValid(cacheEntry: { questions: Question[], timestamp: number }): boolean {
  const now = Date.now();
  return now - cacheEntry.timestamp < CACHE_TTL;
}

/**
 * Generate multiple questions for a mock test with optimized batch processing and caching
 */
export async function generateQuestionsForTest(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionCount: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed'
): Promise<Question[]> {
  console.time('Question generation time');
  
  // Check if we have valid cached questions for this combination
  const cacheKey = generateCacheKey(subject, difficulty, examLevel, paperType);
  const cachedData = questionCache[cacheKey];
  
  if (cachedData && isCacheValid(cachedData) && cachedData.questions.length >= questionCount) {
    console.log(`Using ${questionCount} cached questions for ${subject}`);
    console.timeEnd('Question generation time');
    return cachedData.questions.slice(0, questionCount);
  }
  
  // Generate immediate fallback questions to return quickly
  const fallbackQuestions = generateMultipleFallbackQuestions(
    subject, difficulty, examLevel, questionCount, paperType
  );
  
  // Set fallback questions in cache with current timestamp
  questionCache[cacheKey] = {
    questions: fallbackQuestions,
    timestamp: Date.now()
  };
  
  // Start asynchronous generation of real questions
  generateRealQuestionsAsync(subject, difficulty, examLevel, questionCount, paperType, cacheKey)
    .catch(error => console.error('Background question generation error:', error));
  
  // Return fallback questions immediately for fast response
  console.timeEnd('Question generation time');
  return fallbackQuestions;
}

/**
 * Generate real questions asynchronously and update cache
 */
async function generateRealQuestionsAsync(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  examLevel: 'Foundation' | 'Intermediate' | 'Final',
  questionCount: number,
  paperType: 'Subjective' | 'Objective' | 'Mixed',
  cacheKey: string
): Promise<void> {
  try {
    const realQuestions: Question[] = [];
    
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
    
    // Generate MCQ questions in smaller batches with parallel processing
    if (mcqCount > 0) {
      const batchSize = 2; // Small batch size
      
      for (let i = 0; i < mcqCount; i += batchSize) {
        // Create a batch of promises
        const batch = Array.from(
          { length: Math.min(batchSize, mcqCount - i) }, 
          (_, j) => generateQuestion(subject, difficulty, examLevel, 'MCQ', i + j)
        );
        
        // Process batch in parallel
        const batchResults = await Promise.all(batch);
        realQuestions.push(...batchResults);
        
        // Update the cache after each batch
        questionCache[cacheKey] = {
          questions: [...realQuestions],
          timestamp: Date.now()
        };
        
        console.log(`Generated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(mcqCount/batchSize)} of MCQ questions`);
        
        // Add a small delay between batches
        if (i + batchSize < mcqCount) {
          await delay(500); // 500ms delay
        }
      }
    }
    
    // Generate subjective questions one at a time
    if (subjectiveCount > 0) {
      for (let i = 0; i < subjectiveCount; i++) {
        const question = await generateQuestion(subject, difficulty, examLevel, 'Subjective', mcqCount + i);
        realQuestions.push(question);
        
        // Update the cache after each question
        questionCache[cacheKey] = {
          questions: [...realQuestions],
          timestamp: Date.now()
        };
        
        console.log(`Generated subjective question ${i + 1}/${subjectiveCount}`);
        
        // Add a small delay between questions
        if (i + 1 < subjectiveCount) {
          await delay(500); // 500ms delay
        }
      }
    }
    
    console.log(`Background generation complete: ${realQuestions.length} questions for ${subject}`);
    
  } catch (error) {
    console.error('Error in background question generation:', error);
  }
}