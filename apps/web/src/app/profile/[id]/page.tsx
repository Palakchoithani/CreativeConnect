'use client';

import { motion } from 'framer-motion';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Heart, Eye, UserPlus, UserMinus, MessageSquare, MapPin, Globe, Briefcase } from 'lucide-react';
import { ConnectionsDialog } from '@/components/profile/ConnectionsDialog';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers');
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

  const isMe = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
  }, [id, token]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const requests = [
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${id}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${id}/portfolio`)
      ];

      // If authenticated, also fetch the current user's connections so we know who they follow in the dialog
      if (isAuthenticated && token) {
        requests.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        );
      }

      const responses = await Promise.all(requests);
      const userRes = responses[0];
      const portRes = responses[1];
      const myConnsRes = responses[2];

      if (userRes.ok) setProfileUser(await userRes.json());
      if (portRes.ok) setPortfolios(await portRes.json());
      
      if (myConnsRes?.ok) {
        const data = await myConnsRes.json();
        const followingSet = new Set<string>();
        data.following.forEach((c: any) => followingSet.add(c.following.id));
        setMyFollowingIds(followingSet);
      }

      // Check follow status if logged in
      if (isAuthenticated && token && currentUser?.id !== id) {
        const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/status/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const data = await statusRes.json();
          setIsFollowing(data.following);
        }
      }
    } catch (err) {
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) { showError('Please login to follow users'); return; }
    setFollowLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        success(data.following ? `Following ${profileUser?.name}` : `Unfollowed ${profileUser?.name}`);
        // Update follower count
        setProfileUser((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            followers: prev._count.followers + (data.following ? 1 : -1)
          }
        }));
      }
    } catch {
      showError('Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!isAuthenticated) { showError('Please login to message users'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/messages/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantId: id })
      });
      if (res.ok) {
        window.location.href = '/messages';
      }
    } catch {
      showError('Failed to start conversation');
    }
  };

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="bg-card rounded-2xl border border-border h-48" />
      <div className="grid grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl border border-border" />)}
      </div>
    </div>
  );

  if (!profileUser) return (
    <div className="p-20 text-center text-muted-foreground">
      <p className="text-2xl font-bold mb-2">User not found</p>
      <Link href="/search"><Button variant="outline">Discover Creatives</Button></Link>
    </div>
  );

  const { profile } = profileUser;
  const totalViews = portfolios.reduce((acc, p) => acc + p.views, 0);
  const totalLikes = portfolios.reduce((acc, p) => acc + p.likes, 0);

  const ROLE_COLORS: Record<string, string> = {
    CREATIVE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    RECRUITER: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    MENTOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <motion.div
      className="p-6 md:p-10 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Profile Header */}
      <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex-shrink-0 border-2 border-border flex items-center justify-center text-3xl font-bold text-foreground">
            {profile?.avatarUrl
              ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              : profileUser.name?.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-foreground">{profileUser.name}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${ROLE_COLORS[profileUser.role] || ROLE_COLORS.CREATIVE}`}>
                {profileUser.role}
              </span>
            </div>

            {profile?.bio && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {profile?.location && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition">
                  <Globe size={12} /> {profile.website}
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isMe && (
            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                className="gap-2 rounded-xl"
                disabled={followLoading}
                onClick={handleFollow}
              >
                {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={handleStartConversation}>
                <MessageSquare size={16} />
                Message
              </Button>
            </div>
          )}
          {isMe && (
            <Link href="/profile">
              <Button variant="outline" className="rounded-xl">Edit Profile</Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="text-center cursor-pointer hover:bg-secondary/50 rounded-xl p-2 transition" onClick={() => { setDialogType('followers'); setDialogOpen(true); }}>
            <p className="text-2xl font-extrabold text-foreground">{profileUser._count?.followers || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
          </div>
          <div className="text-center cursor-pointer hover:bg-secondary/50 rounded-xl p-2 transition" onClick={() => { setDialogType('following'); setDialogOpen(true); }}>
            <p className="text-2xl font-extrabold text-foreground">{profileUser._count?.following || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Following</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-extrabold text-foreground">{portfolios.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Projects</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-extrabold text-foreground">{totalViews}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Portfolio Views</p>
          </div>
        </div>

        {/* Skills */}
        {profile?.skills && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.split(',').map((s: string) => (
              <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                {s.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Portfolio <span className="text-muted-foreground font-normal text-base">({portfolios.length})</span>
        </h2>

        {portfolios.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No public portfolio projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(project => (
              <Link key={project.id} href={`/portfolio/${project.id}`} className="group block">
                <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    {project.coverImage
                      ? <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Cover</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground text-sm truncate">{project.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{project.category || 'Uncategorized'}</span>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1"><Eye size={11}/> {project.views}</span>
                        <span className="flex items-center gap-1"><Heart size={11}/> {project.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ConnectionsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        userId={id}
        type={dialogType}
        currentFollowingIds={myFollowingIds}
      />
    </motion.div>
  );
}
