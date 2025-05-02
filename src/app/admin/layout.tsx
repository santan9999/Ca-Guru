import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

// Define a type for the session claims
interface SessionClaims {
  metadata?: {
    role?: string;
  };
}

// Function to check if the user has the admin role based on Clerk session claims
const checkAdminRole = (sessionClaims: SessionClaims | null) => {
  return sessionClaims?.metadata?.role === 'admin';
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    redirect('/');
  }

  if (!checkAdminRole(sessionClaims)) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}