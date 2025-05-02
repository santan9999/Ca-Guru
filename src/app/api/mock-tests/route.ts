import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../_init';
import { generateQuestionsForTest } from '@/lib/question-generator';

// Flag to track if database is available
// Initially assume database is available if URL is configured
let isDatabaseAvailable = !!process.env.DATABASE_URL;

// Function to safely execute database operations with fallback
// Exported to be used by other routes
export async function safeDbOperation<T>(dbOperation: () => Promise<T>, fallback: T): Promise<T> {
  // If database is already known to be unavailable, use fallback immediately
  if (!isDatabaseAvailable) return fallback;
  
  try {
    return await dbOperation();
  } catch (error) {
    console.error('Database operation failed:', error);
    // Mark database as unavailable for future operations
    isDatabaseAvailable = false;
    return fallback;
  }
}

// Types for mock test data
type QuestionType = 'MCQ' | 'Subjective';

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number; // Index of the correct option for MCQs
  isCompulsory?: boolean; // Whether this is a compulsory question
  marks?: number; // Marks allocated to this question
};

type MockTest = {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examLevel: 'Foundation' | 'Intermediate' | 'Final'; // CA exam level
  paperType: 'Subjective' | 'Objective' | 'Mixed'; // Type of paper
  questions: Question[];
};


type TestSubmission = {
  testId: string;
  userId: string;
  answers: Record<string, number>; // questionId -> selected option index
  score: number;
  completedAt: string;
  timeSpent: number; // in seconds
  testTitle?: string; // Title of the test
  subject?: string; // Subject of the test
};

// In-memory storage for mock tests and submissions when database is unavailable
export const mockTests: Record<string, MockTest> = {};
export const testSubmissions: TestSubmission[] = [];

