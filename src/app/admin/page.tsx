'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Question Banks Management */}
        <Link href="/admin/question-banks" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📤 Question Banks</h3>
            <p className="text-gray-600 dark:text-gray-300">Upload and manage mock test questions for different subjects.</p>
          </div>
        </Link>

        {/* Subjects Management */}
        <Link href="/admin/subjects" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📘 Subjects & Categories</h3>
            <p className="text-gray-600 dark:text-gray-300">Manage CA subjects and topics for the platform.</p>
          </div>
        </Link>

        {/* Student Management */}
        <Link href="/admin/students" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">🧑‍🎓 Student Management</h3>
            <p className="text-gray-600 dark:text-gray-300">View and manage student accounts and activities.</p>
          </div>
        </Link>

        {/* AI Q&A History */}
        <Link href="/admin/qa-history" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">🧠 AI Q&A History</h3>
            <p className="text-gray-600 dark:text-gray-300">Review frequently asked questions and improve AI responses.</p>
          </div>
        </Link>

        {/* Notifications */}
        <Link href="/admin/notifications" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📩 Notifications</h3>
            <p className="text-gray-600 dark:text-gray-300">Send reminders and announcements to students.</p>
          </div>
        </Link>

        {/* Study Materials */}
        <Link href="/admin/study-materials" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">🧪 Study Materials</h3>
            <p className="text-gray-600 dark:text-gray-300">Upload and manage study resources for students.</p>
          </div>
        </Link>

        {/* Analytics */}
        <Link href="/admin/analytics" className="group">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">📊 Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300">View platform usage statistics and student performance data.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}