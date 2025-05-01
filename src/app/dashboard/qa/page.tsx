'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const subjects = [
  { id: 'taxation', name: 'Taxation' },
  { id: 'corporate-law', name: 'Corporate Law' },
  { id: 'accounting', name: 'Accounting Standards' },
  { id: 'audit', name: 'Auditing' },
  { id: 'finance', name: 'Financial Management' },
  { id: 'costing', name: 'Cost Accounting' },
];

export default function QAPage() {
  const { user } = useUser();
  const [selectedSubject, setSelectedSubject] = useState('taxation');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [responseFormat, setResponseFormat] = useState('default');
  const [recentQuestions, setRecentQuestions] = useState<Array<{subject: string, query: string, timestamp: number}>>([]);

  // Load recent questions from localStorage on component mount
  useEffect(() => {
    const savedQuestions = localStorage.getItem('recentQuestions');
    if (savedQuestions) {
      try {
        setRecentQuestions(JSON.parse(savedQuestions));
      } catch (error) {
        console.error('Error parsing saved questions:', error);
      }
    }
  }, []);

  // Function to save a new question to recent questions
  const saveQuestion = (subject: string, questionText: string) => {
    const newQuestion = {
      subject,
      query: questionText,
      timestamp: Date.now()
    };
    
    const updatedQuestions = [newQuestion, ...recentQuestions.slice(0, 4)];
    setRecentQuestions(updatedQuestions);
    localStorage.setItem('recentQuestions', JSON.stringify(updatedQuestions));
  };

  // Function to handle clicking on a recent question
  const handleRecentQuestionClick = (questionText: string) => {
    setQuery(questionText);
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setAnswer('');
    
    // Save the question to recent questions
    saveQuestion(selectedSubject, query.trim());

    try {
      // Call the API we created
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: selectedSubject,
          query: query.trim(),
        }),
      });

      if (!response.ok) {
        // Provide a more helpful error message based on status code
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      setAnswer(data.answer || 'No answer was provided. Please try a different question.');
      // Store the format information from the response
      setResponseFormat(data.format || 'default');
    } catch (error) {
      console.error('Error getting answer:', error);
      // Provide a more user-friendly error message
      setAnswer(
        'Sorry, there was an error processing your question. ' +
        'This could be due to a connection issue or the service being temporarily unavailable. ' +
        'Please try again in a moment.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 border-b pb-4 border-gray-200 dark:border-gray-700">Subject-Wise Q&A</h1>
      
      <div className="mb-6">
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Select Subject
        </label>
        <div className="relative">
          <select
            id="subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 shadow-sm appearance-none bg-white dark:bg-gray-700 cursor-pointer pr-10"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask a question about ${subjects.find(s => s.id === selectedSubject)?.name}...`}
            className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px] dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 font-medium shadow-sm transition-colors duration-200"
          >
            {isLoading ? 'Processing...' : 'Ask'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center p-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Analyzing your question...</p>
        </div>
      )}

      {answer && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Answer</h2>
          <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-p:text-gray-600 dark:prose-p:text-gray-300">
            <MarkdownRenderer content={answer} format={responseFormat} />
          </div>
        </div>
      )}

      <div className="mt-12 border-t pt-8 border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Recent Questions</h3>
        <div className="space-y-4">
          {recentQuestions.length > 0 ? (
            recentQuestions.map((item, index) => (
              <div 
                key={index} 
                className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200 shadow-sm"
                onClick={() => handleRecentQuestionClick(item.query)}
              >
                <p className="font-medium text-gray-800 dark:text-gray-200">{item.query}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {subjects.find(s => s.id === item.subject)?.name} • {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">Your recent questions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}