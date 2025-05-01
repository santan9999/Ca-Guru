'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// Types for test history data
type TestQuestionResponse = {
  id: string;
  testHistoryId: string;
  questionId: string;
  userAnswer?: string;
  isCorrect: boolean;
  timeTaken?: number;
};

type TestHistoryDetail = {
  id: string;
  userId: string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  completedAt: string;
  timeSpent: number;
  questionResponses: TestQuestionResponse[];
};

export default function TestHistoryDetailPage() {
  const params = useParams();
  const testHistoryId = params.id as string;
  const { userId } = useAuth();
  
  const [testHistory, setTestHistory] = useState<TestHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestHistoryDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the public API endpoint with userId parameter
        const response = await fetch(`/api/mock-tests/history/${testHistoryId}?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('You must be logged in to view test history');
            setLoading(false);
            return;
          }
          
          if (response.status === 404) {
            setError('Test history not found');
            setLoading(false);
            return;
          }
          
          throw new Error(`Failed to fetch test history: ${response.status}`);
        }

        const data = await response.json();
        setTestHistory(data);
      } catch (err) {
        console.error('Error fetching test history detail:', err);
        setError('Failed to load test history detail. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (testHistoryId && userId) {
      fetchTestHistoryDetail();
    }
  }, [testHistoryId, userId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  // Calculate statistics
  const calculateStats = () => {
    if (!testHistory?.questionResponses) return { correct: 0, incorrect: 0, percentage: 0 };
    
    const correct = testHistory.questionResponses.filter(r => r.isCorrect).length;
    const total = testHistory.questionResponses.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return {
      correct,
      incorrect: total - correct,
      percentage
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/mock-tests/history" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (!testHistory) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Note: </strong>
          <span className="block sm:inline">No test history data found.</span>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/mock-tests/history" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/dashboard/mock-tests/history" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{testHistory.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
            <p className="text-xl font-semibold">{testHistory.subject}</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
            <p className="text-xl font-semibold">{testHistory.score}%</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-xl font-semibold">{formatDate(testHistory.completedAt)}</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Time Spent</p>
            <p className="text-xl font-semibold">{formatTime(testHistory.timeSpent)}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Performance Summary</h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex flex-wrap justify-between">
              <div className="mb-4 w-full md:w-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400">Correct Answers</p>
                <p className="text-xl font-semibold text-green-600">{stats.correct}</p>
              </div>
              
              <div className="mb-4 w-full md:w-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect Answers</p>
                <p className="text-xl font-semibold text-red-600">{stats.incorrect}</p>
              </div>
              
              <div className="mb-4 w-full md:w-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                <p className="text-xl font-semibold">{stats.percentage}%</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-300 rounded-full h-4 mt-4">
              <div 
                className="bg-blue-600 h-4 rounded-full" 
                style={{ width: `${testHistory.score}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {testHistory.questionResponses && testHistory.questionResponses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Question Responses</h2>
            <div className="space-y-4">
              {testHistory.questionResponses.map((response, index) => (
                <div 
                  key={response.id} 
                  className={`p-4 rounded-lg border ${response.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${response.isCorrect ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}
                    >
                      {response.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Your Answer:</span> {response.userAnswer || 'No answer provided'}
                  </p>
                  
                  {response.timeTaken && (
                    <p className="text-xs text-gray-500 mt-1">
                      Time taken: {formatTime(response.timeTaken)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}