'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, MapPin, Clock, DollarSign, User, Sparkles, Send, ChevronRight } from 'lucide-react';

const JOB_TYPE_COLORS: Record<string, string> = {
  FULL_TIME: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  PART_TIME: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  CONTRACT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FREELANCE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
};

export default function JobsPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/jobs`);
      if (res.ok) setJobs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Please login to post a job');
    setPosting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, company, location, salary, type: jobType, description }),
      });
      if (res.ok) {
        setTitle(''); setCompany(''); setLocation(''); setSalary(''); setDescription('');
        setJobType('FULL_TIME');
        fetchJobs();
        setSuccessMsg('Job posted successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to post job');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) return alert('Please login to apply');
    setApplying(jobId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccessMsg('Applied successfully! Your portfolio has been attached.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to apply');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(null);
    }
  };

  return (
    <motion.div
      className="p-6 md:p-10 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Success Toast */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" /> {successMsg}
        </motion.div>
      )}

      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Job Portal</h1>
        </div>
        <p className="text-muted-foreground ml-1">Discover creative opportunities and connect with top studios worldwide.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Left — Job Listings */}
        <div className="xl:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-foreground">Latest Opportunities</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card h-44 rounded-2xl animate-pulse border border-border" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
              No jobs posted yet. Be the first to post one!
            </div>
          ) : (
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {jobs.map(job => (
                <motion.div
                  key={job.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  className="group bg-card p-6 rounded-2xl border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${JOB_TYPE_COLORS[job.type] || 'bg-secondary text-foreground border-border'}`}>
                          {JOB_TYPE_LABELS[job.type] || job.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.company}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {job.poster?.name}
                        </span>
                      </div>
                    </div>
                    <Button
                      id={`apply-${job.id}`}
                      onClick={() => handleApply(job.id)}
                      disabled={applying === job.id}
                      className="shrink-0 rounded-xl"
                    >
                      {applying === job.id ? 'Applying...' : 'Apply Now'}
                      {applying !== job.id && <ChevronRight className="ml-1 w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-foreground/75 leading-relaxed line-clamp-3">{job.description}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right — Post a Job (Distinct Section) */}
        {isAuthenticated && user?.role === 'RECRUITER' && (
          <div className="relative">
            {/* Gradient "glow" effect behind card */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-pink-500/30 blur-lg opacity-70 pointer-events-none" />

            <div className="relative bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-xl">
              {/* Distinct Header */}
              <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-violet-600 to-fuchsia-600">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Recruiter Panel</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Post a Job</h2>
                <p className="text-white/60 text-sm mt-1">Reach thousands of creative professionals.</p>
              </div>

              {/* Form */}
              <div className="p-6">
                {successMsg && successMsg.includes('posted') && (
                  <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                    ✓ Job posted successfully!
                  </div>
                )}
                <form onSubmit={handleCreateJob} className="space-y-3">
                  <Input placeholder="Job Title *" value={title} onChange={e => setTitle(e.target.value)} required className="bg-input" />
                  <Input placeholder="Company Name *" value={company} onChange={e => setCompany(e.target.value)} required className="bg-input" />
                  <Input placeholder="Location (e.g. Remote)" value={location} onChange={e => setLocation(e.target.value)} className="bg-input" />
                  <Input placeholder="Salary Range (e.g. $80k–$100k)" value={salary} onChange={e => setSalary(e.target.value)} className="bg-input" />

                  <select
                    value={jobType}
                    onChange={e => setJobType(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="FREELANCE">Freelance</option>
                  </select>

                  <textarea
                    placeholder="Job Description *"
                    className="w-full flex min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />

                  <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 text-white font-bold" disabled={posting}>
                    {posting ? 'Posting...' : 'Publish Job Post'}
                    {!posting && <Send className="ml-2 w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && user?.role !== 'RECRUITER' && (
          <div className="bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border rounded-2xl p-6 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">Only Recruiter accounts can post jobs. Apply for a job above!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
