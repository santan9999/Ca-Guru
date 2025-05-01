'use client';

import { useState, useEffect } from 'react';

type SubjectProgress = {
  subject: string;
  score: number;
  questionsAnswered: number;
  testsCompleted: number;
  lastActivity: string;
};

type WeeklyActivity = {
  date: string;
  score: number;
  questionsAnswered: number;
};

type ProgressData = {
  userId: string;
  streak: number;
  lastLoginDate: string;
  totalQuestionsAnswered: number;
  totalTestsCompleted: number;
  averageScore: number;
  subjectProgress: SubjectProgress[];
  weeklyActivity: WeeklyActivity[];
};

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/progress');
        if (!response.ok) {
          console.warn('Progress data fetch failed with status:', response.status);
        }
        const data = await response.json();
        if (data.error) {
          console.error('Error in progress data:', data.error);
          setError('Failed to load progress data. Please try again later.');
        } else {
          setError(null);
          setProgressData(data);
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError('Failed to load progress data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgressData();
  }, []);
  
  // Format date to display day name
  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  };
  
  // If still loading or error occurred
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }
  
  if (!progressData) {
    return (
      <div className="text-center py-12">
        <p>No progress data available yet. Start taking tests and answering questions to see your progress!</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Progress Tracker</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Streak</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{progressData.streak}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tests Completed</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{progressData.totalTestsCompleted}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Questions Answered</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{progressData.totalQuestionsAnswered}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Score</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{progressData.averageScore}%</span>
          </div>
        </div>
      </div>
      
      {/* Weekly Performance Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Performance Trend</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 text-sm rounded-md ${timeframe === 'weekly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 text-sm rounded-md ${timeframe === 'monthly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Monthly
            </button>
          </div>
        </div>
        
        <div className="h-64">
          {/* Weekly activity chart */}
          <div className="h-full flex items-end justify-between">
            {progressData.weeklyActivity.map((day, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <div 
                  className="w-full max-w-[40px] bg-blue-500 dark:bg-blue-600 rounded-t-md" 
                  style={{ height: `${day.score}%` }}
                ></div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDay(day.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Subject Performance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6">Subject Performance</h2>
        
        <div className="space-y-6">
          {progressData.subjectProgress.map((subject, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{subject.subject}</span>
                <span className="text-sm font-medium">{subject.score}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${subject.score}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Questions: {subject.questionsAnswered}</span>
                <span>Tests: {subject.testsCompleted}</span>
                <span>Last Activity: {new Date(subject.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}