// Question banks for dynamic test generation
const mcqQuestionBanks: Record<string, Question[]> = {
  'Taxation': [
    {
      id: 'tax-q1',
      text: 'Which section of Income Tax Act deals with TDS on salary?',
      type: 'MCQ',
      options: ['Section 192', 'Section 194', 'Section 80C', 'Section 10'],
      correctAnswer: 0
    },
    {
      id: 'tax-q2',
      text: 'What is the due date for filing ITR-1 for individuals not requiring audit?',
      type: 'MCQ',
      options: ['31st March', '31st July', '30th September', '31st December'],
      correctAnswer: 1
    },
    {
      id: 'tax-q3',
      text: 'Which of the following is not a head of income under Income Tax Act?',
      type: 'MCQ',
      options: ['Income from Salary', 'Income from House Property', 'Income from Digital Assets', 'Income from Capital Gains'],
      correctAnswer: 2
    },
    {
      id: 'tax-q4',
      text: 'What is the threshold limit for tax audit for a professional?',
      type: 'MCQ',
      options: ['₹50 Lakhs', '₹1 Crore', '₹2 Crores', '₹5 Crores'],
      correctAnswer: 0
    },
    {
      id: 'tax-q5',
      text: 'Which form is used for filing TDS return for salary?',
      type: 'MCQ',
      options: ['Form 24Q', 'Form 26Q', 'Form 27Q', 'Form 16A'],
      correctAnswer: 0
    },
    {
      id: 'tax-q6',
      text: 'Which of the following is exempt from income tax?',
      type: 'MCQ',
      options: ['Salary income', 'Agricultural income', 'Business income', 'Income from house property'],
      correctAnswer: 1
    },
    {
      id: 'tax-q7',
      text: 'What is the maximum amount of deduction available under section 80C?',
      type: 'MCQ',
      options: ['₹1,00,000', '₹1,50,000', '₹2,00,000', '₹2,50,000'],
      correctAnswer: 1
    },
    {
      id: 'tax-q8',
      text: 'Which ITR form is applicable for companies?',
      type: 'MCQ',
      options: ['ITR-1', 'ITR-3', 'ITR-5', 'ITR-6'],
      correctAnswer: 3
    }
  ],
  'Corporate Law': [
    {
      id: 'corp-q1',
      text: 'What is the minimum number of directors required for a public company?',
      type: 'MCQ',
      options: ['1', '2', '3', '7'],
      correctAnswer: 2
    },
    {
      id: 'corp-q2',
      text: 'Which form is used for incorporation of a company?',
      type: 'MCQ',
      options: ['SPICe+ (INC-32)', 'DIR-3', 'AOC-4', 'MGT-7'],
      correctAnswer: 0
    },
    {
      id: 'corp-q3',
      text: 'What is the minimum paid-up capital requirement for a private limited company?',
      type: 'MCQ',
      options: ['₹1 Lakh', '₹5 Lakhs', 'No minimum requirement', '₹10 Lakhs'],
      correctAnswer: 2
    },
    {
      id: 'corp-q4',
      text: 'Which section of Companies Act, 2013 deals with Corporate Social Responsibility?',
      type: 'MCQ',
      options: ['Section 135', 'Section 149', 'Section 184', 'Section 92'],
      correctAnswer: 0
    },
    {
      id: 'corp-q5',
      text: 'What is the time limit for holding the first board meeting after incorporation?',
      type: 'MCQ',
      options: ['30 days', '60 days', '90 days', '180 days'],
      correctAnswer: 0
    },
    {
      id: 'corp-q6',
      text: 'Which of the following is not a type of company under Companies Act, 2013?',
      type: 'MCQ',
      options: ['Private Company', 'Public Company', 'Holding Company', 'Partnership Company'],
      correctAnswer: 3
    },
    {
      id: 'corp-q7',
      text: 'What is the minimum number of members required for a private company?',
      type: 'MCQ',
      options: ['1', '2', '3', '7'],
      correctAnswer: 1
    },
    {
      id: 'corp-q8',
      text: 'Which of the following is not a document required for incorporation of a company?',
      type: 'MCQ',
      options: ['Memorandum of Association', 'Articles of Association', 'Certificate of Incorporation', 'Partnership Deed'],
      correctAnswer: 3
    }
  ],
  'Accounting Standards': [
    {
      id: 'acc-q1',
      text: 'Which accounting standard deals with Revenue Recognition?',
      type: 'MCQ',
      options: ['AS 1', 'AS 9', 'AS 7', 'AS 10'],
      correctAnswer: 1
    },
    {
      id: 'acc-q2',
      text: 'IFRS 15 deals with:',
      type: 'MCQ',
      options: ['Revenue from Contracts with Customers', 'Leases', 'Financial Instruments', 'Business Combinations'],
      correctAnswer: 0
    },
    {
      id: 'acc-q3',
      text: 'Which of the following is not a qualitative characteristic of financial information?',
      type: 'MCQ',
      options: ['Relevance', 'Faithful representation', 'Materiality', 'Profitability'],
      correctAnswer: 3
    },
    {
      id: 'acc-q4',
      text: 'Which accounting standard deals with Depreciation Accounting?',
      type: 'MCQ',
      options: ['AS 6', 'AS 10', 'AS 11', 'AS 16'],
      correctAnswer: 0
    },
    {
      id: 'acc-q5',
      text: 'The conceptual framework for financial reporting is issued by:',
      type: 'MCQ',
      options: ['ICAI', 'IASB', 'MCA', 'SEBI'],
      correctAnswer: 1
    }
  ],
  'Auditing': [
    {
      id: 'aud-q1',
      text: 'Which SA deals with Audit Planning?',
      type: 'MCQ',
      options: ['SA 300', 'SA 200', 'SA 500', 'SA 700'],
      correctAnswer: 0
    },
    {
      id: 'aud-q2',
      text: 'The primary objective of an external audit is:',
      type: 'MCQ',
      options: ['Detecting fraud', 'Expressing an opinion on financial statements', 'Improving internal control', 'Ensuring compliance with laws'],
      correctAnswer: 1
    },
    {
      id: 'aud-q3',
      text: 'Which of the following is not a type of audit opinion?',
      type: 'MCQ',
      options: ['Unqualified opinion', 'Qualified opinion', 'Adverse opinion', 'Suggestive opinion'],
      correctAnswer: 3
    },
    {
      id: 'aud-q4',
      text: 'Audit risk is composed of:',
      type: 'MCQ',
      options: ['Inherent risk, control risk, and detection risk', 'Business risk, financial risk, and legal risk', 'Market risk, credit risk, and operational risk', 'Strategic risk, compliance risk, and reputational risk'],
      correctAnswer: 0
    },
    {
      id: 'aud-q5',
      text: 'Which of the following is not a method of obtaining audit evidence?',
      type: 'MCQ',
      options: ['Inspection', 'Observation', 'Confirmation', 'Imagination'],
      correctAnswer: 3
    }
  ]
};

