'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Suspense, useState } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || 'your inbox';
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerified(true);
      setVerifying(false);
    }, 1500);
  };

  return (
    <motion.div 
      className="w-full max-w-md bg-[#1C2230]/60 backdrop-blur-xl border border-border/40 p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
          {verified ? <CheckCircle2 size={24}/> : <Mail size={24} />}
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          {verified ? 'Email Verified!' : 'Confirm Email Address'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {verified 
            ? 'Account activated successfully. You can now login to CreativeConnect.'
            : `We dispatched a temporary verification code to ${email}.`}
        </p>
      </div>

      {verified ? (
        <Button onClick={() => router.push('/login')} className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold h-11 rounded-xl shadow-lg transition">
          Continue to Login
        </Button>
      ) : (
        <div className="space-y-3">
          <Button onClick={handleVerify} disabled={verifying} className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold h-11 rounded-xl shadow-lg transition">
            {verifying ? 'Verifying Link...' : 'Confirm Verification Code'}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Didn't receive the email? <span className="font-semibold text-[#7C5CFC] cursor-pointer hover:underline" onClick={() => alert('Verification email resent!')}>Resend Link</span>
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#7C5CFC]/10 blur-[120px] pointer-events-none" />
      <Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">Initializing verification...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
