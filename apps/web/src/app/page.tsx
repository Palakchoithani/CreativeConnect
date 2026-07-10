'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Compass, Briefcase, GraduationCap, Users } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          className="max-w-3xl space-y-6 relative z-10"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
            ✨ Networking Redefined for Creators
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-tight"
          >
            Where <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Creativity</span> Meets Professional Connection.
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            The premium networking ecosystem inspired by Behance, Linear, and Discord. Show off portfolios, collaborate on real-time projects, land jobs, and learn from mentors.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 pt-6">
            <Link href="/register">
              <Button size="lg" className="px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/25 rounded-xl">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 border-border hover:bg-white/5 font-semibold rounded-xl">
                Log In
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Dashboard layout for logged-in users
  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/20 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute right-10 bottom-0 top-0 w-80 bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-xl">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your creative dashboard is ready. Discover trending portfolios, apply to new jobs, or check on your active projects.
          </p>
          <div className="pt-2">
            <Link href="/feed">
              <Button className="rounded-xl shadow-md gap-2">
                Open Activity Feed <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/portfolio" className="group">
          <div className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl transition duration-300 h-full flex flex-col justify-between">
            <div className="p-3 bg-primary/10 text-primary w-fit rounded-xl mb-4 group-hover:scale-105 transition"><Compass size={24}/></div>
            <div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition">Portfolios</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Discover masterpieces, tags, and creator grids.</p>
            </div>
          </div>
        </Link>
        <Link href="/jobs" className="group">
          <div className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl transition duration-300 h-full flex flex-col justify-between">
            <div className="p-3 bg-green-500/10 text-green-500 w-fit rounded-xl mb-4 group-hover:scale-105 transition"><Briefcase size={24}/></div>
            <div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-green-500 transition">Job Portal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Find and apply to active positions and contracts.</p>
            </div>
          </div>
        </Link>
        <Link href="/projects" className="group">
          <div className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl transition duration-300 h-full flex flex-col justify-between">
            <div className="p-3 bg-blue-500/10 text-blue-500 w-fit rounded-xl mb-4 group-hover:scale-105 transition"><Users size={24}/></div>
            <div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-blue-500 transition">Collaborations</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Join ongoing projects or start a team collaboration.</p>
            </div>
          </div>
        </Link>
        <Link href="/mentorship" className="group">
          <div className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl transition duration-300 h-full flex flex-col justify-between">
            <div className="p-3 bg-purple-500/10 text-purple-500 w-fit rounded-xl mb-4 group-hover:scale-105 transition"><GraduationCap size={24}/></div>
            <div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-purple-500 transition">Mentorship</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Get guidance or request sessions from top creators.</p>
            </div>
          </div>
        </Link>
      </div>

    </motion.div>
  );
}
