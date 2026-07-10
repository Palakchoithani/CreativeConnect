'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ListTodo, CheckCircle2, ChevronDown, ChevronUp, FolderKanban, Rocket, Users, Link2, Zap } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  TODO: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function ProjectsPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/projects`);
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Please login to create a project');
    setPosting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, repoUrl }),
      });
      if (res.ok) {
        setTitle(''); setDescription(''); setRepoUrl('');
        fetchProjects();
        setSuccessMsg('Project launched!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) { console.error(err); } finally { setPosting(false); }
  };

  const handleJoin = async (projectId: string) => {
    if (!isAuthenticated) return alert('Please login to join');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/projects/${projectId}/join`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchProjects();
    } catch (err) { console.error(err); }
  };

  const toggleExpandTasks = async (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null); setProjectTasks([]); return;
    }
    setExpandedProjectId(projectId); setLoadingTasks(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tasks/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProjectTasks(await res.json());
    } catch (err) { console.error(err); } finally { setLoadingTasks(false); }
  };

  const handleCreateTask = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tasks/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: taskTitle, description: taskDesc, assigneeId: taskAssignee || user?.id })
      });
      if (res.ok) {
        setTaskTitle(''); setTaskDesc(''); setTaskAssignee('');
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tasks/project/${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (r.ok) setProjectTasks(await r.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string, projectId: string) => {
    const nextStatus = currentStatus === 'TODO' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tasks/project/${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (r.ok) setProjectTasks(await r.json());
      }
    } catch (err) { console.error(err); }
  };

  return (
    <motion.div
      className="p-6 md:p-10 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2"
        >
          <Zap className="w-4 h-4" /> {successMsg}
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-sky-500/10">
            <FolderKanban className="w-6 h-6 text-sky-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Collaboration Hub</h1>
        </div>
        <p className="text-muted-foreground ml-1">Build with a team. Share skills, ship together.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Project Listings */}
        <div className="xl:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-foreground">Open Projects</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-44 bg-card rounded-2xl animate-pulse border border-border" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed text-muted-foreground">
              No active collaborations yet. Start one!
            </div>
          ) : (
            <div className="space-y-5">
              {projects.map(project => {
                const isMember = project.members?.some((m: any) => m.userId === user?.id);
                const isExpanded = expandedProjectId === project.id;

                return (
                  <div key={project.id} className="group bg-card rounded-2xl border border-border hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-sky-400 transition-colors">{project.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Started by {project.owner?.name}
                          </p>
                        </div>
                        {project.repoUrl && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(project.repoUrl, '_blank')} className="text-xs gap-1 shrink-0">
                            <Link2 className="w-3.5 h-3.5" /> Repo
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/75 leading-relaxed mt-3">{project.description}</p>

                      {/* Team + Action Row */}
                      <div className="mt-5 pt-4 border-t border-border/30 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Team</span>
                          <div className="flex flex-wrap gap-1">
                            {project.members?.map((m: any) => (
                              <span key={m.id} className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[9px] font-semibold">{m.user?.name}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isMember ? (
                            <Button variant="outline" size="sm" className="text-xs gap-1 rounded-xl border-border hover:border-sky-500/50" onClick={() => toggleExpandTasks(project.id)}>
                              <ListTodo className="w-3.5 h-3.5" />
                              {isExpanded ? 'Hide Board' : 'Taskboard'}
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </Button>
                          ) : (
                            <Button size="sm" className="text-xs rounded-xl" onClick={() => handleJoin(project.id)}>
                              <Plus className="w-3.5 h-3.5 mr-1" /> Join Team
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Taskboard */}
                    {isExpanded && isMember && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-border/40 p-6 pt-5 bg-secondary/5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tasks</h4>
                            {loadingTasks ? (
                              <div className="space-y-2 animate-pulse">
                                <div className="h-10 bg-secondary/50 rounded-lg" />
                                <div className="h-10 bg-secondary/50 rounded-lg" />
                              </div>
                            ) : projectTasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-4 text-center bg-card rounded-xl border border-dashed border-border">No tasks yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {projectTasks.map(task => (
                                  <div key={task.id} className="p-3 bg-card rounded-xl border border-border flex justify-between items-center text-xs shadow-sm">
                                    <div>
                                      <p className="font-bold text-foreground">{task.title}</p>
                                      <p className="text-[10px] text-muted-foreground">→ {task.assignee?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-semibold text-[9px] uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[task.status] || 'bg-secondary text-foreground border-border'}`}>{task.status.replace('_', ' ')}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-emerald-400" onClick={() => handleUpdateTaskStatus(task.id, task.status, project.id)}>
                                        <CheckCircle2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm">
                            <h4 className="text-xs font-bold text-foreground">+ Add Task</h4>
                            <form onSubmit={(e) => handleCreateTask(e, project.id)} className="space-y-2">
                              <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required className="bg-input text-xs" />
                              <Input placeholder="Description (optional)" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="bg-input text-xs" />
                              <select
                                className="w-full rounded-md border border-border bg-input p-2 text-xs text-foreground focus:outline-none"
                                value={taskAssignee}
                                onChange={e => setTaskAssignee(e.target.value)}
                              >
                                <option value="">Assign to: Me</option>
                                {project.members?.map((m: any) => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
                              </select>
                              <Button type="submit" size="sm" className="w-full text-xs rounded-lg">Add Task</Button>
                            </form>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Start a Project — Premium Minimal Section */}
        {isAuthenticated && (
          <div className="xl:sticky xl:top-6">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Clean Header */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Rocket className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-widest uppercase text-foreground">New Project</span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground">Launch Collaboration</h2>
                <p className="text-muted-foreground text-sm mt-1">Define your goals and assemble a team.</p>
              </div>

              {/* Form Body */}
              <div className="p-6 bg-card">
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Name</label>
                    <Input 
                      placeholder="e.g. NextGen UI Library" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      required 
                      className="bg-background border-border shadow-sm h-10 text-sm focus-visible:ring-primary" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                    <textarea
                      placeholder="Briefly describe what you're building..."
                      className="w-full min-h-[100px] rounded-lg border border-border bg-background shadow-sm px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repository URL (Optional)</label>
                    <Input 
                      placeholder="https://github.com/..." 
                      value={repoUrl} 
                      onChange={e => setRepoUrl(e.target.value)} 
                      className="bg-background border-border shadow-sm h-10 text-sm focus-visible:ring-primary" 
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 rounded-lg bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-bold border-0 shadow-sm transition-all" disabled={posting}>
                      {posting ? 'Launching...' : 'Launch Project'}
                      {!posting && <Rocket className="ml-2 w-4 h-4" />}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
