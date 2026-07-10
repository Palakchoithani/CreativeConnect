'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share2, Bookmark, Eye, Calendar, User, Tag, Globe, Music, Info, Award, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PortfolioPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (user) {
          setIsLiked(data.portfolioLikes?.some((l: any) => l.userId === user.id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return alert('Please login to like');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const { liked } = await res.json();
        setIsLiked(liked);
        setProject((prev: any) => ({ ...prev, likes: prev.likes + (liked ? 1 : -1) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio/${id}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: comment })
      });
      if (res.ok) {
        setComment('');
        fetchProject(); // Refresh comments
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Loading Case Study...</div>;
  if (!project) return <div className="p-20 text-center text-muted-foreground">Project not found</div>;

  // Safe parse JSON columns
  let linksMap: any = {};
  let additionalMap: any = {};
  let seoMap: any = {};

  try { if (project.links) linksMap = JSON.parse(project.links); } catch(e){}
  try { if (project.additionalInfo) additionalMap = JSON.parse(project.additionalInfo); } catch(e){}
  try { if (project.seoInfo) seoMap = JSON.parse(project.seoInfo); } catch(e){}

  return (
    <div className="bg-[#0F1117] min-h-screen pb-20">
      {/* Cover Banner */}
      {project.coverImage ? (
        <div className="w-full h-[40vh] md:h-[55vh] bg-[#151922] relative overflow-hidden border-b border-border/30">
          <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-[#0F1117]/35 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-20 bg-transparent" />
      )}

      <motion.div 
        className={`max-w-4xl mx-auto px-6 ${project.coverImage ? '-mt-24 relative z-10' : 'pt-8'}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-[#1C2230]/75 backdrop-blur-xl border border-border/40 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {project.category && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider">{project.category}</span>
              )}
              {project.discipline && (
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">{project.discipline}</span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">{project.title}</h1>
            {project.subtitle && <h2 className="text-lg md:text-xl text-muted-foreground leading-normal">{project.subtitle}</h2>}
          </div>
          
          {/* Creator Profile Ribbon */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground border-y border-border/30 py-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden">
                {project.creator?.profile?.avatarUrl && <img src={project.creator.profile.avatarUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{project.creator?.name}</span>
                <span>{project.role || 'Creator'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-medium"><Eye size={14}/> {project.views} Views</div>
            <div className="flex items-center gap-1.5 font-medium"><Heart size={14}/> {project.likes} Likes</div>
            <div className="flex items-center gap-1.5 font-medium"><Calendar size={14}/> {new Date(project.createdAt).toLocaleDateString()}</div>
          </div>

          {/* Project Summary */}
          {project.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Project Summary</h3>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* Detailed Case Study */}
          {project.fullCaseStudy && (
            <div className="space-y-2 pt-4 border-t border-border/20">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Case Study</h3>
              <div className="text-foreground/95 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-secondary/5 p-4 rounded-xl border border-border/20">{project.fullCaseStudy}</div>
            </div>
          )}

          {/* Key metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#151922]/55 p-6 rounded-2xl border border-border/30 text-xs">
            {project.technologies && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Technologies</span>
                <span className="text-foreground font-semibold">{project.technologies}</span>
              </div>
            )}
            {project.softwareUsed && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Software Used</span>
                <span className="text-foreground font-semibold">{project.softwareUsed}</span>
              </div>
            )}
            {project.skills && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Skills Demonstrated</span>
                <span className="text-foreground font-semibold">{project.skills}</span>
              </div>
            )}
            {project.timeline && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Timeline</span>
                <span className="text-foreground font-semibold">{project.timeline}</span>
              </div>
            )}
            <div>
              <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Status & Client Type</span>
              <span className="text-foreground font-semibold">{project.status} • {project.clientType || 'Personal'}</span>
            </div>
            <div>
              <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Team Size & Role</span>
              <span className="text-foreground font-semibold">{project.teamSize} Member(s) • {project.role || 'Contributor'}</span>
            </div>
            {project.licensing && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Distribution License</span>
                <span className="text-foreground font-semibold">{project.licensing}</span>
              </div>
            )}
            {project.credits && (
              <div>
                <span className="block text-muted-foreground/60 uppercase font-bold text-[10px] tracking-wider mb-0.5">Credits / Sponsors</span>
                <span className="text-foreground font-semibold">{project.credits}</span>
              </div>
            )}
          </div>

          {/* Social Links Panel */}
          {Object.keys(linksMap).length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/20">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Project Links</h3>
              <div className="flex flex-wrap gap-2">
                {linksMap.github && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.github, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    <Globe size={14}/> GitHub
                  </Button>
                )}
                {linksMap.live && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.live, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    <Globe size={14}/> Live Demo
                  </Button>
                )}
                {linksMap.figma && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.figma, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    Figma
                  </Button>
                )}
                {linksMap.behance && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.behance, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    Behance
                  </Button>
                )}
                {linksMap.youtube && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.youtube, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    <Globe size={14}/> YouTube
                  </Button>
                )}
                {linksMap.soundcloud && (
                  <Button variant="outline" size="sm" onClick={() => window.open(linksMap.soundcloud, '_blank')} className="text-xs gap-1.5 bg-[#151922]/50 border-border/40">
                    <Music size={14}/> Audio Link
                  </Button>
                )}
                {linksMap.custom?.map((lnk: any, idx: number) => (
                  <Button key={idx} variant="outline" size="sm" onClick={() => window.open(lnk.url, '_blank')} className="text-xs bg-[#151922]/50 border-border/40">
                    {lnk.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Media Attachments Gallery */}
        {project.mediaList && project.mediaList.length > 0 && (
          <div className="space-y-6 mt-12">
            <h3 className="text-xl font-bold text-foreground">Media Gallery ({project.mediaList.length})</h3>
            <div className="grid grid-cols-1 gap-6">
              {project.mediaList.map((media: any) => (
                <motion.div 
                  key={media.id} 
                  className="rounded-2xl overflow-hidden border border-border/40 bg-[#1C2230] shadow-md flex items-center justify-center relative"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {media.mediaType === 'IMAGE' && <img src={media.url} alt="" className="w-full h-auto object-cover max-h-[80vh]" />}
                  {media.mediaType === 'VIDEO' && <video src={media.url} controls className="w-full h-auto" />}
                  {media.mediaType === 'AUDIO' && <audio src={media.url} controls className="w-full max-w-lg p-6 bg-secondary/10" />}
                  {media.mediaType === 'PDF' && (
                    <div className="p-12 text-center text-xs font-semibold text-muted-foreground w-full space-y-2">
                      <FileText size={32} className="mx-auto text-primary opacity-60" />
                      <p>Attachment: PDF Document</p>
                      <Button variant="outline" size="sm" onClick={() => window.open(media.url, '_blank')}>Download PDF</Button>
                    </div>
                  )}
                  {media.mediaType === 'ZIP' && (
                    <div className="p-12 text-center text-xs font-semibold text-muted-foreground w-full space-y-2">
                      <FileText size={32} className="mx-auto text-[#7C5CFC] opacity-60" />
                      <p>Attachment: Project Source Files (ZIP)</p>
                      <Button variant="outline" size="sm" onClick={() => window.open(media.url, '_blank')}>Download ZIP</Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Action Ribbons */}
        <div className="flex justify-center gap-4 my-12 sticky bottom-6 z-40">
          <Button 
            size="lg" 
            variant={isLiked ? 'default' : 'outline'} 
            className={`rounded-full shadow-2xl ${isLiked ? 'bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white' : 'bg-card/90 backdrop-blur'}`}
            onClick={handleLike}
          >
            <Heart className="mr-2" size={18} fill={isLiked ? 'currentColor' : 'none'} /> 
            {project.likes} Likes
          </Button>
        </div>

        {/* Reviews/Comments Panel */}
        <div className="bg-[#1C2230]/75 border border-border/40 rounded-3xl p-8 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-foreground">Comments ({project.comments?.length || 0})</h3>
          
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <Input 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Share constructive feedback..." 
                className="bg-[#151922]"
              />
              <Button type="submit">Post Comment</Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground text-center bg-secondary/15 py-3 rounded-lg">Please login to write a comment.</p>
          )}

          <div className="space-y-4">
            {project.comments?.map((c: any) => (
              <div key={c.id} className="flex gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                  {c.user?.profile?.avatarUrl && <img src={c.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="bg-secondary/25 p-3 rounded-xl border border-border/40">
                    <p className="font-bold text-foreground mb-0.5">{c.user?.name}</p>
                    <p className="text-foreground/90 leading-relaxed">{c.content}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
