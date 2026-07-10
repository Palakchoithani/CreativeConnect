'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#7C5CFC]/10 blur-[120px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-md bg-[#1C2230]/60 backdrop-blur-xl border border-border/40 p-8 rounded-3xl space-y-6 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-2">
          <ArrowLeft size={14}/> Back to Sign In
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Forgot Password?</h1>
          <p className="text-xs text-muted-foreground">Enter your email and we'll dispatch a link to reset your password.</p>
        </div>

        {sent ? (
          <motion.div 
            className="p-4 bg-green-500/10 text-green-500 text-xs font-semibold rounded-xl border border-green-500/20 text-center space-y-2"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <p>Verification Link Sent!</p>
            <p className="text-[10px] text-muted-foreground font-medium">Please inspect {email} for instructions.</p>
          </motion.div>
        ) : (
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
                  className="bg-[#151922]/50 pl-10 border-border/30 text-sm focus:border-[#7C5CFC]/60"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-[#7C5CFC]/20 transition">
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
