'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { Shield } from 'lucide-react';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isAuthPage) {
        // Allow home page to be public if needed, but the current logic forces login for non-auth pages.
        // We will keep the default protection but let's allow '/' to be visited!
        if (pathname !== '/') {
          router.push('/login');
        }
      } else if (isAuthenticated && isAuthPage) {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, pathname, isAuthPage]);

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-pulse">Syncing Session...</p>
      </div>
    );
  }

  // Auth pages (login, register, etc) - no sidebars, full screen
  if (!isAuthenticated && isAuthPage) {
    return <div className="min-h-screen w-screen bg-background overflow-y-auto">{children}</div>;
  }

  // If not authenticated and trying to access a protected page (excluding home page), show nothing while redirecting
  if (!isAuthenticated && !isAuthPage && pathname !== '/') {
    return null;
  }
  
  // If not authenticated and on home page, render full screen without sidebars
  if (!isAuthenticated && pathname === '/') {
    return <div className="min-h-screen w-screen bg-background overflow-y-auto">{children}</div>;
  }

  // Authenticated Protected App Layout
  return (
    <div className="min-h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-primary-foreground text-base">C</div>
          <span className="text-lg font-extrabold tracking-wider text-foreground">CreativeConnect</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span>Server Status: <span className="text-green-500">Online</span></span>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        <LeftSidebar />
        <main className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar relative bg-background">
          <div className="max-w-6xl mx-auto w-full pb-16">
            {children}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
