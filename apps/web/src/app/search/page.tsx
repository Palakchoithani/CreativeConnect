'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Users, ImageIcon, Briefcase, Handshake, Eye, Heart, ArrowRight, UserPlus, UserMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function SearchPage() {
  const { token, user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'portfolios' | 'jobs' | 'projects'>('all');
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{
    users: any[];
    portfolios: any[];
    jobs: any[];
    projects: any[];
  }>({ users: [], portfolios: [], jobs: [], projects: [] });

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) executeSearch();
      else setResults({ users: [], portfolios: [], jobs: [], projects: [] });
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const executeSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    } catch (err) {
      showError('Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, showError]);

  const handleFollow = async (targetId: string, targetName: string) => {
    if (!isAuthenticated) { showError('Please login to follow users'); return; }
    setFollowLoading(targetId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowedIds(prev => {
          const next = new Set(prev);
          data.following ? next.add(targetId) : next.delete(targetId);
          return next;
        });
        success(data.following ? `Following ${targetName}` : `Unfollowed ${targetName}`);
      }
    } catch {
      showError('Action failed');
    } finally {
      setFollowLoading(null);
    }
  };

  const hasResults = results.users.length > 0 || results.portfolios.length > 0 || results.jobs.length > 0 || results.projects.length > 0;

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-5xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-1">Discover</h1>
        <p className="text-muted-foreground text-sm">Find creatives, portfolios, jobs, and collaborations.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search by name, tags, skills, company..."
          className="pl-12 py-6 text-base bg-input border-border focus-visible:ring-primary rounded-xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {(['all', 'users', 'portfolios', 'jobs', 'projects'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            className={`rounded-full capitalize whitespace-nowrap ${activeTab !== tab ? 'text-muted-foreground' : ''}`}
            onClick={() => setActiveTab(tab)}
            size="sm"
          >
            {tab === 'users' ? 'Creatives' : tab === 'projects' ? 'Collaborations' : tab}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(n => <div key={n} className="h-28 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : !query.trim() ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchIcon className="mx-auto w-12 h-12 mb-4 opacity-20 text-primary" />
          <p className="font-medium">Start typing to search CreativeConnect</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-medium">No results for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      ) : (
        <motion.div className="space-y-10" variants={containerVariants} initial="hidden" animate="show">

          {/* Creatives */}
          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users size={14} /> Creatives ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map(u => {
                  const isMe = u.id === user?.id;
                  const isFollowing = followedIds.has(u.id);
                  return (
                    <motion.div key={u.id} variants={itemVariants} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4 hover:border-primary/40 transition">
                      <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden flex-shrink-0 border border-border flex items-center justify-center font-bold text-foreground">
                        {u.profile?.avatarUrl
                          ? <img src={u.profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : u.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-sm">{u.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{u.profile?.bio || 'Creative Professional'}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!isMe && (
                          <Button
                            size="sm"
                            variant={isFollowing ? 'outline' : 'default'}
                            className="rounded-xl h-8 text-xs gap-1"
                            disabled={followLoading === u.id}
                            onClick={() => handleFollow(u.id, u.name)}
                          >
                            {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
                            {isFollowing ? 'Unfollow' : 'Follow'}
                          </Button>
                        )}
                        <Link href={`/profile/${u.id}`}>
                          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-primary">
                            <ArrowRight size={16} />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolios */}
          {(activeTab === 'all' || activeTab === 'portfolios') && results.portfolios.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Portfolios ({results.portfolios.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.portfolios.map(p => (
                  <motion.div key={p.id} variants={itemVariants} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                    <Link href={`/portfolio/${p.id}`}>
                      <div className="aspect-[4/3] bg-secondary overflow-hidden">
                        {p.coverImage
                          ? <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Cover</div>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-foreground text-sm truncate">{p.title}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>{p.category || 'Uncategorized'}</span>
                          <div className="flex gap-2">
                            <span className="flex items-center gap-1"><Eye size={11}/> {p.views}</span>
                            <span className="flex items-center gap-1"><Heart size={11}/> {p.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs */}
          {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={14} /> Jobs ({results.jobs.length})
              </h2>
              <div className="space-y-3">
                {results.jobs.map(j => (
                  <motion.div key={j.id} variants={itemVariants} className="bg-card p-4 rounded-2xl border border-border hover:border-primary/40 transition flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{j.title}</h3>
                      <p className="text-sm text-primary font-medium">{j.company}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
                    </div>
                    <Link href="/jobs">
                      <Button size="sm" variant="outline" className="rounded-xl shrink-0">Apply</Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Handshake size={14} /> Collaborations ({results.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.map(pr => (
                  <motion.div key={pr.id} variants={itemVariants} className="bg-card p-4 rounded-2xl border border-border hover:border-primary/40 transition">
                    <h3 className="font-semibold text-foreground text-sm">{pr.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">by {pr.owner?.name}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pr.description}</p>
                    <Link href="/projects" className="block mt-3">
                      <Button size="sm" variant="outline" className="text-xs rounded-xl w-full">View Hub</Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
