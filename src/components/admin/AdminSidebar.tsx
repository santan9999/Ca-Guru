'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClerkUserButton } from '@/components/auth/ClerkClientComponents';

type NavItem = {
  title: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: '📊' },
  { title: 'Question Banks', href: '/admin/question-banks', icon: '📤' },
  { title: 'Subjects & Categories', href: '/admin/subjects', icon: '📘' },
  { title: 'Student Management', href: '/admin/students', icon: '🧑‍🎓' },
  { title: 'AI Q&A History', href: '/admin/qa-history', icon: '🧠' },
  { title: 'Notifications', href: '/admin/notifications', icon: '📩' },
  { title: 'Study Materials', href: '/admin/study-materials', icon: '🧪' },
  { title: 'Analytics', href: '/admin/analytics', icon: '📊' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold">CA Guru Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Account</div>
            <ClerkUserButton />
          </div>
          <Link 
            href="/dashboard"
            className="mt-4 flex items-center px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30 transition-colors"
          >
            <span className="mr-2">🔄</span>
            Switch to Student View
          </Link>
        </div>
      </div>
    </aside>
  );
}