'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, Clock, Trophy, Upload, Users, X, Heart } from 'lucide-react';

export default function ChallengesPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission modal states
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/challenges`);
      if (res.ok) setChallenges(await res.json());
    } catch (err) {
      showError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId: string) => {
    if (!isAuthenticated) return info('Please login to vote for entries');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/challenges/entries/${entryId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('Vote registered!');
        fetchChallenges();
      } else {
        showError('Failed to vote');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim() || !entryDesc.trim()) return showError('Title and description are required');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', entryTitle);
    formData.append('description', entryDesc);
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/challenges/${selectedChallenge.id}/entries`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        success('Entry submitted successfully!');
        setSelectedChallenge(null);
        setEntryTitle('');
        setEntryDesc('');
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchChallenges();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to submit entry');
      }
    } catch {
      showError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="p-6 md:p-10 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-yellow-500/10"><Award className="w-6 h-6 text-yellow-500" /></div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Creative Challenges</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-1">Compete, showcase your skills, and earn creator badges.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No active challenges right now</p>
          <p className="text-sm mt-1">Check back soon for new creative challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {challenges.map(ch => {
            const hasSubmitted = ch.entries?.some((e: any) => e.userId === user?.id);
            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-6 space-y-6 hover:border-primary/20 transition flex flex-col md:flex-row gap-6 justify-between"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
                        {ch.status || 'ACTIVE'}
                      </span>
                      <h2 className="text-2xl font-bold text-foreground mt-2">{ch.theme}</h2>
                    </div>
                    <Trophy className="w-6 h-6 text-yellow-500 opacity-60 shrink-0 md:hidden" />
                  </div>

                  <p className="text-sm text-foreground/85 leading-relaxed">{ch.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground bg-secondary/35 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      <span className="font-medium text-foreground">{ch.entries?.length || 0} entries</span>
                    </div>
                    {ch.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary" />
                        <span className="font-medium text-foreground">Until {new Date(ch.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {ch.rewards && (
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
                      <p className="text-xs font-bold text-yellow-500">🏆 Rewards</p>
                      <p className="text-xs text-muted-foreground mt-1">{ch.rewards}</p>
                    </div>
                  )}

                  <Button
                    className="w-full md:w-auto gap-2 rounded-xl"
                    onClick={() => {
                      if (!isAuthenticated) return info('Please login to submit entries');
                      setSelectedChallenge(ch);
                    }}
                  >
                    <Upload size={14} />
                    {hasSubmitted ? 'Submit Another Entry' : 'Submit Entry'}
                  </Button>
                </div>

                {/* Submissions List */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Entries ({ch.entries?.length || 0})</h3>
                  {(!ch.entries || ch.entries.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No entries yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {ch.entries.map((entry: any) => (
                        <div key={entry.id} className="bg-secondary/40 border border-border/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-foreground truncate">{entry.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] text-primary hover:bg-primary/10 gap-1 rounded-lg shrink-0"
                              onClick={() => handleVote(entry.id)}
                            >
                              <Heart size={10} className="fill-current" /> {entry.votes}
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{entry.description}</p>
                          {entry.mediaUrl && (
                            <img src={entry.mediaUrl} alt="" className="w-full h-20 object-cover rounded-lg border border-border/40" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border w-full max-w-lg p-6 rounded-2xl space-y-6 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-xl font-bold text-foreground">Submit Challenge Entry</h3>
              <p className="text-xs text-muted-foreground mt-1">Theme: {selectedChallenge.theme}</p>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Entry Title *</label>
                <Input
                  value={entryTitle}
                  onChange={e => setEntryTitle(e.target.value)}
                  required
                  placeholder="e.g. Neon Horizon Dashboard"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  value={entryDesc}
                  onChange={e => setEntryDesc(e.target.value)}
                  required
                  placeholder="Describe your process, tools used, and the story behind your entry..."
                  rows={4}
                  className="w-full flex min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Media File (Optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} /> Choose File
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {mediaFile ? mediaFile.name : 'No file selected'}
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={e => setMediaFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 rounded-xl"
                  onClick={() => setSelectedChallenge(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl"
                >
                  {submitting ? 'Submitting...' : 'Submit Entry'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
