'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type TestResult = {
  id: string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
  timeSpent: number; // in seconds
  questions: {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
  }[];
};

export default function TestResultPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/mock-tests/results/${resultId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Test result not found.');
          } else if (response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError('Error loading test result. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Test Result</h1>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/dashboard/mock-tests/history"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:text-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            Back to History
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : result ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-semibold mb-6">{result.title}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Score</div>
              <div className="text-3xl font-bold">{result.score}%</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Correct Answers</div>
              <div className="text-3xl font-bold">{result.correctAnswers}/{result.totalQuestions}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Subject</div>
              <div className="text-xl font-medium">{result.subject}</div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Date Completed</div>
              <div className="text-lg">{formatDate(result.completedAt)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Time Spent</div>
              <div className="text-lg">{formatTime(result.timeSpent)}</div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4">Question Review</h3>
          <div className="space-y-6 mb-8">
            {result.questions && result.questions.map((question, qIndex) => (
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
          
          <div className="flex space-x-4">
            <Link 
              href="/dashboard/mock-tests/history"
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to History
            </Link>
            <Link 
              href="/dashboard/mock-tests"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Take Another Test
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Test result not found.</p>
          <Link 
            href="/dashboard/mock-tests/history"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            Back to History
          </Link>
        </div>
      )}
    </div>
  );
}