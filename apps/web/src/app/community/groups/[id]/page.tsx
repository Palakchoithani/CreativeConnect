'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, Send, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isMember = community?.members?.some((m: any) => m.userId === user?.id) || false;

  // New Post form states
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCommunity(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosting(true);

    const formData = new FormData();
    formData.append('title', postTitle);
    formData.append('content', postContent);
    if (mediaFile) formData.append('media', mediaFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities/${id}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setPostTitle('');
        setPostContent('');
        setMediaFile(null);
        fetchCommunity(); // Reload posts
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!isAuthenticated) return router.push('/login');
    const endpoint = isMember ? 'leave' : 'join';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCommunity();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Loading Community...</div>;
  if (!community) return <div className="p-20 text-center text-muted-foreground">Community not found</div>;

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 bg-secondary relative border-b border-border">
        {community.banner && <img src={community.banner} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <motion.div 
        className="max-w-5xl mx-auto px-6 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary border-2 border-border overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-foreground text-xl">
                {community.logo ? <img src={community.logo} alt="" className="w-full h-full object-cover" /> : community.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{community.name}</h1>
                <p className="text-xs text-muted-foreground font-semibold uppercase mt-1">{community.category} • {community.members?.length || 0} members</p>
              </div>
            </div>
            <Button onClick={handleJoinLeave} variant={isMember ? 'outline' : 'default'} className="md:self-center">
              {isMember ? 'Leave Group' : 'Join Group'}
            </Button>
          </div>

          {/* Create Post in Community */}
          {isMember && (
            <form onSubmit={handlePostSubmit} className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
              <h3 className="font-bold text-foreground text-sm">Post to Community Feed</h3>
              <Input 
                placeholder="Post title..." 
                value={postTitle} 
                onChange={e => setPostTitle(e.target.value)} 
                required 
                className="bg-input"
              />
              <textarea 
                placeholder="Share your thoughts..." 
                value={postContent} 
                onChange={e => setPostContent(e.target.value)} 
                required 
                className="w-full flex min-h-[100px] rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <div className="flex justify-between items-center border-t border-border pt-3">
                <Button type="button" variant="outline" size="sm" className="gap-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={14} /> {mediaFile ? mediaFile.name : 'Add Media'}
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={e => e.target.files?.[0] && setMediaFile(e.target.files[0])} />
                
                <Button type="submit" disabled={posting} className="gap-2">
                  <Send size={14} /> {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          )}

          {/* Posts Feed */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Community Updates</h2>
            {community.posts?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-card border border-border border-dashed rounded-3xl">
                No posts in this community yet.
              </div>
            ) : (
              community.posts.map((post: any) => (
                <div key={post.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs">
                      {post.creator?.profile?.avatarUrl ? <img src={post.creator.profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : post.creator?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{post.creator?.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground mb-2">{post.title}</h3>
                    <p className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>

                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-border max-h-96 flex items-center justify-center bg-secondary">
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          {/* Rules & Details */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-foreground">About Community</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{community.description}</p>
            {community.rules && (
              <div className="pt-4 border-t border-border space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText size={14}/> Group Rules
                </h4>
                <p className="text-xs text-foreground/75 leading-relaxed">{community.rules}</p>
              </div>
            )}
          </div>

          {/* Members list */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Users size={18}/> Members ({community.members?.length || 0})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {community.members?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs">
                    {member.user?.profile?.avatarUrl ? <img src={member.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : member.user?.name?.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-foreground line-clamp-1">{member.user?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
