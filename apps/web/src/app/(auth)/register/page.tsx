'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { User, Mail, Lock, UserCheck } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CREATIVE'); // CREATIVE, RECRUITER, MENTOR
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { login, isAuthenticated, user: authUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, authUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!acceptTerms) {
      return setError('You must accept the Terms and Privacy Policy');
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      // Navigate to email verification screen on success
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      {/* Background blur blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-lg bg-card/60 backdrop-blur-xl border border-border p-8 rounded-3xl space-y-6 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-primary items-center justify-center font-black text-primary-foreground text-lg mb-2 shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create Creator Account</h1>
          <p className="text-xs text-muted-foreground">Join CreativeConnect to host portfolios & discover jobs.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="John Doe"
                  className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserCheck size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  placeholder="johndoe"
                  className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  className="bg-background/50 pl-10 border-border/50 text-sm focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Role</label>
            <select 
              className="w-full rounded-xl border border-border/50 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="CREATIVE">Creative (Portfolio, Apply Jobs, Collaborations)</option>
              <option value="RECRUITER">Recruiter (Post Jobs, Hire Talent, Company Profile)</option>
              <option value="MENTOR">Mentor (Review portfolios, Host workshops)</option>
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground select-none">
              <input 
                type="checkbox" 
                checked={acceptTerms} 
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-border bg-background checked:bg-primary"
              />
              <span>I accept the <Link href="#" className="font-semibold hover:underline text-primary">Terms of Service</Link> and <Link href="#" className="font-semibold hover:underline text-primary">Privacy Policy</Link></span>
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-lg shadow-primary/20 transition">
            {loading ? 'Registering...' : 'Sign Up'}
          </Button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border/50"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Continue With</span>
          <div className="flex-grow border-t border-border/50"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="bg-background/40 border-border text-xs font-bold gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/oauth/google`}>
            Google
          </Button>
          <Button type="button" variant="outline" className="bg-background/40 border-border text-xs font-bold gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/oauth/github`}>
            GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
