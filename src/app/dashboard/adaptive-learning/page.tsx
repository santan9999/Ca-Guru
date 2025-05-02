'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

// Types for user progress data
type SubjectProgress = {
  subject: string;
  score: number;
  questionsAnswered: number;
  testsCompleted: number;
  lastActivity: string;
};

type UserProgress = {
  userId: string;
  streak: number;
  lastLoginDate: string;
  totalQuestionsAnswered: number;
  totalTestsCompleted: number;
  averageScore: number;
  subjectProgress: SubjectProgress[];
  weeklyActivity: {
    date: string;
    score: number;
    questionsAnswered: number;
  }[];
};

// Types for weak areas and recommended topics
type WeakArea = {
  id: string;
  subject: string;
  topic: string;
  accuracy: number;
  recommendedResources: {
    id: string;
    title: string;
    type: string;
  }[];
};

type RecommendedTopic = {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  relevance: string;
};

// Define an interface for resource items
interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url?: string;
  description?: string;
}

// Resource mapping for common topics
const resourceMapping: Record<string, ResourceItem[]> = {
  'Capital Gains': [
    { id: 'res-1', title: 'Capital Gains Fundamentals', type: 'Article' },
    { id: 'res-2', title: 'Calculating Capital Gains Tax', type: 'Video' },
    { id: 'res-3', title: 'Capital Gains Practice Questions', type: 'Quiz' },
  ],
  'Board Meetings & Procedures': [
    { id: 'res-4', title: 'Board Meeting Requirements', type: 'Article' },
    { id: 'res-5', title: 'Corporate Governance Case Studies', type: 'PDF' },
  ],
  'Ind AS 116 - Leases': [
    { id: 'res-6', title: 'Ind AS 116 Explained', type: 'Video' },
    { id: 'res-7', title: 'Lease Accounting Practice Problems', type: 'Quiz' },
  ],
  'Tax Audit Provisions': [
    { id: 'res-8', title: 'Tax Audit Provisions Overview', type: 'Article' },
    { id: 'res-9', title: 'Tax Audit Case Studies', type: 'PDF' },
  ],
  'Audit Sampling Techniques': [
    { id: 'res-10', title: 'Audit Sampling Methods', type: 'Article' },
    { id: 'res-11', title: 'Practical Audit Sampling', type: 'Video' },
  ],
  'Working Capital Management': [
    { id: 'res-12', title: 'Working Capital Fundamentals', type: 'Article' },
    { id: 'res-13', title: 'Working Capital Optimization', type: 'Video' },
  ],
};

// Default resources for subjects without specific topic mapping
const defaultResources = [
  { id: 'default-1', title: 'Comprehensive Study Guide', type: 'PDF' },
  { id: 'default-2', title: 'Practice Questions', type: 'Quiz' },
];

