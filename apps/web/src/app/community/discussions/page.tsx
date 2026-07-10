'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, ArrowUp, ArrowDown, CheckCircle, Plus } from 'lucide-react';

export default function DiscussionForum() {
  const { token, isAuthenticated, user } = useAuth();
  const { success, error: showError, info } = useToast();
  
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Career');
  const [showModal, setShowModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState<any>(null);

  // New thread states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Reply states
  const [replyContent, setReplyContent] = useState('');

  const categories = [
    'Career', 'Design Feedback', 'Portfolio Advice', 'Freelancing', 'AI Tools', 'Jobs', 'Learning Resources'
  ];

  useEffect(() => {
    fetchDiscussions();
  }, [activeCategory]);

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions?category=${encodeURIComponent(activeCategory)}`);
      if (res.ok) setDiscussions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category: activeCategory })
      });
      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setContent('');
        fetchDiscussions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/${selectedThread.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        setReplyContent('');
        // Refresh replies
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/${selectedThread.id}`);
        if (refreshRes.ok) setSelectedThread(await refreshRes.json());
        fetchDiscussions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (replyId: string, val: number) => {
    if (!isAuthenticated) return info('Please login to vote');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/replies/${replyId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value: val })
      });
      if (res.ok) {
        // Refresh replies of selected thread
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/${selectedThread.id}`);
        if (refreshRes.ok) setSelectedThread(await refreshRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/replies/${replyId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/discussions/${selectedThread.id}`);
        if (refreshRes.ok) setSelectedThread(await refreshRes.json());
        fetchDiscussions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Discussion Forum</h1>
          <p className="text-muted-foreground">Ask questions, share advice, and talk about career growth.</p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus size={18} /> Start Discussion
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Category List Sidebar */}
        <div className="bg-card p-4 rounded-2xl border border-border h-fit space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</h3>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedThread(null);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                ${activeCategory === cat 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Discussions Listing / Specific Detail */}
        <div className="lg:col-span-3 space-y-6">
          {selectedThread ? (
            // Discussion Detail View
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setSelectedThread(null)} className="text-xs mb-2">
                ← Back to Categories
              </Button>

              <div className="bg-card p-6 md:p-8 rounded-3xl border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                    {selectedThread.user?.profile?.avatarUrl && <img src={selectedThread.user.profile.avatarUrl} alt="" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{selectedThread.user?.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{new Date(selectedThread.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground">{selectedThread.title}</h2>
                <p className="text-foreground/90 text-sm whitespace-pre-wrap leading-relaxed">{selectedThread.content}</p>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground text-sm">Answers & Replies</h3>
                {selectedThread.replies?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">No answers yet. Be the first to answer!</p>
                ) : (
                  <div className="space-y-4">
                    {selectedThread.replies.map((reply: any) => {
                      const isAccepted = selectedThread.acceptedReplyId === reply.id;
                      return (
                        <div key={reply.id} className={`bg-card p-6 rounded-2xl border flex items-start gap-4 ${isAccepted ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
                          
                          {/* Voting Column */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleVote(reply.id, 1)} className="text-muted-foreground hover:text-primary">
                              <ArrowUp size={16} />
                            </button>
                            <span className="text-xs font-bold text-foreground">{reply.upvotes - reply.downvotes}</span>
                            <button onClick={() => handleVote(reply.id, -1)} className="text-muted-foreground hover:text-primary">
                              <ArrowDown size={16} />
                            </button>
                          </div>

                          {/* Content Column */}
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                                  {reply.user?.profile?.avatarUrl && <img src={reply.user.profile.avatarUrl} alt="" />}
                                </div>
                                <span className="font-semibold text-xs text-foreground">{reply.user?.name}</span>
                              </div>
                              
                              {/* Accept Answer Icon */}
                              {isAccepted ? (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <CheckCircle size={12}/> Best Answer
                                </span>
                              ) : (
                                isAuthenticated && selectedThread.userId === user?.id && (
                                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-green-500" onClick={() => handleAcceptAnswer(reply.id)}>
                                    Accept Answer
                                  </Button>
                                )
                              )}
                            </div>
                            
                            <p className="text-sm text-foreground/95 leading-relaxed">{reply.content}</p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply Input Form */}
              {isAuthenticated && (
                <form onSubmit={handleReplySubmit} className="bg-card p-6 rounded-2xl border border-border space-y-4">
                  <h4 className="font-bold text-foreground text-xs">Your Answer</h4>
                  <textarea 
                    className="w-full flex min-h-[100px] rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Provide constructive feedback or advice..."
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button type="submit">Post Answer</Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // Discussions List
            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-28 bg-card rounded-2xl animate-pulse border border-border" />)
              ) : discussions.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-3xl">
                  No discussions found in category "{activeCategory}".
                </div>
              ) : (
                discussions.map((disc) => (
                  <div 
                    key={disc.id} 
                    className="bg-card p-6 rounded-2xl border border-border hover:border-primary/40 transition cursor-pointer space-y-3"
                    onClick={() => setSelectedThread(disc)}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{disc.user?.name}</span>
                      <span>•</span>
                      <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition">{disc.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{disc.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-2 border-t border-border/20">
                      <span className="flex items-center gap-1"><MessageSquare size={14} /> {disc.replies?.length || 0} answers</span>
                      {disc.acceptedReplyId && (
                        <span className="text-green-500 flex items-center gap-1"><CheckCircle size={14} /> Answered</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* Start Discussion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Start a Discussion</h3>
              <p className="text-xs text-muted-foreground">Pose a question to the community.</p>
            </div>
            
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-input" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Question details *</label>
                <textarea 
                  className="w-full flex min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Create Thread</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
