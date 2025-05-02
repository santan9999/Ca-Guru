'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

type TestHistory = {
  id: string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  completedAt: string;
  timeSpent: number; // in seconds
};

export default function TestHistoryPage() {
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userId, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Don't fetch until auth is loaded
    if (!isLoaded) return;
    
    // Redirect if not signed in
    if (!isSignedIn) {
      router.push('/');
      return;
    }
    
    const fetchHistory = async () => {
      try {
        // Use the public API endpoint with userId parameter
        const response = await fetch(`/api/mock-tests/history/public?userId=${userId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('Test history fetch failed with status:', response.status);
          if (response.status === 401) {
            setError('Authentication required. Please sign in again.');
            router.push('/');
          } else if (response.status === 500) {
            setError('Database connection issue. Your test history will be available once the database is connected.');
          } else {
            setError('Failed to load test history. Please try again later.');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        if (data.error) {
          console.error('Error in test history data:', data.error);
          setError('Failed to load test history. Please try again later.');
        } else {
          setError(null);
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching test history:', err);
        setError('Error loading test history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isLoaded, isSignedIn, userId, router]); // Add auth state dependencies

  // Format date
  const formatDate = (dateString: string) => {
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

  // View test details
  const handleViewDetails = (testId: string) => {
    router.push(`/dashboard/mock-tests/history/${testId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Test History</h1>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/dashboard/mock-tests"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:text-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            Back to Mock Tests
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
      ) : history.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Test</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Spent</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{test.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{test.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        test.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {test.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(test.completedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTime(test.timeSpent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(test.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&apos;t taken any mock tests yet.</p>
          <Link 
            href="/dashboard/mock-tests"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            Take Your First Test
          </Link>
        </div>
      )}
    </div>
  );
}