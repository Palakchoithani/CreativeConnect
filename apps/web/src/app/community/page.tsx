'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe, MessageSquare, Award, Calendar, Star, Users, ArrowRight, Heart } from 'lucide-react';

export default function CommunityDashboard() {
  const [leaderboard, setLeaderboard] = useState<any>({ creatives: [], projects: [], portfolios: [] });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ldRes, chRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/leaderboard`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/challenges`)
      ]);
      if (ldRes.ok) setLeaderboard(await ldRes.json());
      if (chRes.ok) setChallenges(await chRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Community Space</h1>
        <p className="text-muted-foreground">Collaborate with peers, ask questions, join events, and participate in challenges.</p>
      </div>

      {/* Main Hub Tabs/Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'Groups', href: '/community/groups', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
          { name: 'Discussions', href: '/community/discussions', icon: MessageSquare, color: 'text-green-500 bg-green-500/10' },
          { name: 'Challenges', href: '/community/challenges', icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
          { name: 'Workshops', href: '/community/events', icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
          { name: 'Reviews', href: '/community/portfolio-reviews', icon: Star, color: 'text-pink-500 bg-pink-500/10' },
        ].map((hub) => (
          <Link key={hub.name} href={hub.href}>
            <div className="bg-card hover:bg-card/85 p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center cursor-pointer transition group">
              <div className={`p-4 rounded-full mb-3 ${hub.color} group-hover:scale-105 transition`}>
                <hub.icon size={24} />
              </div>
              <span className="font-semibold text-foreground text-sm">{hub.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Leaderboard and Trending widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Creatives Leaderboard */}
        <div className="bg-card p-6 rounded-2xl border border-border lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="text-yellow-500" /> Community Leaderboard
            </h2>
            <span className="text-xs text-muted-foreground">Updated live</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-secondary/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : leaderboard.creatives.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No leaderboard rankings available yet.</p>
          ) : (
            <motion.div 
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {leaderboard.creatives.map((creative: any, idx: number) => (
                <motion.div 
                  key={creative.id}
                  variants={itemVariants}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30 hover:border-primary/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-muted-foreground text-sm text-center">#{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      {creative.avatarUrl && <img src={creative.avatarUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-semibold text-foreground text-sm">{creative.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart size={14} className="text-pink-500" /> {creative.likesCount}</span>
                    <span>{creative.projectsCount} Projects</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Active Challenges Widget */}
        <div className="bg-card p-6 rounded-2xl border border-border space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Featured Challenges</h2>
            <p className="text-xs text-muted-foreground mt-1">Submit entries & win creator badges</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No active challenges currently.</p>
          ) : (
            <div className="space-y-4">
              {challenges.slice(0, 3).map(ch => (
                <div key={ch.id} className="p-4 bg-secondary/30 rounded-xl border border-border/40 space-y-2">
                  <h3 className="font-bold text-foreground text-sm">{ch.theme}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ch.description}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold">
                      {ch.rewards}
                    </span>
                    <Link href="/community/challenges">
                      <Button variant="ghost" size="sm" className="text-xs p-0 h-auto gap-1 text-primary hover:text-primary/80">
                        Join Challenge <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
