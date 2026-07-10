'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, Folder } from 'lucide-react';
import Link from 'next/link';

export default function CommunitiesDirectory() {
  const { token, isAuthenticated, user } = useAuth();
  const { success, error: showError, info } = useToast();
  
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI/UX Design');
  const [rules, setRules] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities`);
      if (res.ok) setCommunities(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('rules', rules);
    if (logo) formData.append('logo', logo);
    if (banner) formData.append('banner', banner);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setShowModal(false);
        fetchCommunities();
        // Reset form
        setName('');
        setDescription('');
        setRules('');
        setLogo(null);
        setBanner(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id: string, isMember: boolean) => {
    if (!isAuthenticated) return info('Please login to join communities');
    const endpoint = isMember ? 'leave' : 'join';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/communities/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCommunities();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    'UI/UX Design', 'Graphic Design', 'Photography', 'Music', 'Writing',
    'Video Editing', 'Animation', 'Illustration', '3D Art', 'Programming'
  ];

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === '' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Communities</h1>
          <p className="text-muted-foreground">Find groups, share ideas, and keep up with your specific interests.</p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus size={18} /> Create Community
          </Button>
        )}
      </div>

      {/* Search & Category filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search communities..." 
            className="pl-10 bg-input border-border"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar flex-1">
          <Button 
            variant={activeCategory === '' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('')}
            className="rounded-full whitespace-nowrap"
            size="sm"
          >
            All
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat)}
              className="rounded-full whitespace-nowrap"
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No communities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(comm => {
            const isMember = comm.members?.some((m: any) => m.userId === user?.id);
            return (
              <div key={comm.id} className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:border-primary/50 transition">
                <Link href={`/community/groups/${comm.id}`}>
                  <div className="h-28 bg-secondary relative">
                    {comm.banner && <img src={comm.banner} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute -bottom-6 left-6 w-14 h-14 rounded-xl border-4 border-card bg-secondary overflow-hidden">
                      {comm.logo ? <img src={comm.logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary">{comm.name.charAt(0)}</div>}
                    </div>
                  </div>
                </Link>

                <div className="p-6 pt-10 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Link href={`/community/groups/${comm.id}`}>
                      <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition line-clamp-1">{comm.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-semibold">
                      <Folder size={12}/> {comm.category} • <Users size={12}/> {comm.members?.length || 0} members
                    </p>
                    <p className="text-sm text-foreground/80 line-clamp-2 mt-3 leading-relaxed">{comm.description}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/community/groups/${comm.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">View Group</Button>
                    </Link>
                    <Button 
                      variant={isMember ? 'ghost' : 'default'}
                      size="sm" 
                      onClick={() => handleJoin(comm.id, isMember)}
                    >
                      {isMember ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Create Community</h3>
              <p className="text-xs text-muted-foreground">Form a specialized group for your niche.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Group Name *</label>
                <Input value={name} onChange={e => setName(e.target.value)} required className="bg-input" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description *</label>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
                  <select 
                    className="w-full rounded-md border border-border bg-input p-2 text-sm text-foreground focus:outline-none"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rules</label>
                  <Input value={rules} onChange={e => setRules(e.target.value)} placeholder="e.g. Be respectful" className="bg-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Logo</label>
                  <Button type="button" variant="outline" className="w-full text-xs" onClick={() => logoInputRef.current?.click()}>
                    {logo ? logo.name : 'Upload Logo'}
                  </Button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setLogo(e.target.files[0])} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Banner</label>
                  <Button type="button" variant="outline" className="w-full text-xs" onClick={() => bannerInputRef.current?.click()}>
                    {banner ? banner.name : 'Upload Banner'}
                  </Button>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setBanner(e.target.files[0])} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
