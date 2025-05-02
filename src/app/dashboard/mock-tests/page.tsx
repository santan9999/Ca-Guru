'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type MockTest = {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

type Question = {
  id: string;
  text: string;
  options: string[];
};

type TestWithQuestions = MockTest & {
  questions: Question[];
};

type TestResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  testId: string;
  title: string;
  subject: string;
  questions: (Question & {
    correctAnswer: number;
    userAnswer: number;
  })[];
};

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<TestWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const questionsPerPage = 10;

  // Fetch available tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/mock-tests');
        if (!response.ok) {
          // Provide more specific error messages based on status code
          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setTests(data);
        } else {
          // Handle empty data case
          setError('No mock tests are currently available. Please check back later.');
        }
      } catch (err) {
        setError('Error loading tests. This could be due to a connection issue or the service being temporarily unavailable. Please try again in a moment.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Submit test - use useCallback to prevent reference changes between renders
  const handleSubmitTest = useCallback(async () => {
    if (!activeTest) return;
    
    try {
      setLoading(true);
      
      // Calculate time spent
      const timeSpent = startTime ? 
        Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 
        activeTest.duration * 60;
      
      const response = await fetch('/api/mock-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: activeTest.id,
          answers,
          timeSpent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Submission error:', errorData);
        throw new Error(`Failed to submit test: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setTestResult(result);
      setActiveTest(null);
      setCurrentPage(1); // Reset pagination when test is completed
      
      // Update progress
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity: {
              type: 'test_completed',
              subject: activeTest.subject,
              score: result.score,
              questionsAnswered: result.totalQuestions
            }
          }),
        });
      } catch (progressErr) {
        // Don't fail the whole submission if progress update fails
        console.error('Error updating progress:', progressErr);
      }
      
    } catch (err) {
      setError(`Error submitting test: ${err instanceof Error ? err.message : 'Please try again.'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTest, startTime, answers, setLoading, setTestResult, setActiveTest, setCurrentPage, setError]);

  // Timer for active test
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activeTest && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeTest) {
      // Auto-submit when time runs out
      handleSubmitTest();
    }

    return () => clearInterval(timer);
  }, [activeTest, timeLeft, handleSubmitTest]);

  // Start a test
  const handleStartTest = async (templateId: string) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Request a new test to be generated from the template
      const response = await fetch(`/api/mock-tests?templateId=${templateId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = 'Failed to generate test';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `Error: ${errorData.error}`;
            console.error('Server error details:', errorData);
          }
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = `Error: ${response.status} ${response.statusText}`;
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const test = await response.json();
      
      // Verify that the test has questions
      if (!test || !test.questions) {
        throw new Error('The test response format is invalid. Please try again.');
      }
      
      if (test.questions.length === 0) {
        throw new Error('The generated test has no questions. Please try again.');
      }
      
      // Log detailed information for debugging
      console.log(`Test loaded successfully: ${test.id}`, {
        title: test.title,
        subject: test.subject,
        questionCount: test.questions.length,
        firstQuestion: test.questions[0] ? {
          id: test.questions[0].id,
          hasOptions: !!test.questions[0].options,
          optionsCount: test.questions[0].options?.length || 0
        } : 'No questions'
      });
      
      // Success - set the active test
      setActiveTest(test);
      setTimeLeft(test.duration * 60); // Convert minutes to seconds
      setAnswers({});
      setStartTime(new Date());
    } catch (err) {
      // More informative error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Test generation error:', err);
      setError(`Error loading test: ${errorMessage}. Please try again or select a different test.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset test and results
  const handleBackToTests = () => {
    setActiveTest(null);
    setTestResult(null);
    setAnswers({});
    setCurrentPage(1); // Reset pagination when going back to test list
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (activeTest && currentPage < Math.ceil(activeTest.questions.length / questionsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Get current questions for pagination
  const getCurrentQuestions = () => {
    if (!activeTest) return [];
    
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    return activeTest.questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  };
  
  // Filter tests based on selected filters
  const filteredTests = tests.filter((test) => {
    const subjectMatch = selectedSubject === 'all' || test.subject === selectedSubject;
    const difficultyMatch = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
    return subjectMatch && difficultyMatch;
  });

  // Get unique subjects for filter dropdown
  const subjects = Array.from(new Set(tests.map((test) => test.subject)));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Mock Tests</h1>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/dashboard/mock-tests/history"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:text-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            View Test History
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading && !activeTest && !testResult && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Filters - Only show when viewing test list */}
      {!loading && !activeTest && !testResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="subject-filter" className="block text-sm font-medium mb-2">
              Filter by Subject
            </label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="difficulty-filter" className="block text-sm font-medium mb-2">
              Filter by Difficulty
            </label>
            <select
              id="difficulty-filter"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Test List */}
      {!loading && !activeTest && !testResult && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <div key={test.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{test.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    test.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {test.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-1">{test.subject}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="mr-3">{test.duration} mins</span>
                  <span>{test.questionCount} questions</span>
                </div>
                <button
                  onClick={() => handleStartTest(test.id)}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                >
                  Start Test
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No tests match your filters. Try adjusting your criteria.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Active Test */}
      {activeTest && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{activeTest.title}</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                Page {currentPage} of {Math.ceil(activeTest.questions.length / questionsPerPage)}
              </div>
              <div className="text-xl font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          
          <div className="space-y-8 mb-8">
            {getCurrentQuestions().map((question, qIndex) => {
              const globalIndex = (currentPage - 1) * questionsPerPage + qIndex;
              
              // Log question details for debugging
              console.log(`Question ${globalIndex + 1}:`, {
                id: question.id,
                text: question.text, 
                hasOptions: !!question.options,
                optionsCount: question.options?.length || 0
              });
              
              return (
                <div key={question.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="font-medium mb-4">
                    {globalIndex + 1}. {question.text}
                  </div>
                  {question.options && question.options.length > 0 ? (
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div 
                          key={oIndex}
                          onClick={() => handleAnswerSelect(question.id, oIndex)}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${answers[question.id] === oIndex
                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          {option || `Option ${oIndex + 1}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700">
                      <textarea 
                        className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter your answer here..."
                      ></textarea>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'}`}
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPage} of {Math.ceil(activeTest.questions.length / questionsPerPage)}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage >= Math.ceil(activeTest.questions.length / questionsPerPage)}
                className={`px-3 py-1 rounded-md ${currentPage >= Math.ceil(activeTest.questions.length / questionsPerPage) 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'}`}
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handleBackToTests}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel Test
            </button>
            <button
              onClick={() => {
                if (activeTest) {
                  handleSubmitTest();
                }
              }}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      )}
      
      {/* Test Results */}
      {testResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-semibold mb-6">Test Results</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Score</div>
              <div className="text-3xl font-bold">{testResult.score}%</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Correct Answers</div>
              <div className="text-3xl font-bold">{testResult.correctAnswers}/{testResult.totalQuestions}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Subject</div>
              <div className="text-xl font-medium">{testResult.subject}</div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4">Review Questions</h3>
          <div className="space-y-6 mb-8">
            {testResult.questions.map((question, qIndex) => (
              <div 
                key={question.id} 
                className={`p-4 border rounded-lg ${question.options && question.userAnswer === question.correctAnswer
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30'
                  : question.options ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30' : 'bg-gray-50 border-gray-200 dark:bg-gray-800/10 dark:border-gray-700/30'
                }`}
              >
                <div className="font-medium mb-3">
                  {qIndex + 1}. {question.text}
                </div>
                {question.options ? (
                  <div className="space-y-2 mb-3">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`p-3 border rounded-md ${(() => {
                          if (oIndex === question.correctAnswer) {
                            return 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800/50';
                          } else if (oIndex === question.userAnswer && oIndex !== question.correctAnswer) {
                            return 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800/50';
                          } else {
                            return 'border-gray-200 dark:border-gray-700';
                          }
                        })()}`}
                      >
                        {option}
                        {oIndex === question.correctAnswer && (
                          <span className="ml-2 text-green-600 dark:text-green-400">✓ Correct</span>
                        )}
                        {oIndex === question.userAnswer && oIndex !== question.correctAnswer && (
                          <span className="ml-2 text-red-600 dark:text-red-400">✗ Your answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700 mb-3">
                    <p className="text-gray-500 dark:text-gray-400 italic">Subjective question - requires manual grading</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleBackToTests}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Back to Tests
          </button>
        </div>
      )}
    </div>
  );
}