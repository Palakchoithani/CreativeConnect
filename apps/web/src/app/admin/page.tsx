'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Users, Briefcase, Eye, ShieldAlert, Award, FileText, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { token, user, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/overview`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (reportsRes.ok) setReportsList(await reportsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('User suspension status updated');
        fetchAdminData();
      } else {
        error('Failed to update suspension status');
      }
    } catch (err) {
      error('Network error');
      console.error(err);
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('User verification status updated');
        fetchAdminData();
      } else {
        error('Failed to update verification status');
      }
    } catch (err) {
      error('Network error');
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success('Report marked as resolved');
        fetchAdminData();
      } else {
        error('Failed to resolve report');
      }
    } catch (err) {
      error('Network error');
      console.error(err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        success(`User role successfully changed to ${newRole}`);
        fetchAdminData();
      } else {
        error('Failed to change user role');
      }
    } catch (err) {
      error('Network error while changing role');
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Loading admin parameters...</div>;

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
            <Shield className="text-primary" /> Admin Panel
          </h1>
          <p className="text-muted-foreground">Monitor statistics, manage users, and review moderation logs.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={activeTab === 'overview' ? 'default' : 'outline'} onClick={() => setActiveTab('overview')}>Overview</Button>
        <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>Users Control</Button>
        <Button variant={activeTab === 'roles' ? 'default' : 'outline'} onClick={() => setActiveTab('roles')}>Role Management</Button>
        <Button variant={activeTab === 'reports' ? 'default' : 'outline'} onClick={() => setActiveTab('reports')}>Reports ({reportsList.filter(r => r.status === 'PENDING').length})</Button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider"><Users size={16}/> Total Users</div>
            <p className="text-3xl font-extrabold text-foreground">{stats.totalUsers}</p>
          </div>
          <div className="glass p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-green-500 text-xs font-semibold uppercase tracking-wider"><CheckCircle size={16}/> Active Users</div>
            <p className="text-3xl font-extrabold text-foreground">{stats.activeUsers}</p>
          </div>
          <div className="glass p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-pink-500 text-xs font-semibold uppercase tracking-wider"><Briefcase size={16}/> Jobs Posted</div>
            <p className="text-3xl font-extrabold text-foreground">{stats.jobsPosted}</p>
          </div>
          <div className="glass p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-semibold uppercase tracking-wider"><ShieldAlert size={16}/> Active Reports</div>
            <p className="text-3xl font-extrabold text-foreground">{stats.reports}</p>
          </div>
        </div>
      )}

      {/* 2. USERS CONTROL TAB */}
      {activeTab === 'users' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
            <h3 className="font-bold text-foreground">CreativeConnect Registry</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground/90 border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/5 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Badge</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-secondary/10 transition">
                    <td className="p-4 font-semibold">{usr.name}</td>
                    <td className="p-4 text-muted-foreground">{usr.email}</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full">{usr.role}</span></td>
                    <td className="p-4">
                      {usr.isVerified ? (
                        <span className="text-blue-500 font-semibold flex items-center gap-0.5"><Award size={14}/> Verified</span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" className="text-[10px]" onClick={() => handleVerify(usr.id)}>
                        Toggle Verify
                      </Button>
                      <Button variant={usr.isActive ? 'destructive' : 'default'} size="sm" className="text-[10px]" onClick={() => handleSuspend(usr.id)}>
                        {usr.isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ROLE MANAGEMENT TAB */}
      {activeTab === 'roles' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border bg-secondary/20">
            <h3 className="font-bold text-foreground">Global Role Assignments</h3>
            <p className="text-sm text-muted-foreground mt-1">Promote staff members to Administrators or grant specialized permissions.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground/90 border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/5 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4">User</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4 text-right">Promote / Demote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-secondary/10 transition">
                    <td className="p-4">
                      <div className="font-semibold text-sm">{usr.name}</div>
                      <div className="text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] ${usr.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : usr.role === 'RECRUITER' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end gap-2">
                      {usr.role !== 'ADMIN' && (
                        <Button variant="outline" size="sm" className="text-[10px] border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => handleChangeRole(usr.id, 'ADMIN')}>
                          Make Admin
                        </Button>
                      )}
                      {usr.role !== 'RECRUITER' && (
                        <Button variant="outline" size="sm" className="text-[10px] border-blue-500/50 text-blue-500 hover:bg-blue-500/10" onClick={() => handleChangeRole(usr.id, 'RECRUITER')}>
                          Make Recruiter
                        </Button>
                      )}
                      {usr.role !== 'CREATIVE' && (
                        <Button variant="outline" size="sm" className="text-[10px] border-primary/50 text-primary hover:bg-primary/10" onClick={() => handleChangeRole(usr.id, 'CREATIVE')}>
                          Make Creative
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportsList.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl border-dashed text-muted-foreground">No reports logged.</div>
          ) : (
            reportsList.map((rep) => (
              <div key={rep.id} className="glass p-6 rounded-2xl flex justify-between items-start hover:scale-[1.01] transition-transform">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-pink-500/10 text-pink-500 font-bold rounded-full text-[10px] uppercase">
                      Reported {rep.targetType}
                    </span>
                    <span className="text-xs text-muted-foreground">Reporter: {rep.reporter?.name}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Reason: "{rep.reason}"</p>
                  <p className="text-xs text-muted-foreground">Target Entity ID: {rep.targetId}</p>
                </div>
                <div className="flex gap-2">
                  {rep.status === 'PENDING' ? (
                    <Button size="sm" onClick={() => handleResolveReport(rep.id)}>Mark Resolved</Button>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold">Resolved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </motion.div>
  );
}
