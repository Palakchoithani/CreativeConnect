'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RecruiterCompany() {
  const { token, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return router.push('/login');
    if (user && user.role !== 'RECRUITER') return router.push('/');
    fetchCompanyData();
  }, [isAuthenticated, user]);

  const fetchCompanyData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/recruiter/company`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setName(data.name || '');
          setDescription(data.description || '');
          setWebsite(data.website || '');
          setLogo(data.logo || '');
          setBanner(data.banner || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/recruiter/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, website, logo, banner })
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save company profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <motion.div 
      className="p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground">Company Profile</h1>
        <p className="text-muted-foreground">Establish your agency identity on CreativeConnect.</p>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Company Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-input" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description *</label>
              <textarea 
                className="w-full flex min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Website URL</label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="bg-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Logo URL (Optional)</label>
                <Input value={logo} onChange={e => setLogo(e.target.value)} className="bg-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Banner URL (Optional)</label>
                <Input value={banner} onChange={e => setBanner(e.target.value)} className="bg-input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
          </div>
        </form>
      </div>

    </motion.div>
  );
}
