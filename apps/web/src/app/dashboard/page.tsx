'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Briefcase, Handshake, Users, Eye, Heart, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  const { token, user, isAuthenticated } = useAuth();
  
  const [recruiterJobs, setRecruiterJobs] = useState<any[]>([]);
  const [candidateApps, setCandidateApps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interview Scheduler states
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      // 1. Notifications
      const notifsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifsRes.ok) setNotifications(await notifsRes.json());

      // 2. Role-specific lists
      if (user?.role === 'RECRUITER') {
        const jobsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/recruiter/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (jobsRes.ok) setRecruiterJobs(await jobsRes.json());
      } else if (user?.role === 'CREATIVE') {
        // Fetch candidates applications
        const appsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/jobs/me/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appsRes.ok) {
          const apps = await appsRes.json();
          setCandidateApps(apps);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/recruiter/applications/${appId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/recruiter/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          candidateId: selectedCandidateId,
          date: interviewDate,
          linkUrl: liveLink,
          notes
        })
      });
      if (res.ok) {
        setShowScheduler(false);
        setInterviewDate('');
        setLiveLink('');
        setNotes('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground">Logged in as: <span className="font-semibold text-foreground">{user?.email}</span> ({user?.role})</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link href="/admin"><Button>Open Admin Panel</Button></Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Role-Specific Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RECRUITER WORKSPACE */}
          {user?.role === 'RECRUITER' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Manage Postings</h2>
                <Link href="/company"><Button size="sm" variant="outline">Edit Company Profile</Button></Link>
              </div>

              {recruiterJobs.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                  You haven't posted any jobs yet. Visit Jobs list to post.
                </div>
              ) : (
                <div className="space-y-4">
                  {recruiterJobs.map(job => (
                    <div key={job.id} className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-foreground">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">{job.location} • {job.type}</p>
                        </div>
                      </div>

                      {/* Applicants Sub-list */}
                      <div className="space-y-2 border-t border-border/30 pt-4">
                        <h4 className="text-xs font-bold text-foreground/80 flex items-center gap-1"><Users size={12}/> Applicants ({job.applications?.length || 0})</h4>
                        {job.applications?.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground">No applications currently.</p>
                        ) : (
                          <div className="space-y-2">
                            {job.applications.map((app: any) => (
                              <div key={app.id} className="flex justify-between items-center p-3 bg-secondary/15 rounded-xl border border-border/30 text-xs">
                                <div>
                                  <p className="font-bold text-foreground">{app.applicant.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{app.applicant.email}</p>
                                  {app.portfolio && (
                                    <Link href={`/portfolio/${app.portfolio.id}`} target="_blank" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                                      <Eye size={10} /> View Portfolio ({app.portfolio.title})
                                    </Link>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{app.status}</span>
                                  {app.status === 'PENDING' && (
                                    <>
                                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}>Accept</Button>
                                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50" onClick={() => handleUpdateStatus(app.id, 'REJECTED')}>Reject</Button>
                                    </>
                                  )}
                                  {app.status === 'ACCEPTED' && (
                                    <Button size="sm" className="text-[10px] h-6 px-2" onClick={() => {
                                      setSelectedJobId(job.id);
                                      setSelectedCandidateId(app.applicant.id);
                                      setShowScheduler(true);
                                    }}>Schedule</Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATIVE WORKSPACE */}
          {user?.role === 'CREATIVE' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Track Applications</h2>
              {candidateApps.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                  You haven't submitted any job applications. Visit Jobs directory to apply.
                </div>
              ) : (
                <div className="space-y-3">
                  {candidateApps.map(app => (
                    <div key={app.id} className="bg-card p-5 rounded-2xl border border-border flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-foreground">{app.jobTitle}</h3>
                        <p className="text-xs text-muted-foreground">{app.company}</p>
                      </div>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Notifications center */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell size={20}/> Notifications ({notifications.filter(n => !n.isRead).length})
          </h2>
          
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center bg-card rounded-2xl border border-border border-dashed">No notifications logged.</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-xl border transition flex justify-between items-start gap-4 cursor-pointer
                    ${notif.isRead ? 'bg-secondary/10 border-border/40 opacity-70' : 'bg-card border-primary/30 shadow-sm'}`}
                  onClick={() => markNotificationRead(notif.id)}
                >
                  <div className="space-y-1">
                    <p className="text-xs text-foreground/95 leading-relaxed">{notif.content}</p>
                    <span className="text-[9px] text-muted-foreground">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Schedule Interview</h3>
              <p className="text-xs text-muted-foreground">Select date and share online link slots.</p>
            </div>
            
            <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date & Time *</label>
                <Input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} required className="bg-input text-foreground text-xs" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Live link / Zoom Room *</label>
                <Input value={liveLink} onChange={e => setLiveLink(e.target.value)} placeholder="https://zoom.us/j/..." required className="bg-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Additional Notes</label>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Introduce interview format..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowScheduler(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
