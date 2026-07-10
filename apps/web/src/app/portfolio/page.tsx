'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Heart, Eye, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PortfolioHub() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/categories`);
        if (res.ok) setCategories(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch portfolios on category or debounced search change
  useEffect(() => {
    fetchData();
  }, [activeCategory, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio`;
      if (debouncedSearch) {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/search?q=${encodeURIComponent(debouncedSearch)}`;
      } else if (activeCategory) {
        url += `?category=${encodeURIComponent(activeCategory)}`;
      }

      const portsRes = await fetch(url);
      if (portsRes.ok) setPortfolios(await portsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Discover Portfolios</h1>
          <p className="text-muted-foreground">Explore the best creative work from our community.</p>
        </div>
        <Link href="/portfolio/create">
          <Button size="lg">Create Project</Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search projects, tags, or categories..." 
            className="pl-10 bg-input border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[4/3] bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No projects found.
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={{
            show: { transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="show"
        >
          {portfolios.map(project => (
            <motion.div 
              key={project.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show: { opacity: 1, scale: 1 }
              }}
              className="group cursor-pointer"
            >
              <Link href={`/portfolio/${project.id}`}>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-secondary relative mb-3 border border-border">
                  {project.coverImage ? (
                    <img 
                      src={project.coverImage} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Cover Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                    {project.creator?.profile?.avatarUrl && (
                      <img src={project.creator.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{project.creator?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    <Heart size={14} /> {project.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} /> {project.views}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
