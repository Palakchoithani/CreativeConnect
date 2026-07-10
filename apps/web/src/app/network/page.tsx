'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserPlus, UserMinus, User as UserIcon } from 'lucide-react';

export default function NetworkPage() {
  const { token, user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchNetwork();
  }, [isAuthenticated]);

  const fetchNetwork = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers);
        setFollowing(data.following);
      }
    } catch (err) {
      showError('Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string, name: string) => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/${connectionId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success(`Now connected with ${name}`);
        fetchNetwork();
      }
    } catch (err) {
      showError('Failed to accept connection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (followingId: string, name: string) => {
    setActionLoading(followingId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/${followingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success(`Unfollowed ${name}`);
        fetchNetwork();
      }
    } catch (err) {
      showError('Failed to unfollow');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) return (
    <div className="p-8 text-center text-muted-foreground">Please login to view your network.</div>
  );

  const SkeletonCard = () => (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-secondary shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <motion.div
      className="p-6 md:p-10 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Your Network</h1>
        </div>
        <p className="text-muted-foreground ml-1">
          {followers.length} followers · {following.length} following
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Followers / Incoming Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" /> Followers & Requests
          </h2>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : followers.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground text-sm">
              <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No followers yet.
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map(f => (
                <div key={f.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border flex items-center justify-center">
                      {f.follower.profile?.avatarUrl ? (
                        <img src={f.follower.profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{f.follower.name}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                  {f.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="rounded-xl h-8 text-xs"
                      disabled={actionLoading === f.id}
                      onClick={() => handleAccept(f.id, f.follower.name)}
                    >
                      Accept
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Following */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sky-400" /> Following
          </h2>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : following.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground text-sm">
              <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              You're not following anyone yet. Discover creatives on the Search page!
            </div>
          ) : (
            <div className="space-y-3">
              {following.map(f => (
                <div key={f.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border flex items-center justify-center">
                      {f.following.profile?.avatarUrl ? (
                        <img src={f.following.profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{f.following.name}</h4>
                      <p className="text-xs text-muted-foreground">{f.following.profile?.bio?.slice(0, 40) || 'Creative professional'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-8 text-xs gap-1 text-muted-foreground hover:text-red-400 hover:border-red-400/30"
                    disabled={actionLoading === f.following.id}
                    onClick={() => handleUnfollow(f.following.id, f.following.name)}
                  >
                    <UserMinus className="w-3 h-3" />
                    Unfollow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
