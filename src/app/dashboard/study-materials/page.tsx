'use client';

import { useState } from 'react';
import Link from 'next/link';

type StudyMaterial = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: 'PDF' | 'Video' | 'Article' | 'Practice';
  source: string;
  addedDate: string;
};

// Sample study materials data
const mockStudyMaterials: StudyMaterial[] = [
  {
    id: 'sm-1',
    title: 'Income Tax Fundamentals',
    subject: 'Taxation',
    topic: 'Income Tax',
    type: 'PDF',
    source: 'ICAI',
    addedDate: '2023-10-15',
  },
  {
    id: 'sm-2',
    title: 'GST Explained',
    subject: 'Taxation',
    topic: 'GST',
    type: 'Video',
    source: 'CA Guru',
    addedDate: '2023-11-02',
  },
  {
    id: 'sm-3',
    title: 'Companies Act 2013 Overview',
    subject: 'Corporate Law',
    topic: 'Companies Act',
    type: 'Article',
    source: 'Legal Expert',
    addedDate: '2023-09-28',
  },
  {
    id: 'sm-4',
    title: 'Ind AS 116 - Leases Explained',
    subject: 'Accounting Standards',
    topic: 'Ind AS',
    type: 'Video',
    source: 'CA Guru',
    addedDate: '2023-12-05',
  },
  {
    id: 'sm-5',
    title: 'Audit Planning and Documentation',
    subject: 'Auditing',
    topic: 'Audit Planning',
    type: 'PDF',
    source: 'ICAI',
    addedDate: '2023-10-10',
  },
  {
    id: 'sm-6',
    title: 'Cost Accounting Practice Problems',
    subject: 'Cost Accounting',
    topic: 'Cost Allocation',
    type: 'Practice',
    source: 'CA Guru',
    addedDate: '2023-11-20',
  },
];

// Get unique subjects and types for filters
const subjects = Array.from(new Set(mockStudyMaterials.map(material => material.subject)));
const materialTypes = Array.from(new Set(mockStudyMaterials.map(material => material.type)));

export default function StudyMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter materials based on search and filters
  const filteredMaterials = mockStudyMaterials.filter((material) => {
    const matchesSearch = 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesType = selectedType === 'all' || material.type === selectedType;
    
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium mb-2">
            Search Materials
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="type-filter" className="block text-sm font-medium mb-2">
              Filter by Type
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Types</option>
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Materials List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{material.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  material.type === 'PDF' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  material.type === 'Video' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  material.type === 'Article' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {material.type}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">{material.subject} - {material.topic}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Source: {material.source}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Added: {new Date(material.addedDate).toLocaleDateString()}
                </span>
                <Link 
                  href={`/dashboard/study-materials/${material.id}`}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                >
                  View Material
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No study materials match your search criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}