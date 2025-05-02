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
 * Now adds variety to prevent duplicates
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
  
  // Generate MCQ fallback questions with variety
  const mcqQuestions = getVariedMCQs(subject, mcqCount);
  
  for (let i = 0; i < mcqCount; i++) {
    const questionData = mcqQuestions[i] || getDefaultMCQ(subject, i);
    
    questions.push({
      id: `${subject.toLowerCase()}-fallback-mcq-${i}`,
      text: questionData.text,
      type: 'MCQ',
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      isCompulsory: i < 3,
      marks: 1
    });
  }
  
  // Generate subjective fallback questions with variety
  const subjQuestions = getVariedSubjectives(subject, subjectiveCount);
  
  for (let i = 0; i < subjectiveCount; i++) {
    const questionText = subjQuestions[i] || `Explain the key principles and concepts related to ${subject} with reference to recent developments.`;
    
    questions.push({
      id: `${subject.toLowerCase()}-fallback-subjective-${i}`,
      text: questionText,
      type: 'Subjective',
      isCompulsory: false,
      marks: 16
    });
  }
  
  return questions;
}

/**
 * Provide varied MCQ questions based on subject
 */
function getVariedMCQs(subject: string, count: number): Array<{text: string, options: string[], correctAnswer: number}> {
  const subjectQuestions: Record<string, Array<{text: string, options: string[], correctAnswer: number}>> = {
    'Taxation': [
      {
        text: 'Which section of Income Tax Act provides deduction for payment of life insurance premium?',
        options: ['Section 80C', 'Section 80D', 'Section 80G', 'Section 10(10D)'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following incomes is exempt under section 10 of the Income Tax Act?',
        options: ['Salary income', 'Agricultural income', 'Business income', 'Income from house property'],
        correctAnswer: 1
      },
      {
        text: 'TDS on salary is covered under which section?',
        options: ['Section 192', 'Section 194C', 'Section 194J', 'Section 195'],
        correctAnswer: 0
      },
      {
        text: 'The due date for filing ITR-4 for non-audit cases is:',
        options: ['July 31', 'September 30', 'October 31', 'November 30'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following is not considered as a capital asset?',
        options: ['Jewelry', 'Urban Land', 'Personal Car', 'Rural Agricultural Land'],
        correctAnswer: 3
      },
      {
        text: 'What is the threshold limit for tax audit under section 44AB for a trader?',
        options: ['₹1 crore', '₹2 crore', '₹5 crore', '₹10 crore'],
        correctAnswer: 1
      },
      {
        text: 'Long-term capital gains on sale of listed equity shares are taxed at:',
        options: ['10%', '15%', '20% with indexation', '30%'],
        correctAnswer: 0
      },
      {
        text: 'Which form is used for filing TDS return for salary payments?',
        options: ['Form 24Q', 'Form 26Q', 'Form 27Q', 'Form 16A'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following is a direct tax?',
        options: ['Income Tax', 'GST', 'Customs Duty', 'Excise Duty'],
        correctAnswer: 0
      },
      {
        text: 'For a resident individual, income received outside India is:',
        options: ['Fully taxable in India', 'Exempt in India', 'Partially taxable in India', 'Taxable only if remitted to India'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following is not a head of income under Income Tax Act?',
        options: ['Income from Salary', 'Income from House Property', 'Income from Digital Assets', 'Income from Capital Gains'],
        correctAnswer: 2
      },
      {
        text: 'The surcharge applicable to domestic companies having total income exceeding ₹10 crore is:',
        options: ['7%', '10%', '12%', '15%'],
        correctAnswer: 2
      },
      {
        text: 'Under which section is deduction for medical insurance premium available?',
        options: ['Section 80C', 'Section 80D', 'Section 80G', 'Section 80TTA'],
        correctAnswer: 1
      },
      {
        text: 'The maximum amount eligible for deduction under section 80C is:',
        options: ['₹1,00,000', '₹1,50,000', '₹2,00,000', '₹2,50,000'],
        correctAnswer: 1
      },
      {
        text: 'For calculating income from house property, the maximum interest deduction for self-occupied property is:',
        options: ['₹30,000', '₹2,00,000', '₹1,50,000', 'No limit'],
        correctAnswer: 1
      }
    ],
    'Accounting Standards': [
      {
        text: 'Which Ind AS deals with Revenue Recognition?',
        options: ['Ind AS 101', 'Ind AS 115', 'Ind AS 116', 'Ind AS 109'],
        correctAnswer: 1
      },
      {
        text: 'Ind AS 116 deals with:',
        options: ['Financial Instruments', 'Leases', 'Revenue', 'Business Combinations'],
        correctAnswer: 1
      },
      {
        text: 'Which Ind AS is equivalent to IFRS 9?',
        options: ['Ind AS 32', 'Ind AS 107', 'Ind AS 109', 'Ind AS 113'],
        correctAnswer: 2
      },
      {
        text: 'Fair Value Measurement is covered under:',
        options: ['Ind AS 113', 'Ind AS 110', 'Ind AS 109', 'Ind AS 102'],
        correctAnswer: 0
      },
      {
        text: 'Which standard deals with Presentation of Financial Statements?',
        options: ['Ind AS 1', 'Ind AS 7', 'Ind AS 10', 'Ind AS 12'],
        correctAnswer: 0
      },
      {
        text: 'Impairment of Assets is covered under:',
        options: ['Ind AS 36', 'Ind AS 16', 'Ind AS 38', 'Ind AS 40'],
        correctAnswer: 0
      },
      {
        text: 'Which Ind AS deals with Consolidated Financial Statements?',
        options: ['Ind AS 110', 'Ind AS 112', 'Ind AS 107', 'Ind AS 103'],
        correctAnswer: 0
      },
      {
        text: 'Property, Plant and Equipment is governed by:',
        options: ['Ind AS 16', 'Ind AS 38', 'Ind AS 40', 'Ind AS 36'],
        correctAnswer: 0
      },
      {
        text: 'Statement of Cash Flows is covered under:',
        options: ['Ind AS 7', 'Ind AS 1', 'Ind AS 10', 'Ind AS 8'],
        correctAnswer: 0
      },
      {
        text: 'Which Ind AS deals with Income Taxes?',
        options: ['Ind AS 12', 'Ind AS 19', 'Ind AS 20', 'Ind AS 23'],
        correctAnswer: 0
      }
    ],
    'Corporate Law': [
      {
        text: 'Which of the following is NOT a type of company under the Companies Act, 2013?',
        options: ['Private Company', 'Public Company', 'One Person Company', 'Partnership Company'],
        correctAnswer: 3
      },
      {
        text: 'Minimum number of directors required in a public company is:',
        options: ['1', '2', '3', '7'],
        correctAnswer: 2
      },
      {
        text: 'Who appoints the first auditor of a company?',
        options: ['Shareholders', 'Board of Directors', 'Managing Director', 'Company Secretary'],
        correctAnswer: 1
      },
      {
        text: 'The quorum for a public company with more than 5000 members is:',
        options: ['5 members', '15 members', '30 members', '100 members'],
        correctAnswer: 2
      },
      {
        text: 'Corporate Social Responsibility is mandatory for companies with:',
        options: ['Net worth ≥ ₹500 crore', 'Turnover ≥ ₹1000 crore', 'Net profit ≥ ₹5 crore', 'Any of these'],
        correctAnswer: 3
      },
      {
        text: 'Which form is used for incorporation of a company?',
        options: ['SPICe+ (INC-32)', 'DIR-3', 'AOC-4', 'MGT-7'],
        correctAnswer: 0
      },
      {
        text: 'Maximum number of members in a private company is:',
        options: ['50', '100', '200', 'Unlimited'],
        correctAnswer: 2
      },
      {
        text: 'Which section of Companies Act deals with Related Party Transactions?',
        options: ['Section 188', 'Section 149', 'Section 135', 'Section 92'],
        correctAnswer: 0
      },
      {
        text: 'Annual Return of a company is filed in:',
        options: ['Form MGT-7', 'Form AOC-4', 'Form DIR-12', 'Form INC-22'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following is a Key Managerial Personnel?',
        options: ['Independent Director', 'Statutory Auditor', 'Company Secretary', 'Both A and C'],
        correctAnswer: 2
      }
    ],
    'Auditing': [
      {
        text: 'Which of the following is NOT an audit assertion for classes of transactions?',
        options: ['Occurrence', 'Accuracy', 'Classification', 'Ownership'],
        correctAnswer: 3
      },
      {
        text: 'Audit sampling is covered under which Standard on Auditing?',
        options: ['SA 500', 'SA 520', 'SA 530', 'SA 550'],
        correctAnswer: 2
      },
      {
        text: 'Which of the following is NOT a type of audit opinion?',
        options: ['Unqualified opinion', 'Qualified opinion', 'Adverse opinion', 'Speculative opinion'],
        correctAnswer: 3
      },
      {
        text: 'Audit working papers should be retained for a minimum period of:',
        options: ['3 years', '5 years', '7 years', '10 years'],
        correctAnswer: 3
      },
      {
        text: 'An auditor obtains audit evidence primarily through:',
        options: ['Inquiry alone', 'Management representations', 'Third party confirmations only', 'A combination of procedures'],
        correctAnswer: 3
      },
      {
        text: 'Which SA deals with Audit Planning?',
        options: ['SA 300', 'SA 200', 'SA 240', 'SA 315'],
        correctAnswer: 0
      },
      {
        text: 'The primary responsibility for prevention and detection of fraud rests with:',
        options: ['Auditor', 'Management', 'Audit Committee', 'Shareholders'],
        correctAnswer: 1
      },
      {
        text: 'Which of the following is NOT a component of internal control?',
        options: ['Control environment', 'Risk assessment', 'Control activities', 'Audit sampling'],
        correctAnswer: 3
      },
      {
        text: 'Materiality for financial statements as a whole is addressed in:',
        options: ['SA 320', 'SA 330', 'SA 450', 'SA 500'],
        correctAnswer: 0
      },
      {
        text: 'Which of the following is NOT a substantive procedure?',
        options: ['Analytical procedures', 'Tests of details', 'Test of controls', 'External confirmation'],
        correctAnswer: 2
      }
    ]
  };
  
  // Use default questions for subjects not in our predefined list
  if (!subjectQuestions[subject]) {
    return Array(count).fill(null);
  }
  
  // Return up to 'count' questions for the subject
  return subjectQuestions[subject].slice(0, count);
}

/**
 * Provide varied subjective questions based on subject
 */
function getVariedSubjectives(subject: string, count: number): string[] {
  const subjectQuestions: Record<string, string[]> = {
    'Accounting Standards': [
      'Explain the key differences between Ind AS 17 and Ind AS 116 on Leases with suitable examples.',
      'Discuss the recognition and measurement principles of financial instruments under Ind AS 109.',
      'Explain the concept of control as per Ind AS 110 and how it differs from AS 21.',
      'Discuss the expected credit loss model under Ind AS 109 with examples.',
      'Explain the five-step model for revenue recognition under Ind AS 115.'
    ],
    'Taxation': [
      'Explain the concept of Minimum Alternate Tax (MAT) under the Income Tax Act and its implications for companies.',
      'Discuss the provisions related to TDS and TCS with recent amendments.',
      'Explain the concept of capital gains with examples and computation methodology.',
      'Discuss the assessment procedure under Income Tax Act 1961.',
      'Explain various deductions available under Chapter VI-A of the Income Tax Act.'
    ],
    'Corporate Law': [
      'Explain the doctrine of ultra vires and its implications on company contracts with reference to relevant case laws.',
      'Discuss the provisions relating to Corporate Social Responsibility under the Companies Act, 2013.',
      'Explain the role and responsibilities of Independent Directors under the Companies Act, 2013.',
      'Discuss the provisions relating to related party transactions under the Companies Act, 2013.',
      'Explain the concept of One Person Company and its advantages and limitations.'
    ],
    'Auditing': [
      'Discuss the audit procedures to verify Property, Plant and Equipment as per SA 500.',
      'Explain the concept of audit risk and its components with examples.',
      'Discuss the auditor\'s responsibility towards fraud detection as per SA 240.',
      'Explain the audit documentation requirements as per SA 230.',
      'Discuss the concept of materiality in audit planning and execution as per SA 320.'
    ]
  };
  
  // Use default questions for subjects not in our predefined list
  if (!subjectQuestions[subject]) {
    return Array(count).fill(null);
  }
  
  // Return up to 'count' questions for the subject
  return subjectQuestions[subject].slice(0, count);
}

/**
 * Get a default MCQ when no specific subject question is available
 */
function getDefaultMCQ(subject: string, index: number): {text: string, options: string[], correctAnswer: number} {
  return {
    text: `${subject} question ${index + 1}: Which of the following statements is correct?`,
    options: ['Option A is correct', 'Option B is correct', 'Option C is correct', 'Option D is correct'],
    correctAnswer: 0
  };
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
  
  console.log(`Generating ${questionCount} new AI questions for ${subject}`);
  
  // Check if DeepSeek API is available
  if (!isDeepSeekAvailable) {
    console.warn('DeepSeek API not available, generating fallback questions');
    const fallbackQuestions = generateMultipleFallbackQuestions(
      subject, difficulty, examLevel, questionCount, paperType
    );
    console.timeEnd('Question generation time');
    return fallbackQuestions;
  }
  
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
  
  // Results array
  const generatedQuestions: Question[] = [];
  
  try {
    // Generate MCQ questions in smaller batches with parallel processing
    if (mcqCount > 0) {
      const batchSize = 2; // Small batch size
      
      for (let i = 0; i < mcqCount; i += batchSize) {
        // Create a batch of promises
        const batch = Array.from(
          { length: Math.min(batchSize, mcqCount - i) }, 
          (_, j) => generateQuestion(subject, difficulty, examLevel, 'MCQ', i + j)
        );
        
        try {
          // Process batch in parallel
          const batchResults = await Promise.all(batch);
          generatedQuestions.push(...batchResults);
          
          console.log(`Generated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(mcqCount/batchSize)} of MCQ questions`);
        } catch (error) {
          console.error(`Error generating batch of MCQ questions:`, error);
          // Add fallback questions for this batch
          for (let j = 0; j < Math.min(batchSize, mcqCount - i); j++) {
            generatedQuestions.push(
              generateFallbackQuestion(subject, difficulty, examLevel, 'MCQ', i + j, 'Batch generation failed')
            );
          }
        }
        
        // Add a small delay between batches
        if (i + batchSize < mcqCount) {
          await delay(500); // 500ms delay
        }
      }
    }
    
    // Generate subjective questions one at a time
    if (subjectiveCount > 0) {
      for (let i = 0; i < subjectiveCount; i++) {
        try {
          const question = await generateQuestion(subject, difficulty, examLevel, 'Subjective', mcqCount + i);
          generatedQuestions.push(question);
          console.log(`Generated subjective question ${i + 1}/${subjectiveCount}`);
        } catch (error) {
          console.error(`Error generating subjective question ${i + 1}:`, error);
          // Add fallback question
          generatedQuestions.push(
            generateFallbackQuestion(subject, difficulty, examLevel, 'Subjective', mcqCount + i, 'Generation failed')
          );
        }
        
        // Add a small delay between questions
        if (i + 1 < subjectiveCount) {
          await delay(500); // 500ms delay
        }
      }
    }
    
    // Save to cache if we have generated any questions
    if (generatedQuestions.length > 0) {
      questionCache[cacheKey] = {
        questions: generatedQuestions,
        timestamp: Date.now()
      };
    }
    
    console.log(`Successfully generated ${generatedQuestions.length} questions for ${subject}`);
    console.timeEnd('Question generation time');
    return generatedQuestions;
    
  } catch (error) {
    console.error('Error in AI question generation:', error);
    
    // If AI generation completely fails, use fallback questions
    console.warn('Using fallback questions due to AI generation failure');
    const fallbackQuestions = generateMultipleFallbackQuestions(
      subject, difficulty, examLevel, questionCount, paperType
    );
    console.timeEnd('Question generation time');
    return fallbackQuestions;
  }
}