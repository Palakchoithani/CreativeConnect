'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Heart, Eye, Briefcase, Camera, Edit3, Trash2, ExternalLink, MapPin, Globe } from 'lucide-react';

export default function ProfilePage() {
  const { token, user, logout, isAuthenticated, refreshUser } = useAuth();
  const { success, error: showError, info } = useToast();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', location: '', skills: '', website: '', instagram: '', twitter: '', linkedin: '' });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchProfile();
  }, [isAuthenticated, router, token]);

  useEffect(() => {
    if (user?.id) fetchPortfolios();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          bio: data.bio || '',
          location: data.location || '',
          skills: data.skills || '',
          website: data.website || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
        });
      }
    } catch (err) {
      showError('Failed to load profile');
    }
  };

  const fetchPortfolios = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${user?.id}/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPortfolios(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) { showError('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { showError('Image must be under 5MB'); return; }

    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarUploading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/profile/me/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchProfile();
        success('Profile photo updated!');
      } else {
        showError('Upload failed');
      }
    } catch (err) {
      showError('Network error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
        success('Profile updated!');
      } else {
        showError('Failed to update profile');
      }
    } catch (err) {
      showError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${portfolioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
        success(`"${title}" deleted`);
      } else {
        showError('Failed to delete portfolio');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!profile) return (
    <div className="p-20 text-center text-muted-foreground animate-pulse">Loading your profile...</div>
  );

  const totalViews = portfolios.reduce((acc, p) => acc + p.views, 0);
  const totalLikes = portfolios.reduce((acc, p) => acc + p.likes, 0);

  const ROLE_BADGES: Record<string, string> = {
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
      {/* Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full bg-secondary overflow-hidden cursor-pointer border-2 border-border flex items-center justify-center text-3xl font-bold text-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : user?.name?.charAt(0)}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer border-2 border-card hover:bg-primary/80 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-foreground">{profile.user.name}</h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${ROLE_BADGES[profile.user.role] || ROLE_BADGES.CREATIVE}`}>
                  {profile.user.role}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{profile.user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 rounded-xl">
                <Edit3 className="w-4 h-4" /> Edit
              </Button>
            )}
            <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground rounded-xl">
              Logout
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-border bg-input px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  value={form.bio}
                  onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell the community about yourself..."
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Location</label>
                  <Input value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} className="bg-input" placeholder="City, Country" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Website</label>
                  <Input value={form.website} onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))} className="bg-input" placeholder="https://yoursite.com" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Skills (comma separated)</label>
              <Input value={form.skills} onChange={e => setForm(prev => ({ ...prev, skills: e.target.value }))} className="bg-input" placeholder="Figma, Illustrator, Motion Design..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Twitter / X</label>
                <Input value={form.twitter} onChange={e => setForm(prev => ({ ...prev, twitter: e.target.value }))} className="bg-input" placeholder="@username" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Instagram</label>
                <Input value={form.instagram} onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value }))} className="bg-input" placeholder="@username" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">LinkedIn</label>
                <Input value={form.linkedin} onChange={e => setForm(prev => ({ ...prev, linkedin: e.target.value }))} className="bg-input" placeholder="linkedin.com/in/..." />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-4 border-t border-border">
            {profile.bio && <p className="text-foreground/90 text-sm leading-relaxed">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {profile.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition">
                  <Globe size={12} /> {profile.website}
                </a>
              )}
            </div>

            {profile.skills && (
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Projects', value: portfolios.length, icon: Briefcase, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Total Likes', value: totalLikes, icon: Heart, color: 'text-pink-400 bg-pink-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-foreground">My Portfolio</h2>
          <Link href="/portfolio/create">
            <Button size="sm" className="rounded-xl">+ Add Project</Button>
          </Link>
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border text-muted-foreground space-y-2">
            <Briefcase className="w-10 h-10 mx-auto opacity-30" />
            <p className="font-medium">No projects yet</p>
            <Link href="/portfolio/create"><Button size="sm" variant="outline">Create Your First Project</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(project => (
              <div key={project.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors">
                <Link href={`/portfolio/${project.id}`}>
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    {project.coverImage
                      ? <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Cover</div>}
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-sm truncate mb-1">{project.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{project.category || 'Uncategorized'}</span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1"><Eye size={11}/> {project.views}</span>
                      <span className="flex items-center gap-1"><Heart size={11}/> {project.likes}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/portfolio/${project.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-xl gap-1 text-xs">
                        <Edit3 size={12} /> Edit
                      </Button>
                    </Link>
                    <Link href={`/portfolio/${project.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full rounded-xl gap-1 text-xs text-muted-foreground">
                        <ExternalLink size={12} /> View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDeletePortfolio(project.id, project.title)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
