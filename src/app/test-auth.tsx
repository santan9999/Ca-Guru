'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function TestAuth() {
  const { isLoaded, userId, sessionId } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isLoaded) {
      setDebugInfo({
        isLoaded,
        userId,
        sessionId,
        hasSession: !!sessionId,
        isSignedIn: !!userId
      });

      // Test redirect to dashboard
      if (userId) {
        console.log('User is signed in, redirecting to dashboard...');
        router.push('/dashboard');
      }
    }
  }, [isLoaded, userId, sessionId, router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      {!isLoaded && <p>Loading authentication...</p>}
      
      {isLoaded && (
        <div>
          <p className="mb-4">
            {userId 
              ? `Authenticated as user: ${userId}` 
              : 'Not authenticated'}
          </p>
          
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">Debug Information:</h2>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {userId && (
            <div className="mt-4">
              <p>You should be redirected to the dashboard automatically.</p>
              <p>If not, click the button below:</p>
              <button 
                onClick={() => router.push('/dashboard')} 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}