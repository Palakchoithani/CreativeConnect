'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { GraduationCap, Star, CheckCircle2, XCircle, Sparkles, User, Send } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function MentorshipPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState<any[]>([]);
  const [myMentorships, setMyMentorships] = useState<any>({ mentoring: [], mentoredBy: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [goals, setGoals] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated, router, token]);

  const fetchData = async () => {
    try {
      const [mentorsRes, myRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/mentorship/mentors`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/mentorship/my`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (mentorsRes.ok) setMentors(await mentorsRes.json());
      if (myRes.ok) setMyMentorships(await myRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/mentorship/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mentorId: selectedMentor.id, goals })
      });
      if (res.ok) {
        setSelectedMentor(null); setGoals('');
        setSuccessMsg(`Request sent to ${selectedMentor.name}!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send request');
      }
    } catch (err) { console.error(err); } finally { setSending(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/mentorship/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  if (!isAuthenticated) return null;

  const hasMentorships = myMentorships.mentoring.length > 0 || myMentorships.mentoredBy.length > 0;

  return (
    <motion.div
      className="p-6 md:p-10 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> {successMsg}
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <GraduationCap className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Mentorship</h1>
        </div>
        <p className="text-muted-foreground ml-1">Learn from seasoned creators. Grow your creative career.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-10">

          {/* Active Mentorships */}
          {hasMentorships && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Your Mentorships</h2>
              <div className="space-y-3">
                {myMentorships.mentoredBy.map((m: any) => (
                  <div key={m.id} className="bg-card p-5 rounded-2xl border border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Learning From</p>
                        <p className="font-bold text-foreground">{m.mentor.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${STATUS_STYLE[m.status] || 'bg-secondary text-secondary-foreground border-border'}`}>{m.status}</span>
                  </div>
                ))}
                {myMentorships.mentoring.map((m: any) => (
                  <div key={m.id} className="bg-card p-5 rounded-2xl border border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                        <Star className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Mentoring</p>
                        <p className="font-bold text-foreground">{m.mentee.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${STATUS_STYLE[m.status] || 'bg-secondary text-secondary-foreground border-border'}`}>{m.status}</span>
                      {m.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button id={`accept-${m.id}`} onClick={() => handleUpdateStatus(m.id, 'ACTIVE')} size="sm" className="rounded-xl h-8 bg-cyan-500 hover:bg-cyan-600 text-black border-0">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-black" /> Accept
                          </Button>
                          <Button onClick={() => handleUpdateStatus(m.id, 'REJECTED')} size="sm" className="rounded-xl h-8 bg-cyan-500 hover:bg-cyan-600 text-black border-0">
                            <XCircle className="w-3.5 h-3.5 mr-1 text-black" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Find a Mentor */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Find a Mentor</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-48 bg-card rounded-2xl animate-pulse border border-border" />)}
              </div>
            ) : mentors.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">No mentors available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentors.map(mentor => {
                  const isSelected = selectedMentor?.id === mentor.id;
                  return (
                    <div
                      key={mentor.id}
                      className={`group bg-card p-6 rounded-2xl border transition-all duration-200 flex flex-col items-center text-center cursor-pointer
                        ${isSelected ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10' : 'border-border hover:border-amber-500/30 hover:shadow-md'}`}
                      onClick={() => setSelectedMentor(isSelected ? null : mentor)}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary mb-4 border-2 border-border group-hover:border-amber-500/30 transition-colors">
                        {mentor.profile?.avatarUrl ? (
                          <img src={mentor.profile.avatarUrl} alt={mentor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl">
                            {mentor.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4 line-clamp-2 leading-relaxed">{mentor.profile?.bio || 'Experienced Creative'}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${isSelected ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-secondary text-secondary-foreground border-border'}`}>
                        {isSelected ? '✓ Selected' : 'Select Mentor'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Request Mentorship — Distinct Floating Panel */}
        <div className="xl:sticky xl:top-6">
          <AnimatePresence mode="wait">
            {selectedMentor ? (
              <motion.div
                key="request-form"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-3xl bg-cyan-500/30 blur-lg opacity-60 pointer-events-none" />
                <div className="relative bg-card border border-cyan-500/20 rounded-2xl overflow-hidden shadow-xl">
                  {/* Distinct Header */}
                  <div className="px-6 pt-6 pb-5 bg-cyan-500 text-black">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-black" />
                      <span className="text-black text-xs font-bold tracking-widest uppercase">Mentorship Request</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-black">Connect with</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black font-bold text-sm">
                        {selectedMentor.name?.charAt(0)}
                      </div>
                      <span className="text-black font-semibold">{selectedMentor.name}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleRequest} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">What are your goals?</label>
                        <textarea
                          placeholder="e.g. I want to improve my UI/UX skills and build a strong portfolio..."
                          className="w-full min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 resize-none"
                          value={goals}
                          onChange={e => setGoals(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 border-0 text-black font-bold" disabled={sending}>
                          {sending ? 'Sending...' : 'Send Request'}
                          {!sending && <Send className="ml-2 w-4 h-4" />}
                        </Button>
                        <Button type="button" className="rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={() => setSelectedMentor(null)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border border-dashed rounded-2xl p-8 text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto border border-border">
                  <User className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-foreground">No Mentor Selected</h3>
                <p className="text-sm text-muted-foreground">Click on a mentor card to send them a mentorship request.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