// Subjective question banks for different subjects
const subjectiveQuestionBanks: Record<string, Question[]> = {
  'Taxation': [
    {
      id: 'tax-subj-1',
      text: 'Explain the concept of tax planning, tax avoidance, and tax evasion with suitable examples.',
      type: 'Subjective',
      isCompulsory: true,
      marks: 20
    },
    {
      id: 'tax-subj-2',
      text: 'Calculate the taxable income and tax liability of Mr. Sharma based on the following information...',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'tax-subj-3',
      text: 'Discuss the provisions related to TDS under section 194J of the Income Tax Act.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'tax-subj-4',
      text: 'Explain the concept of Minimum Alternate Tax (MAT) and its implications for companies.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'tax-subj-5',
      text: 'Write short notes on: (a) Tax Residency Certificate (b) Advance Ruling (c) DTAA',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'tax-subj-6',
      text: 'Explain the provisions related to set-off and carry forward of losses under the Income Tax Act.',
      type: 'Subjective',
      marks: 16
    }
  ],
  'Corporate Law': [
    {
      id: 'corp-subj-1',
      text: 'Explain the doctrine of ultra vires and its implications on the company and third parties.',
      type: 'Subjective',
      isCompulsory: true,
      marks: 20
    },
    {
      id: 'corp-subj-2',
      text: 'Discuss the provisions related to Corporate Social Responsibility under the Companies Act, 2013.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'corp-subj-3',
      text: 'Explain the concept of One Person Company and its advantages and limitations.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'corp-subj-4',
      text: 'Discuss the role and responsibilities of Independent Directors under the Companies Act, 2013.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'corp-subj-5',
      text: 'Explain the provisions related to appointment and removal of directors under the Companies Act, 2013.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'corp-subj-6',
      text: 'Write short notes on: (a) Key Managerial Personnel (b) Board Committees (c) Annual General Meeting',
      type: 'Subjective',
      marks: 16
    }
  ],
  'Accounting Standards': [
    {
      id: 'acc-subj-1',
      text: 'Explain the framework for preparation and presentation of financial statements as per Ind AS.',
      type: 'Subjective',
      isCompulsory: true,
      marks: 20
    },
    {
      id: 'acc-subj-2',
      text: 'Discuss the provisions of Ind AS 16 on Property, Plant and Equipment with examples.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'acc-subj-3',
      text: 'Explain the concept of fair value measurement as per Ind AS 113.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'acc-subj-4',
      text: 'Discuss the provisions of Ind AS 115 on Revenue from Contracts with Customers.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'acc-subj-5',
      text: 'Explain the provisions of Ind AS 36 on Impairment of Assets.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'acc-subj-6',
      text: 'Write short notes on: (a) Cash Flow Statement (b) Segment Reporting (c) Earnings Per Share',
      type: 'Subjective',
      marks: 16
    }
  ],
  'Auditing': [
    {
      id: 'aud-subj-1',
      text: 'Explain the concept of audit risk and its components with examples.',
      type: 'Subjective',
      isCompulsory: true,
      marks: 20
    },
    {
      id: 'aud-subj-2',
      text: 'Discuss the provisions of SA 500 on Audit Evidence.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'aud-subj-3',
      text: 'Explain the concept of materiality in the context of audit planning and execution.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'aud-subj-4',
      text: 'Discuss the provisions of SA 700 on Forming an Opinion and Reporting on Financial Statements.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'aud-subj-5',
      text: 'Explain the concept of internal control and its importance in audit.',
      type: 'Subjective',
      marks: 16
    },
    {
      id: 'aud-subj-6',
      text: 'Write short notes on: (a) Audit Sampling (b) Audit Documentation (c) Analytical Procedures',
      type: 'Subjective',
      marks: 16
    }
  ]
};

