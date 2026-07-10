'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UserPlus, UserMinus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Connection {
  id: string; // The connection ID
  user: {
    id: string;
    name: string;
    profile: {
      avatarUrl: string | null;
      bio: string | null;
    } | null;
  };
}

export function ConnectionsDialog({
  isOpen,
  onClose,
  userId,
  type,
  currentFollowingIds
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  currentFollowingIds: Set<string>; // For the logged-in user, to know if they follow these people
}) {
  const { token, isAuthenticated, user: loggedInUser } = useAuth();
  const { success, error: showError } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(currentFollowingIds);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFollowingSet(currentFollowingIds);
      fetchConnections();
    }
  }, [isOpen, userId, type, currentFollowingIds]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/user/${userId}/list`);
      if (res.ok) {
        const data = await res.json();
        // data.followers = people following `userId`
        // data.following = people `userId` is following
        if (type === 'followers') {
          // follower relation maps to connection.follower
          setConnections(data.followers.map((c: any) => ({ id: c.id, user: c.follower })));
        } else {
          setConnections(data.following.map((c: any) => ({ id: c.id, user: c.following })));
        }
      }
    } catch {
      showError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId: string, targetName: string) => {
    if (!isAuthenticated) { showError('Please login to follow users'); return; }
    setFollowLoading(targetId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connection/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowingSet(prev => {
          const next = new Set(prev);
          data.following ? next.add(targetId) : next.delete(targetId);
          return next;
        });
        success(data.following ? `Following ${targetName}` : `Unfollowed ${targetName}`);
      }
    } catch {
      showError('Action failed');
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <DialogTitle className="text-xl font-bold capitalize">{type}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => <div key={n} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />)}
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No {type} found.</p>
            </div>
          ) : (
            connections.map(c => {
              const u = c.user;
              const isMe = u.id === loggedInUser?.id;
              const isFollowing = followingSet.has(u.id);

              return (
                <div key={u.id} className="flex items-center justify-between gap-4 bg-background p-3 rounded-xl border border-border">
                  <Link href={`/profile/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0 group" onClick={onClose}>
                    <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0 border border-border overflow-hidden flex items-center justify-center font-bold">
                      {u.profile?.avatarUrl ? (
                        <img src={u.profile.avatarUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        u.name?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.profile?.bio || 'Creative Professional'}</p>
                    </div>
                  </Link>
                  
                  {!isMe && (
                    <Button
                      size="sm"
                      variant={isFollowing ? 'outline' : 'default'}
                      className="rounded-xl h-8 text-xs shrink-0"
                      disabled={followLoading === u.id}
                      onClick={() => handleFollow(u.id, u.name)}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
