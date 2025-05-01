'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Subject-Wise Q&A Card */}
        <Link href="/dashboard/qa" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📚 Subject-Wise Q&A</h3>
            <p className="text-gray-600 dark:text-gray-300">Ask questions and get instant answers on any CA subject.</p>
          </div>
        </Link>

        {/* Mock Tests Card */}
        <Link href="/dashboard/mock-tests" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">🎯 Mock Tests</h3>
            <p className="text-gray-600 dark:text-gray-300">Practice with timed tests and improve your exam readiness.</p>
          </div>
        </Link>

        {/* Progress Tracker Card */}
        <Link href="/dashboard/progress" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📈 Progress Tracker</h3>
            <p className="text-gray-600 dark:text-gray-300">Monitor your performance and track your learning journey.</p>
          </div>
        </Link>

        {/* Adaptive Learning Card */}
        <Link href="/dashboard/adaptive-learning" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📊 Adaptive Learning</h3>
            <p className="text-gray-600 dark:text-gray-300">Get personalized recommendations based on your performance.</p>
          </div>
        </Link>

        {/* Voice Query Support Card */}
        <Link href="/dashboard/voice-query" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">🎤 Voice Query</h3>
            <p className="text-gray-600 dark:text-gray-300">Ask questions using your voice for a hands-free experience.</p>
          </div>
        </Link>

        {/* Study Materials Card */}
        <Link href="/dashboard/study-materials" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📝 Study Materials</h3>
            <p className="text-gray-600 dark:text-gray-300">Access curated study resources for all CA subjects.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}