// Test templates for dynamic generation based on CA exam patterns
export const testTemplates: Record<string, Omit<MockTest, 'id' | 'questions'>> = {
  'foundation-mcq': {
    title: 'CA Foundation - MCQ Practice',
    subject: 'Taxation',
    duration: 120,
    questionCount: 100,
    difficulty: 'Medium',
    examLevel: 'Foundation',
    paperType: 'Objective'
  },
  'foundation-subj': {
    title: 'CA Foundation - Subjective Practice',
    subject: 'Corporate Law',
    duration: 180,
    questionCount: 6,
    difficulty: 'Medium',
    examLevel: 'Foundation',
    paperType: 'Subjective'
  },
  'intermediate-mixed': {
    title: 'CA Intermediate - Mixed Format',
    subject: 'Accounting Standards',
    duration: 180,
    questionCount: 36, // 6 subjective + 30 MCQs
    difficulty: 'Hard',
    examLevel: 'Intermediate',
    paperType: 'Mixed'
  },
  'intermediate-subj': {
    title: 'CA Intermediate - Subjective Practice',
    subject: 'Auditing',
    duration: 180,
    questionCount: 6,
    difficulty: 'Hard',
    examLevel: 'Intermediate',
    paperType: 'Subjective'
  },
  'final-subj': {
    title: 'CA Final - Subjective Practice',
    subject: 'Taxation',
    duration: 180,
    questionCount: 6,
    difficulty: 'Hard',
    examLevel: 'Final',
    paperType: 'Subjective'
  },
  'final-mixed': {
    title: 'CA Final - Strategic Management',
    subject: 'Corporate Law',
    duration: 180,
    questionCount: 36, // 6 subjective + 30 MCQs
    difficulty: 'Hard',
    examLevel: 'Final',
    paperType: 'Mixed'
  }
};

// Function to generate a unique ID
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to safely transform AI-generated questions to the correct type
function transformToQuestionType(questions: any[]): Question[] {
  return questions.map(q => {
    // Determine the correct question type
    const questionType: QuestionType = q.type === 'Subjective' ? 'Subjective' : 'MCQ';
    
    // Return a properly typed question object
    return {
      id: q.id || generateUniqueId('q'),
      text: q.text || 'Unknown question',
      type: questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      isCompulsory: q.isCompulsory || false,
      marks: q.marks || (questionType === 'MCQ' ? 1 : 16)
    };
  });
}

