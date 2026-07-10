'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#7C5CFC]/10 blur-[120px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-md bg-[#1C2230]/60 backdrop-blur-xl border border-border/40 p-8 rounded-3xl space-y-6 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Reset Password</h1>
          <p className="text-xs text-muted-foreground">Pick a secure password with at least 8 characters.</p>
        </div>

        {error && (
          <div className="p-3 bg-pink-500/10 text-pink-500 text-xs font-semibold rounded-lg border border-pink-500/20 text-center">
            {error}
          </div>
        )}

        {success ? (
          <motion.div 
            className="p-4 bg-green-500/10 text-green-500 text-xs font-semibold rounded-xl border border-green-500/20 text-center flex flex-col items-center gap-2"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><Check size={16}/></div>
            <p>Password Reset Complete!</p>
            <p className="text-[10px] text-muted-foreground font-medium">Redirecting you to sign in page...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="bg-[#151922]/50 pl-10 border-border/30 text-sm focus:border-[#7C5CFC]/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground/60" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  className="bg-[#151922]/50 pl-10 border-border/30 text-sm focus:border-[#7C5CFC]/60"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-[#7C5CFC]/20 transition">
              {loading ? 'Resetting password...' : 'Confirm Reset'}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