export default function AdaptiveLearningPage() {
  const [activeTab, setActiveTab] = useState<'weak-areas' | 'recommended'>('weak-areas');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<RecommendedTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { userId } = useAuth();
  
  // Fetch user progress data
  useEffect(() => {
    async function fetchUserProgress() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/progress');
        
        if (!response.ok) {
          // Handle different error status codes
          if (response.status === 401) {
            setError('Authentication required. Please sign in again.');
            return;
          } else if (response.status === 500) {
            setError('Database connection issue. Your learning data will be available once the database is connected.');
            return;
          }
          throw new Error('Failed to fetch progress data');
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setUserProgress(data);
        
        // Generate weak areas based on subject progress
        generateWeakAreas(data.subjectProgress);
        
        // Generate recommended topics based on user progress
        generateRecommendedTopics(data);
        
      } catch (err) {
        console.error('Error fetching user progress:', err);
        setError('Failed to load your learning data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProgress();
  }, [userId]);
  
  // Generate weak areas from subject progress
  const generateWeakAreas = (subjectProgress: SubjectProgress[]) => {
    // Sort by score ascending to find weakest areas
    const sortedSubjects = [...subjectProgress].sort((a, b) => a.score - b.score);
    
    // Take the 3 weakest subjects with at least some activity
    const weakSubjects = sortedSubjects
      .filter(subject => subject.questionsAnswered > 0)
      .slice(0, 3);
    
    // Map to weak areas format
    const areas = weakSubjects.map((subject, index) => {
      // Generate a topic based on the subject
      let topic = '';
      
      // Map subjects to common topics
      switch(subject.subject) {
        case 'Taxation':
          topic = 'Capital Gains';
          break;
        case 'Corporate Law':
          topic = 'Board Meetings & Procedures';
          break;
        case 'Accounting Standards':
          topic = 'Ind AS 116 - Leases';
          break;
        case 'Auditing':
          topic = 'Audit Sampling Techniques';
          break;
        case 'Financial Management':
          topic = 'Working Capital Management';
          break;
        default:
          topic = `${subject.subject} Fundamentals`;
      }
      
      // Get recommended resources for this topic
      const resources = resourceMapping[topic] || defaultResources;
      
      return {
        id: `wa-${index + 1}`,
        subject: subject.subject,
        topic,
        accuracy: subject.score,
        recommendedResources: resources,
      };
    });
    
    setWeakAreas(areas);
  };
  
  // Generate recommended topics based on user progress
  const generateRecommendedTopics = (progress: UserProgress) => {
    // Get subjects that are not in weak areas but have some activity
    const weakSubjects = new Set(progress.subjectProgress
      .filter(s => s.score < 70 && s.questionsAnswered > 0)
      .map(s => s.subject));
    
    // Find subjects with higher scores or less activity
    const otherSubjects = progress.subjectProgress
      .filter(s => !weakSubjects.has(s.subject) || s.questionsAnswered === 0)
      .sort((a, b) => b.score - a.score);
    
    // Generate recommended topics
    const topics = otherSubjects.slice(0, 3).map((subject, index) => {
      // Generate a topic based on the subject
      let topic = '';
      let difficulty = 'Medium';
      const relevance = 'High';
      
      // Determine difficulty based on user's overall performance
      if (progress.averageScore > 70) {
        difficulty = 'Hard';
      } else if (progress.averageScore < 50) {
        difficulty = 'Easy';
      }
      
      // Map subjects to recommended topics
      switch(subject.subject) {
        case 'Taxation':
          topic = 'Tax Audit Provisions';
          break;
        case 'Auditing':
          topic = 'Audit Sampling Techniques';
          break;
        case 'Financial Management':
          topic = 'Working Capital Management';
          break;
        case 'Corporate Law':
          topic = 'Corporate Restructuring';
          break;
        case 'Accounting Standards':
          topic = 'Consolidated Financial Statements';
          break;
        default:
          topic = `Advanced ${subject.subject}`;
      }
      
      return {
        id: `rt-${index + 1}`,
        subject: subject.subject,
        topic,
        difficulty,
        relevance,
      };
    });
    
    setRecommendedTopics(topics);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Adaptive Learning</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('weak-areas')}
          className={`py-3 px-4 text-sm font-medium ${activeTab === 'weak-areas' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          Weak Areas
        </button>
        <button
          onClick={() => setActiveTab('recommended')}
          className={`py-3 px-4 text-sm font-medium ${activeTab === 'recommended' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          Recommended Topics
        </button>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* No Data State */}
      {!isLoading && !error && userProgress && userProgress.totalQuestionsAnswered === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6">
          <p className="font-medium">Welcome to Adaptive Learning!</p>
          <p className="mt-2">Complete some tests or practice questions to get personalized recommendations based on your performance.</p>
        </div>
      )}
      
      {/* Weak Areas Content */}
      {!isLoading && !error && activeTab === 'weak-areas' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Based on your test performance, we&apos;ve identified these areas where you could improve:
          </p>
          
          {weakAreas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300">
                No weak areas identified yet. Complete more tests and practice questions to get personalized recommendations.
              </p>
            </div>
          ) : (
            weakAreas.map((area) => (
              <div key={area.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{area.topic}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{area.subject}</p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Accuracy:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      area.accuracy < 50 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      area.accuracy < 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {area.accuracy}%
                    </span>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recommended Resources:</h4>
                <ul className="space-y-2">
                  {area.recommendedResources.map((resource) => (
                    <li key={resource.id} className="flex items-center">
                      <span className="mr-2">
                        {resource.type === 'Article' && '📄'}
                        {resource.type === 'Video' && '🎥'}
                        {resource.type === 'Quiz' && '❓'}
                        {resource.type === 'PDF' && '📑'}
                      </span>
                      <Link 
                        href={`/dashboard/study-materials/${resource.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {resource.title}
                      </Link>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-300">
                        {resource.type}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4">
                  <Link 
                    href={`/dashboard/qa?subject=${area.subject.toLowerCase()}&topic=${area.topic.toLowerCase()}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Practice this topic with AI Q&amp;A →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Recommended Topics Content */}
      {!isLoading && !error && activeTab === 'recommended' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Based on your learning patterns and upcoming exams, we recommend these topics:
          </p>
          
          {recommendedTopics.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300">
                No recommended topics yet. Complete more tests and practice questions to get personalized recommendations.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedTopics.map((topic) => (
                <div key={topic.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-1">{topic.topic}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">{topic.subject}</p>
                  
                  <div className="flex space-x-2 mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      topic.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      topic.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {topic.difficulty}
                    </span>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      topic.relevance === 'High' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      topic.relevance === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {topic.relevance} Relevance
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      href={`/dashboard/qa?subject=${topic.subject.toLowerCase()}&topic=${topic.topic.toLowerCase()}`}
                      className="flex-1 text-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                    >
                      Study with AI
                    </Link>
                    <Link 
                      href={`/dashboard/study-materials?subject=${topic.subject.toLowerCase()}&topic=${topic.topic.toLowerCase()}`}
                      className="flex-1 text-center px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:ring-4 focus:ring-gray-100 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Find Resources
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}