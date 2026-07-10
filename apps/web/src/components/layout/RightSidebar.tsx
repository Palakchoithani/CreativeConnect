'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Users, Calendar, Briefcase } from 'lucide-react';

export default function RightSidebar() {
  const pathname = usePathname();

  // For this mock sidebar, we will just show different static panels 
  // depending on the active page, but keep it mostly static for now.

  return (
    <aside className="w-80 h-screen bg-background border-l border-border hidden lg:flex flex-col sticky top-0 py-6 px-4 overflow-y-auto custom-scrollbar">
      
      {pathname === '/jobs' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase size={16} /> Featured Companies
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className="w-10 h-10 rounded bg-secondary animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Design Co.</p>
                    <p className="text-xs text-muted-foreground">3 Open Roles</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Trending Creators
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-secondary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Alex Designer</p>
                    <p className="text-xs text-muted-foreground truncate">UI/UX • 5k Followers</p>
                  </div>
                  <button className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={16} /> Upcoming Events
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-primary font-bold mb-1">TOMORROW • 2:00 PM</p>
                <p className="text-sm font-medium text-foreground">Figma Auto Layout Masterclass</p>
                <div className="flex -space-x-2 mt-3">
                  <div className="w-6 h-6 rounded-full bg-secondary border border-card" />
                  <div className="w-6 h-6 rounded-full bg-secondary border border-card" />
                  <div className="w-6 h-6 rounded-full bg-secondary border border-card" />
                  <div className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-[10px] text-muted-foreground">
                    +12
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-auto pt-6 text-xs text-muted-foreground/60 text-center">
        <p>© 2026 CreativeConnect</p>
        <div className="flex justify-center gap-2 mt-2">
          <Link href="#" className="hover:text-muted-foreground">Privacy</Link>
          <Link href="#" className="hover:text-muted-foreground">Terms</Link>
          <Link href="#" className="hover:text-muted-foreground">Help</Link>
        </div>
      </div>
    </aside>
  );
}
