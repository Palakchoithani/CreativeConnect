'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, Image as ImageIcon, Briefcase, 
  Users, Calendar, GraduationCap,
  MessageSquare, Bell, Bookmark, Settings, User, Globe, LayoutDashboard, LogOut
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Feed', path: '/feed', icon: ImageIcon },
  { name: 'Discover', path: '/search', icon: Users },
  { name: 'Community', path: '/community', icon: Globe },
  { name: 'Portfolio', path: '/portfolio', icon: ImageIcon },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Collaborations', path: '/projects', icon: Users },
  { name: 'Mentorship', path: '/mentorship', icon: GraduationCap },
  { name: 'Messages', path: '/messages', icon: MessageSquare },
  { name: 'Events', path: '/community/events', icon: Calendar },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen flex flex-col bg-sidebar text-sidebar-foreground hidden md:flex sticky top-0 border-r border-sidebar-border shadow-sm">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-sm">
            C
          </div>
          <span className="font-extrabold text-lg text-sidebar-foreground tracking-wider">Creatives Connect</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-2 custom-scrollbar">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} className="block">
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer
                    ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground font-semibold'}`}
                >
                  <item.icon size={18} className={isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {isAuthenticated && (
        <div className="p-4 mt-auto border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden border border-sidebar-border shrink-0">
              <User size={18} className="text-sidebar-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold tracking-wider">{user?.role}</p>
            </div>
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="sm" className="w-full text-xs justify-start gap-2 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground" onClick={logout}>
            <LogOut size={14}/> Log Out
          </Button>
        </div>
      )}
      {!isAuthenticated && (
        <div className="p-4 mt-auto border-t border-sidebar-border">
          <Link href="/login" className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition text-xs font-bold shadow-sm">
            Log In
          </Link>
        </div>
      )}
    </aside>
  );
}
