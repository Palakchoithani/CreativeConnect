'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Image as ImageIcon, Send, Trash2, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchFeed(1);
  }, [isAuthenticated, router, token]);

  const fetchFeed = useCallback(async (p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/feed?page=${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (p === 1) setPosts(data.posts || []);
        else setPosts(prev => [...prev, ...(data.posts || [])]);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      }
    } catch (err) {
      showError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFile) formData.append('media', mediaFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/feed`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setContent('');
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchFeed(1);
        success('Post published!');
      } else {
        showError('Failed to publish post');
      }
    } catch (err) {
      showError('Network error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likes.some((l: any) => l.userId === user?.id);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter((l: any) => l.userId !== user?.id)
            : [...p.likes, { userId: user?.id }]
        };
      }));
    } catch (err) {
      showError('Failed to like post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/feed/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        success('Post deleted');
      }
    } catch (err) {
      showError('Failed to delete post');
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;
    setSubmittingComment(postId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, comments: [...(p.comments || []), newComment] }
          : p
        ));
      }
    } catch (err) {
      showError('Failed to post comment');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { showError('File must be under 50MB'); return; }
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  if (!isAuthenticated) return null;

  return (
    <motion.div
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-1">Activity Feed</h1>
        <p className="text-muted-foreground text-sm">See what the creative community is building.</p>
      </div>

      {/* Create Post */}
      <form onSubmit={handlePost} className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <textarea
            className="w-full flex min-h-[80px] rounded-xl border border-border bg-input px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
            placeholder="Share an update, work-in-progress, or question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden border border-border max-h-48">
            <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={() => { setMediaFile(null); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer text-sm transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} />
            <span>{mediaFile ? mediaFile.name : 'Add Media'}</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button type="submit" disabled={isPosting || !content.trim()} className="gap-2 rounded-xl">
            <Send size={14} />
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-card rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border text-muted-foreground space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => {
            const hasLiked = post.likes?.some((l: any) => l.userId === user?.id);
            const isOwner = post.userId === user?.id;
            const isExpanded = expandedComments.has(post.id);

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-foreground border border-border">
                        {post.user.profile?.avatarUrl ? (
                          <img src={post.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          post.user.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{post.user.name}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-muted-foreground hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-foreground/90 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  {/* Media */}
                  {post.mediaUrl && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <img src={post.mediaUrl} alt="" className="w-full object-cover max-h-80" loading="lazy" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs font-semibold">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Heart size={15} fill={hasLiked ? 'currentColor' : 'none'} />
                      {post.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => setExpandedComments(prev => {
                        const next = new Set(prev);
                        next.has(post.id) ? next.delete(post.id) : next.add(post.id);
                        return next;
                      })}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageSquare size={15} />
                      {post.comments?.length || 0}
                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/50 bg-secondary/10 px-5 py-4 space-y-3"
                    >
                      {post.comments?.map((c: any) => (
                        <div key={c.id} className="flex gap-3 text-sm">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground border border-border shrink-0">
                            {c.user.profile?.avatarUrl ? (
                              <img src={c.user.profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" loading="lazy" />
                            ) : c.user.name?.charAt(0)}
                          </div>
                          <div className="bg-card rounded-xl px-3 py-2 border border-border/50 flex-1">
                            <span className="font-semibold text-foreground text-xs">{c.user.name}</span>
                            <p className="text-foreground/80 text-xs mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          className="flex-1 rounded-xl border border-border bg-input px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment(post.id)}
                        />
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs rounded-xl"
                          disabled={!commentInputs[post.id]?.trim() || submittingComment === post.id}
                          onClick={() => handleComment(post.id)}
                        >
                          <Send size={12} />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Load More */}
          {page < totalPages && (
            <div className="text-center">
              <Button variant="outline" onClick={() => fetchFeed(page + 1)} disabled={loading} className="rounded-xl">
                {loading ? 'Loading...' : 'Load More Posts'}
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