// Function to generate a test with AI-generated questions based on CA exam pattern
async function generateTest(templateId: string): Promise<MockTest | null> {
  const template = testTemplates[templateId];
  if (!template) {
    console.error(`Template not found: ${templateId}`);
    return null;
  }
  
  try {
    // Generate a unique ID for the test
    const testId = generateUniqueId(templateId);
    
    // Try to generate AI questions
    console.log(`Generating ${template.questionCount} questions for ${template.subject} test...`);
    
    try {
      // Generate AI questions
      const aiQuestions = await generateQuestionsForTest(
        template.subject,
        template.difficulty,
        template.examLevel,
        template.questionCount,
        template.paperType
      );
      
      // If AI questions were successfully generated, use them
      if (aiQuestions && aiQuestions.length > 0) {
        console.log(`Successfully generated ${aiQuestions.length} AI questions`);
        
        // Transform AI questions to ensure they match the Question type
        const typedQuestions = transformToQuestionType(aiQuestions);
        
        const newTest: MockTest = {
          id: testId,
          title: template.title,
          subject: template.subject,
          duration: template.duration,
          questionCount: typedQuestions.length,
          difficulty: template.difficulty,
          examLevel: template.examLevel,
          paperType: template.paperType,
          questions: typedQuestions
        };
        
        // Store the test for future use
        mockTests[testId] = newTest;
        
        return newTest;
      } else {
        console.warn('AI generated zero questions, but we need questions for the test');
        throw new Error('AI question generation returned empty results');
      }
    } catch (aiError) {
      console.warn('AI question generation failed:', aiError);
      throw new Error(`Failed to generate AI questions: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
    }
  } catch (error) {
    console.error('Error in test generation:', error);
    throw error; // Propagate the error to the route handler
  }
}

// Fallback function to generate a test with static questions from the question bank
function generateStaticTest(templateId: string): MockTest | null {
  const template = testTemplates[templateId];
  if (!template) return null;
  
  let selectedQuestions: Question[] = [];
  
  // Generate test based on paper type
  switch (template.paperType) {
    case 'Objective': {
      // For objective papers (MCQs only)
      const mcqBank = mcqQuestionBanks[template.subject];
      if (!mcqBank || mcqBank.length < template.questionCount) return null;
      
      // For Foundation objective papers - 100 MCQs
      selectedQuestions = shuffleArray(mcqBank)
        .slice(0, template.questionCount)
        .map(q => ({ ...q, type: 'MCQ' }));
      break;
    }
    
    case 'Subjective': {
      // For subjective papers
      const subjBank = subjectiveQuestionBanks[template.subject];
      if (!subjBank || subjBank.length < template.questionCount) return null;
      
      // Get all questions and ensure at least one is marked as compulsory
      const shuffledQuestions = shuffleArray(subjBank).slice(0, template.questionCount);
      
      // Ensure first question is compulsory
      selectedQuestions = shuffledQuestions.map((q, index) => {
        if (index === 0) {
          return { ...q, isCompulsory: true };
        }
        return q;
      });
      break;
    }
    
    case 'Mixed': {
      // For mixed papers (30% MCQs + 70% subjective)
      const mcqBank = mcqQuestionBanks[template.subject];
      const subjBank = subjectiveQuestionBanks[template.subject];
      
      if (!mcqBank || !subjBank) return null;
      
      // Calculate number of MCQs (30% of total)
      const mcqCount = 30; // Fixed at 30 MCQs as per CA pattern
      const subjCount = 6; // Fixed at 6 subjective questions as per CA pattern
      
      if (mcqBank.length < mcqCount || subjBank.length < subjCount) return null;
      
      // Get MCQs with explicit type
      const selectedMCQs = shuffleArray(mcqBank)
        .slice(0, mcqCount)
        .map(q => ({ ...q, type: 'MCQ' as QuestionType }));
      
      // Get subjective questions with first one as compulsory
      const shuffledSubj = shuffleArray(subjBank).slice(0, subjCount);
      const selectedSubj = shuffledSubj.map((q, index) => {
        if (index === 0) {
          return { ...q, isCompulsory: true, type: 'Subjective' as QuestionType };
        }
        return { ...q, type: 'Subjective' as QuestionType };
      });
      
      // Combine both types
      selectedQuestions = [...selectedSubj, ...selectedMCQs];
      break;
    }
    
    default:
      return null;
  }
  
  // Generate a unique ID for the test
  const testId = generateUniqueId(templateId);
  
  return {
    id: testId,
    title: template.title,
    subject: template.subject,
    duration: template.duration,
    questionCount: selectedQuestions.length,
    difficulty: template.difficulty,
    examLevel: template.examLevel,
    paperType: template.paperType,
    questions: selectedQuestions
  };
}

// GET endpoint to retrieve available tests or a specific test
export async function GET(req: NextRequest) {
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const testId = url.searchParams.get('testId');
  const templateId = url.searchParams.get('templateId');

  // If testId is provided, return that specific test
  if (testId) {
    // Check if the test exists in our in-memory storage
    const test = mockTests[testId];
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Create a copy without revealing correct answers
    const testForUser = {
      ...test,
      questions: test.questions.map(q => {
        if (q.type === 'MCQ') {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            isCompulsory: q.isCompulsory,
            marks: q.marks || 1 // Default 1 mark for MCQs
          };
        } else {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            isCompulsory: q.isCompulsory,
            marks: q.marks || 16 // Default 16 marks for subjective questions
          };
        }
      })
    };

    return NextResponse.json(testForUser);
  }
  
  // If templateId is provided, generate a new test from that template
  if (templateId) {
    try {
      console.log(`Attempting to generate test from template: ${templateId}`);
      
      // Check if template exists
      if (!testTemplates[templateId]) {
        console.error(`Template not found: ${templateId}`);
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      
      try {
        const newTest = await generateTest(templateId);
        if (!newTest) {
          console.error(`Failed to generate test from template: ${templateId}`);
          return NextResponse.json(
            { error: 'Failed to generate test from template. The AI service may be unavailable.' },
            { status: 500 }
          );
        }
        
        // Verify that the test has questions
        if (!newTest.questions || newTest.questions.length === 0) {
          console.error(`Generated test has no questions: ${templateId}`);
          return NextResponse.json(
            { error: 'Generated test has no questions. The AI service may not be functioning properly.' },
            { status: 500 }
          );
        }
        
        // Store the generated test in memory
        mockTests[newTest.id] = newTest;
        console.log(`Successfully generated test: ${newTest.id} with ${newTest.questions.length} questions`);
        
        // Create a copy without revealing correct answers
        const testForUser = {
          ...newTest,
          questions: newTest.questions.map(q => {
            if (q.type === 'MCQ') {
              return {
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.options,
                isCompulsory: q.isCompulsory,
                marks: q.marks || 1 // Default 1 mark for MCQs
              };
            } else {
              return {
                id: q.id,
                text: q.text,
                type: q.type,
                isCompulsory: q.isCompulsory,
                marks: q.marks || 16 // Default 16 marks for subjective questions
              };
            }
          })
        };
        
        return NextResponse.json(testForUser);
      } catch (error) {
        console.error('Error generating test:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: `Failed to generate AI test: ${errorMessage}. Please try again later.` },
          { status: 500 }
        );
      }
    } catch (outerError) {
      console.error('Unexpected error in template handling:', outerError);
      return NextResponse.json(
        { error: 'An unexpected error occurred while processing your test request.' },
        { status: 500 }
      );
    }
  }

  // Otherwise return list of available test templates
  const availableTests = Object.entries(testTemplates).map(([id, template]) => ({
    id,
    title: template.title,
    subject: template.subject,
    duration: template.duration,
    questionCount: template.questionCount,
    difficulty: template.difficulty
  }));

  return NextResponse.json(availableTests);
}

// POST endpoint to submit a completed test
export async function POST(req: NextRequest) {
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { testId, answers, timeSpent } = await req.json();
    console.log(`Processing test submission for testId: ${testId}, userId: ${userId}`);

    // Validate request
    if (!testId || !answers) {
      console.error('Missing required fields:', { testId, hasAnswers: !!answers });
      return NextResponse.json(
        { error: 'Test ID and answers are required' },
        { status: 400 }
      );
    }

    // Check if test exists in mockTests
    let test = mockTests[testId];
    console.log(`Test found in mockTests: ${!!test}`);
    
    // If not found in mockTests, check if it's a template that needs to be expanded
    if (!test && testTemplates[testId]) {
      console.log(`Test ${testId} not found in mockTests, using template`);
      test = {
        ...testTemplates[testId],
        id: testId,
        questions: []
      };
      
      // Add questions from template
      if (testTemplates[testId].paperType === 'Objective' || testTemplates[testId].paperType === 'Mixed') {
        const mcqBank = mcqQuestionBanks[testTemplates[testId].subject] || [];
        test.questions.push(...mcqBank.slice(0, testTemplates[testId].questionCount));
      }
      
      if (testTemplates[testId].paperType === 'Subjective' || testTemplates[testId].paperType === 'Mixed') {
        const subjBank = subjectiveQuestionBanks[testTemplates[testId].subject] || [];
        test.questions.push(...subjBank.slice(0, Math.ceil(testTemplates[testId].questionCount * 0.3)));
      }
      
      // Store the reconstructed test for future use
      mockTests[testId] = test;
      console.log(`Reconstructed test from template and stored in mockTests`);
    }
    
    if (!test || !test.questions || test.questions.length === 0) {
      console.error('Test not found or has no questions', { 
        testId, 
        foundInTemplates: !!testTemplates[testId],
        availableTemplates: Object.keys(testTemplates)
      });
      return NextResponse.json({ 
        error: 'Test not found or has no questions',
        details: `TestId: ${testId}, Found in templates: ${!!testTemplates[testId]}`
      }, { status: 404 });
    }

    // Calculate score
    let score = 0;
    let totalMarks = 0;
    let earnedMarks = 0;
    
    for (const question of test.questions) {
      // Only calculate scores for MCQs for now
      // In a real app, subjective answers would be manually graded
      if (question.type === 'MCQ' && question.correctAnswer !== undefined) {
        const marks = question.marks || 1; // Default 1 mark per MCQ
        totalMarks += marks;
        
        // Check if the user answered this question
        if (answers[question.id] !== undefined && answers[question.id] === question.correctAnswer) {
          earnedMarks += marks;
          score++;
        }
      }
    }
    
    // For subjective questions, we'd need manual grading
    // For now, we'll just count MCQs for the score
    const mcqQuestions = test.questions.filter(q => q.type === 'MCQ').length;
    console.log(`Scoring test: ${score} correct answers out of ${mcqQuestions} MCQs`);

    // Prevent division by zero
    const percentageScore = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

    // Save submission
    const submission: TestSubmission = {
      testId,
      userId,
      answers,
      score: percentageScore,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent || test.duration * 60, // Default to full duration if not provided
      testTitle: test.title,
      subject: test.subject
    };

    console.log(`Saving test submission for user ${userId}, test ${testId}, score ${percentageScore}%`);
    
    // Store submission in memory first (always works)
    testSubmissions.push(submission);
    
    // Store in database if available
    try {
      await safeDbOperation(async () => {
        // Import the saveTestSubmission function
        const { saveTestSubmission } = await import('@/db/mock-tests-db');
        // Save the submission to the database
        const saved = await saveTestSubmission(submission);
        if (!saved) {
          console.warn('Failed to save test submission to database, but continuing with in-memory storage');
        } else {
          console.log('Successfully saved test submission to database');
        }
        return true;
      }, false);
    } catch (dbError) {
      // Log but don't fail the submission if database storage fails
      console.error('Error storing submission in database:', dbError);
    }

    // Return results
    return NextResponse.json({
      score: percentageScore,
      correctAnswers: score,
      totalQuestions: test.questions.length,
      testId,
      title: test.title,
      subject: test.subject,
      // Include correct answers for review
      questions: test.questions.map(q => {
        if (q.type === 'MCQ') {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: answers[q.id],
            isCompulsory: q.isCompulsory,
            marks: q.marks || 1
          };
        } else {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            userAnswer: answers[q.id] || 'No answer provided',
            isCompulsory: q.isCompulsory,
            marks: q.marks || 16,
            // For subjective questions, we'd need manual grading
            // This is just a placeholder
            feedback: 'Subjective answer requires manual evaluation.'
          };
        }
      })
    });
  } catch (error) {
    console.error('Error processing test submission:', error);
    return NextResponse.json(
      { error: 'Failed to process test submission' },
      { status: 500 }
    );
  }
}