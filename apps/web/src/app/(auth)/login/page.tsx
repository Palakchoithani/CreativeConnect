'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated, user: authUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, authUser, router]);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const refreshTokenParam = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
    } else if (tokenParam && refreshTokenParam) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${tokenParam}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          // Commit session state; the other useEffect will handle redirection once React state updates!
          login(tokenParam, refreshTokenParam, data.user);
        } else {
          setError('Invalid token payload');
        }
      })
      .catch(() => {
        setError('Failed to fetch user data after OAuth login');
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [searchParams, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      
      // Only update context state. The redirection useEffect handles routing to prevent race conditions.
      login(data.token, data.refreshToken, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border p-8 rounded-3xl space-y-6 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-primary items-center justify-center font-black text-primary-foreground text-lg mb-2 shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-xs text-muted-foreground">Sign in to resume building your creator portfolio.</p>
        </div>

        {error && (
          <motion.div 
            className="p-3 bg-pink-500/10 text-pink-500 text-xs font-semibold rounded-lg border border-pink-500/20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-[10px] font-semibold text-primary hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
              <Input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="bg-background/50 pl-10 pr-10 border-border/50 text-sm focus:border-primary"
              />
              <button 
                type="button"
                className="absolute right-3 top-3.5 text-muted-foreground/60 hover:text-foreground transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-border bg-background checked:bg-primary"
              />
              Remember Me
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-lg shadow-primary/20 transition">
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border/30"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Continue With</span>
          <div className="flex-grow border-t border-border/30"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="bg-background/40 border-border text-xs font-bold gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/oauth/google`}>
            Google
          </Button>
          <Button variant="outline" className="bg-background/40 border-border text-xs font-bold gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/oauth/github`}>
            GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
