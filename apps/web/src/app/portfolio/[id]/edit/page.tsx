'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    tags: '',
    technologies: '',
    visibility: 'PUBLIC',
    discipline: '',
    fullCaseStudy: '',
    skills: '',
    role: '',
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchPortfolio();
  }, [isAuthenticated, id, token]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || '',
          technologies: data.technologies || '',
          visibility: data.visibility || 'PUBLIC',
          discipline: data.discipline || '',
          fullCaseStudy: data.fullCaseStudy || '',
          skills: data.skills || '',
          role: data.role || '',
        });
      } else {
        showError('Portfolio not found');
        router.push('/profile');
      }
    } catch (err) {
      showError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        success('Portfolio updated!');
        router.push(`/portfolio/${id}`);
      } else {
        const err = await res.json();
        showError(err.error || 'Failed to update portfolio');
      }
    } catch (err) {
      showError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this portfolio? This cannot be undone.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('Portfolio deleted');
        router.push('/profile');
      } else {
        showError('Failed to delete portfolio');
      }
    } catch {
      showError('Network error');
    }
  };

  const setField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return (
    <div className="p-20 flex items-center justify-center text-muted-foreground gap-3">
      <Loader2 className="animate-spin w-6 h-6" />
      <span>Loading portfolio...</span>
    </div>
  );

  return (
    <motion.div
      className="p-6 md:p-10 max-w-3xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <Link href={`/portfolio/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Edit Portfolio</h1>
          <p className="text-muted-foreground text-sm">Update your project details</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-bold text-foreground">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Title *</label>
              <Input value={form.title} onChange={e => setField('title', e.target.value)} required className="bg-input" placeholder="Project title" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Subtitle</label>
              <Input value={form.subtitle} onChange={e => setField('subtitle', e.target.value)} className="bg-input" placeholder="Short subtitle" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-border bg-input px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Describe your project..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
              <Input value={form.category} onChange={e => setField('category', e.target.value)} className="bg-input" placeholder="e.g. UI/UX Design" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Discipline</label>
              <Input value={form.discipline} onChange={e => setField('discipline', e.target.value)} className="bg-input" placeholder="e.g. Branding" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
              <Input value={form.tags} onChange={e => setField('tags', e.target.value)} className="bg-input" placeholder="e.g. React, Figma, Animation" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Technologies</label>
              <Input value={form.technologies} onChange={e => setField('technologies', e.target.value)} className="bg-input" placeholder="e.g. Next.js, Tailwind CSS" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Your Role</label>
              <Input value={form.role} onChange={e => setField('role', e.target.value)} className="bg-input" placeholder="e.g. Lead Designer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Visibility</label>
              <select
                className="w-full rounded-xl border border-border bg-input p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.visibility}
                onChange={e => setField('visibility', e.target.value)}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-bold text-foreground">Case Study</h2>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Case Study</label>
            <textarea
              className="w-full min-h-[200px] rounded-xl border border-border bg-input px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              value={form.fullCaseStudy}
              onChange={e => setField('fullCaseStudy', e.target.value)}
              placeholder="Detailed case study, process description, results..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Skills Demonstrated</label>
            <Input value={form.skills} onChange={e => setField('skills', e.target.value)} className="bg-input" placeholder="e.g. Wireframing, Prototyping, User Research" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
            onClick={handleDelete}
          >
            Delete Portfolio
          </Button>
          <div className="flex gap-3">
            <Link href={`/portfolio/${id}`}>
              <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving} className="gap-2 rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
