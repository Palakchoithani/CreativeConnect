'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, MessageSquare, Plus, ThumbsUp, Heart, Eye } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioReviewsHub() {
  const { token, isAuthenticated } = useAuth();
  const { success, error: showError, info } = useToast();
  
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  // Form states
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio`);
      if (res.ok) setPortfolios(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviews = async (port: any) => {
    setSelectedPortfolio(port);
    setShowModal(true);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio-reviews/${port.id}`);
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio-reviews/${selectedPortfolio.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, content })
      });
      if (res.ok) {
        setContent('');
        success('Review submitted successfully!');
        // Reload reviews
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio-reviews/${selectedPortfolio.id}`);
        if (refreshRes.ok) setReviews(await refreshRes.json());
      } else {
        showError('Failed to submit review');
      }
    } catch (err) {
      showError('Network error');
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) return info('Please login to vote');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio-reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('Marked review as helpful!');
        // Refresh reviews
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio-reviews/${selectedPortfolio.id}`);
        if (refreshRes.ok) setReviews(await refreshRes.json());
      } else {
        showError('Action failed');
      }
    } catch (err) {
      showError('Network error');
    }
  };

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Portfolio Reviews</h1>
        <p className="text-muted-foreground">Request or provide professional feedback and ratings on visual masterpieces.</p>
      </div>

      {loading && portfolios.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-3xl">
          No portfolios uploaded yet. Go to Portfolios to upload your work first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map(port => (
            <div key={port.id} className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:border-primary/50 transition">
              <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
                {port.coverImage ? (
                  <img src={port.coverImage} alt={port.title} className="w-full h-full object-cover group-hover:scale-102 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Cover Image</div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-foreground line-clamp-1 mb-1">{port.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{port.category || 'Uncategorized'}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1"><Eye size={12}/> {port.views}</span>
                      <span className="flex items-center gap-1"><Heart size={12}/> {port.likes}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 mt-2 font-medium">By {port.creator?.name}</p>
                </div>

                <div className="pt-2 border-t border-border/20 flex gap-2">
                  <Link href={`/portfolio/${port.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">View Project</Button>
                  </Link>
                  <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => handleOpenReviews(port)}>
                    <Star size={12}/> Reviews
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Detail Modal */}
      {showModal && selectedPortfolio && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl p-6 rounded-2xl space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Reviews: {selectedPortfolio.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">Leave professional feedback on this visual project.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Close</Button>
            </div>

            {/* Leave Review form */}
            {isAuthenticated ? (
              <form onSubmit={handleLeaveReview} className="bg-secondary/25 p-4 rounded-xl border border-border/40 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</label>
                  <select 
                    className="rounded-md border border-border bg-input p-1.5 text-xs text-foreground focus:outline-none"
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="What is done well? What could be improved?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">Submit Review</Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center bg-secondary/20 py-3 rounded-lg">Please login to write a review.</p>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm">Community Feedback</h4>
              {reviews.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6">No reviews left yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="p-4 bg-secondary/10 rounded-xl border border-border/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                            {rev.reviewer?.profile?.avatarUrl && <img src={rev.reviewer.profile.avatarUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="text-xs font-semibold text-foreground">{rev.reviewer?.name}</span>
                        </div>
                        <span className="text-xs font-bold text-yellow-500">
                          {Array.from({ length: rev.rating }).map((_, i) => '⭐').join('')}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{rev.content}</p>

                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border/10">
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 gap-1 text-[10px] text-muted-foreground hover:text-primary" onClick={() => handleHelpful(rev.id)}>
                          <ThumbsUp size={10}/> Helpful ({rev.helpfulVotes})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
