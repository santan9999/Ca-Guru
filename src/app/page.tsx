import Link from "next/link";
import { ClerkSignedIn, ClerkSignedOut } from '../components/auth/ClerkClientComponents';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-4xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">CA Guru AI</h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Your AI-powered assistant for Chartered Accountancy exam preparation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <ClerkSignedIn>
              <Link 
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors text-lg font-medium"
              >
                Go to Dashboard
              </Link>
            </ClerkSignedIn>
            
            <ClerkSignedOut>
              <Link 
                href="/sign-up"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors text-lg font-medium"
              >
                Get Started
              </Link>
              <Link 
                href="/sign-in"
                className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:ring-4 focus:ring-blue-100 transition-colors text-lg font-medium ml-4"
              >
                Sign In
              </Link>
            </ClerkSignedOut>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Subject-Wise Q&A</h3>
            <p className="text-gray-600 dark:text-gray-300">Get instant answers to your questions on any CA subject.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Mock Tests</h3>
            <p className="text-gray-600 dark:text-gray-300">Practice with timed tests to improve your exam readiness.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">Voice Query</h3>
            <p className="text-gray-600 dark:text-gray-300">Ask questions using your voice for a hands-free experience.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} CA Guru AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
