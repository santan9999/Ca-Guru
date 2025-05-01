'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClerkUserButton } from '@/components/auth/ClerkClientComponents';

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: '📊' },
    { title: 'Subject Q&A', href: '/dashboard/qa', icon: '📚' },
    { title: 'Mock Tests', href: '/dashboard/mock-tests', icon: '🎯' },
    { title: 'Progress', href: '/dashboard/progress', icon: '📈' },
    { title: 'Adaptive Learning', href: '/dashboard/adaptive-learning', icon: '🧠' },
    { title: 'Voice Query', href: '/dashboard/voice-query', icon: '🎤' },
    { title: 'Study Materials', href: '/dashboard/study-materials', icon: '📝' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          
          {/* Logo - visible on mobile */}
          <Link href="/dashboard" className="md:hidden ml-2 text-xl font-bold">
            CA Guru AI
          </Link>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <ClerkUserButton />
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}