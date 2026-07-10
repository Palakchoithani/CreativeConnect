'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, Image as ImageIcon, Video, X, 
  Link as LinkIcon, Info, Eye, Search, 
  Award, BarChart2, Plus, ArrowLeft, Trash2, 
  UploadCloud, ArrowRight, ShieldCheck, Check, 
  Sparkles, Layers, CheckCircle2, Bookmark, Save
} from 'lucide-react';

const CATEGORIES = [
  'UI/UX Design', 'Graphic Design', 'Branding', 'Illustration', 'Photography',
  'Music', 'Film', 'Video Editing', 'Animation', 'Writing', 'Poetry',
  'Copywriting', 'Game Development', 'Web Development', 'Mobile App',
  'Architecture', 'Fashion', 'Digital Art', 'Marketing', 'Content Creation'
];

const CREATIVE_TYPES = [
  { id: 'UI/UX Design', name: 'UI/UX Design', icon: '🎨' },
  { id: 'Graphic Design', name: 'Graphic Design', icon: '🎨' },
  { id: 'Branding', name: 'Branding', icon: '🎯' },
  { id: 'Illustration', name: 'Illustration', icon: '🖌' },
  { id: 'Photography', name: 'Photography', icon: '📸' },
  { id: 'Music', name: 'Music', icon: '🎵' },
  { id: 'Film', name: 'Film', icon: '🎥' },
  { id: 'Video Editing', name: 'Video Editing', icon: '🎬' },
  { id: 'Animation', name: 'Animation', icon: '🎭' },
  { id: 'Writing', name: 'Writing', icon: '✍' },
  { id: 'Poetry', name: 'Poetry', icon: '📖' },
  { id: 'Copywriting', name: 'Copywriting', icon: '📰' },
  { id: 'Game Development', name: 'Game Development', icon: '🎮' },
  { id: 'Web Development', name: 'Web Development', icon: '💻' },
  { id: 'Mobile App', name: 'Mobile App', icon: '📱' },
  { id: 'Architecture', name: 'Architecture', icon: '🏗' },
  { id: 'Fashion', name: 'Fashion', icon: '👗' },
  { id: 'Digital Art', name: 'Digital Art', icon: '🎨' },
  { id: 'Marketing', name: 'Marketing', icon: '📢' },
  { id: 'Content Creation', name: 'Content Creation', icon: '📱' }
];

export default function CreatePortfolioWizard() {
  const { token, user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved to local draft');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- WIZARD FORM STATES ---
  const [selectedCreativeType, setSelectedCreativeType] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullCaseStudy, setFullCaseStudy] = useState('');
  const [tags, setTags] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [status, setStatus] = useState('Completed');
  const [role, setRole] = useState('Lead Creator');
  const [skills, setSkills] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [softwareUsed, setSoftwareUsed] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [client, setClient] = useState('');
  const [timelineStart, setTimelineStart] = useState('');
  const [timelineEnd, setTimelineEnd] = useState('');
  const [teamSize, setTeamSize] = useState('1');
  const [challenges, setChallenges] = useState('');
  const [solution, setSolution] = useState('');
  const [outcome, setOutcome] = useState('');
  const [learnings, setLearnings] = useState('');

  // Step 3 files (not saved in localStorage)
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Step 4 links
  const [github, setGithub] = useState('');
  const [live, setLive] = useState('');
  const [figma, setFigma] = useState('');
  const [behance, setBehance] = useState('');
  const [dribbble, setDribbble] = useState('');
  const [youtube, setYoutube] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [spotify, setSpotify] = useState('');
  const [medium, setMedium] = useState('');
  const [notion, setNotion] = useState('');
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Step 5
  const [targetAudience, setTargetAudience] = useState('');
  const [industry, setIndustry] = useState('');
  const [languages, setLanguages] = useState('');
  const [budget, setBudget] = useState('');
  const [licensing, setLicensing] = useState('Copyright');
  const [copyright, setCopyright] = useState('All Rights Reserved');
  const [awards, setAwards] = useState('');
  const [certifications, setCertifications] = useState('');
  const [openForCollaboration, setOpenForCollaboration] = useState(true);
  const [openForFreelance, setOpenForFreelance] = useState(true);

  // Step 6
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  // Load from draft local persistence on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_portfolio_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedCreativeType) setSelectedCreativeType(draft.selectedCreativeType);
        if (draft.title) setTitle(draft.title);
        if (draft.subtitle) setSubtitle(draft.subtitle);
        if (draft.description) setDescription(draft.description);
        if (draft.fullCaseStudy) setFullCaseStudy(draft.fullCaseStudy);
        if (draft.tags) setTags(draft.tags);
        if (draft.discipline) setDiscipline(draft.discipline);
        if (draft.status) setStatus(draft.status);
        if (draft.role) setRole(draft.role);
        if (draft.skills) setSkills(draft.skills);
        if (draft.technologies) setTechnologies(draft.technologies);
        if (draft.softwareUsed) setSoftwareUsed(draft.softwareUsed);
        if (draft.toolsUsed) setToolsUsed(draft.toolsUsed);
        if (draft.collaborators) setCollaborators(draft.collaborators);
        if (draft.client) setClient(draft.client);
        if (draft.timelineStart) setTimelineStart(draft.timelineStart);
        if (draft.timelineEnd) setTimelineEnd(draft.timelineEnd);
        if (draft.teamSize) setTeamSize(draft.teamSize);
        if (draft.challenges) setChallenges(draft.challenges);
        if (draft.solution) setSolution(draft.solution);
        if (draft.outcome) setOutcome(draft.outcome);
        if (draft.learnings) setLearnings(draft.learnings);
        if (draft.github) setGithub(draft.github);
        if (draft.live) setLive(draft.live);
        if (draft.figma) setFigma(draft.figma);
        if (draft.behance) setBehance(draft.behance);
        if (draft.dribbble) setDribbble(draft.dribbble);
        if (draft.youtube) setYoutube(draft.youtube);
        if (draft.soundcloud) setSoundcloud(draft.soundcloud);
        if (draft.spotify) setSpotify(draft.spotify);
        if (draft.medium) setMedium(draft.medium);
        if (draft.notion) setNotion(draft.notion);
        if (draft.customLinks) setCustomLinks(draft.customLinks);
        if (draft.targetAudience) setTargetAudience(draft.targetAudience);
        if (draft.industry) setIndustry(draft.industry);
        if (draft.languages) setLanguages(draft.languages);
        if (draft.budget) setBudget(draft.budget);
        if (draft.licensing) setLicensing(draft.licensing);
        if (draft.copyright) setCopyright(draft.copyright);
        if (draft.awards) setAwards(draft.awards);
        if (draft.certifications) setCertifications(draft.certifications);
        if (draft.openForCollaboration !== undefined) setOpenForCollaboration(draft.openForCollaboration);
        if (draft.openForFreelance !== undefined) setOpenForFreelance(draft.openForFreelance);
        if (draft.visibility) setVisibility(draft.visibility);
        if (draft.isFeatured !== undefined) setIsFeatured(draft.isFeatured);
        if (draft.step !== undefined) setStep(Number(draft.step));
      }
    } catch (e) {
      console.error('Error restoring draft', e);
    }
  }, []);

  // Save changes automatically
  useEffect(() => {
    try {
      if (title || description || selectedCreativeType) {
        setAutoSaveStatus('Draft auto-saving...');
        const draft = {
          selectedCreativeType, title, subtitle, description, fullCaseStudy, tags, discipline, status,
          role, skills, technologies, softwareUsed, toolsUsed, collaborators, client,
          timelineStart, timelineEnd, teamSize, challenges, solution, outcome, learnings,
          github, live, figma, behance, dribbble, youtube, soundcloud, spotify, medium, notion,
          customLinks, targetAudience, industry, languages, budget, licensing, copyright,
          awards, certifications, openForCollaboration, openForFreelance, visibility, isFeatured, step
        };
        localStorage.setItem('cc_portfolio_draft', JSON.stringify(draft));
        const timer = setTimeout(() => {
          setAutoSaveStatus('Draft auto-saved');
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Error auto-saving draft', e);
    }
  }, [
    selectedCreativeType, title, subtitle, description, fullCaseStudy, tags, discipline, status,
    role, skills, technologies, softwareUsed, toolsUsed, collaborators, client,
    timelineStart, timelineEnd, teamSize, challenges, solution, outcome, learnings,
    github, live, figma, behance, dribbble, youtube, soundcloud, spotify, medium, notion,
    customLinks, targetAudience, industry, languages, budget, licensing, copyright,
    awards, certifications, openForCollaboration, openForFreelance, visibility, isFeatured, step
  ]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setCustomLinks([...customLinks, { label: newLinkLabel, url: newLinkUrl }]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!selectedCreativeType) newErrors.selectedCreativeType = 'Category selection is required to proceed.';
    }
    if (currentStep === 1) {
      if (!title.trim()) newErrors.title = 'Project Title is required.';
      if (!description.trim()) newErrors.description = 'Short Description is required.';
    }
    if (currentStep === 3) {
      if (!coverImage) newErrors.coverImage = 'Cover Image is required to publish a case study.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const currentStep = Number(step);
    console.log('nextStep handler called. Current step:', currentStep, 'selectedCreativeType:', selectedCreativeType);
    if (!validateStep(currentStep)) {
      console.log('validateStep failed for step:', currentStep, 'Errors:', errors);
      return;
    }
    if (currentStep === 0) setDiscipline(selectedCreativeType);
    if (currentStep < 7) {
      setStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    const currentStep = Number(step);
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    setToastMessage('Draft manual save completed successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePublish = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('category', selectedCreativeType);
    formData.append('description', description);
    formData.append('visibility', visibility);
    formData.append('discipline', discipline);
    formData.append('fullCaseStudy', fullCaseStudy);
    formData.append('technologies', technologies);
    formData.append('softwareUsed', softwareUsed);
    formData.append('skills', skills);
    formData.append('timeline', `${timelineStart} to ${timelineEnd}`);
    formData.append('status', status);
    formData.append('clientType', client);
    formData.append('teamSize', teamSize);
    formData.append('collaborators', collaborators);
    formData.append('role', role);

    const linksObj = { github, live, figma, behance, dribbble, youtube, soundcloud, spotify, medium, notion, custom: customLinks };
    formData.append('links', JSON.stringify(linksObj));

    const additionalObj = { industry, targetAudience, challenges, solution, learnings, awards, openForCollaboration, openForFreelance };
    formData.append('additionalInfo', JSON.stringify(additionalObj));

    const seoObj = { tags, keywords: `${tags}, ${discipline}`, colorTheme: '#7C5CFC' };
    formData.append('seoInfo', JSON.stringify(seoObj));

    formData.append('licensing', licensing);
    formData.append('credits', copyright);
    formData.append('isFeatured', isFeatured ? 'true' : 'false');

    if (coverImage) {
      formData.append('coverImage', coverImage);
    }
    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portfolio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        try {
          localStorage.removeItem('cc_portfolio_draft');
        } catch (e) {}
        const data = await res.json();
        router.push(`/portfolio/${data.id}`);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to publish project');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic filter for display links in Step 4
  const isTypeDev = ['Web Development', 'Mobile App Development', 'Game Development', 'AI / ML Project', 'Mobile App'].includes(selectedCreativeType);
  const isTypeDesign = ['UI/UX Design', 'Graphic Design', 'Branding', 'Product Design', '3D Art', 'Digital Art'].includes(selectedCreativeType);
  const isTypeAudio = ['Music Production', 'Sound Design', 'Podcast', 'Voice Over', 'Music'].includes(selectedCreativeType);
  const isTypeVideo = ['Video Editing', 'Filmmaking', 'Animation', 'Film'].includes(selectedCreativeType);
  const isTypeWriting = ['Writing', 'Book / Novel', 'Blog / Article', 'Poetry', 'Copywriting'].includes(selectedCreativeType);

  const currentStepNum = Number(step);

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto pb-32 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#7C5CFC] text-white px-4 py-3 rounded-xl border border-white/20 shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider animate-bounce">
          <CheckCircle2 size={16}/> {toastMessage}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="text-primary" /> Creator Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Publish visual mockups, code repos, podcasts, or stories.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-muted-foreground flex items-center gap-1.5"><Save size={14} className="text-primary animate-pulse" /> {autoSaveStatus}</span>
          <span className="px-3 py-1 bg-[#1C2230] border border-border/40 text-foreground rounded-full">Step {currentStepNum} of 7</span>
        </div>
      </div>

      {/* Steps Visual Progress Bar */}
      <div className="flex justify-between items-center text-[10px] md:text-xs text-muted-foreground font-semibold px-2">
        <span className={currentStepNum >= 0 ? 'text-[#7C5CFC] font-extrabold' : ''}>Type</span>
        <span>/</span>
        <span className={currentStepNum >= 1 ? 'text-[#7C5CFC] font-extrabold' : ''}>Basic</span>
        <span>/</span>
        <span className={currentStepNum >= 2 ? 'text-[#7C5CFC] font-extrabold' : ''}>Details</span>
        <span>/</span>
        <span className={currentStepNum >= 3 ? 'text-[#7C5CFC] font-extrabold' : ''}>Media</span>
        <span>/</span>
        <span className={currentStepNum >= 4 ? 'text-[#7C5CFC] font-extrabold' : ''}>Links</span>
        <span>/</span>
        <span className={currentStepNum >= 5 ? 'text-[#7C5CFC] font-extrabold' : ''}>Extra</span>
        <span>/</span>
        <span className={currentStepNum >= 6 ? 'text-[#7C5CFC] font-extrabold' : ''}>Visibility</span>
        <span>/</span>
        <span className={currentStepNum >= 7 ? 'text-[#7C5CFC] font-extrabold' : ''}>Publish</span>
      </div>
      <div className="grid grid-cols-8 gap-2 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-full rounded-full transition-all duration-300 ${i <= currentStepNum ? 'bg-[#7C5CFC]' : 'bg-transparent'}`} />
        ))}
      </div>

      {/* Standard CSS conditional steps without AnimatePresence wrapper */}
      <div className="bg-[#1C2230]/65 border border-border/40 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative min-h-[420px] flex flex-col justify-between">
        
        <div className="flex-1">
          {/* STEP 0: Select Creative Type */}
          {currentStepNum === 0 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">What type of creative work are you showcasing?</h2>
                <p className="text-[11px] text-muted-foreground">Select your discipline. Double-click on any category to jump directly to details.</p>
              </div>

              {errors.selectedCreativeType && (
                <p className="text-xs text-pink-500 text-center font-semibold bg-pink-500/10 p-2 rounded-lg border border-pink-500/20">{errors.selectedCreativeType}</p>
              )}

              {/* Super compact grid height max-h-[160px] to ensure zero viewport scroll blocks */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar py-1 mt-4">
                {CREATIVE_TYPES.map(type => {
                  const isSelected = selectedCreativeType === type.id;
                  return (
                    <button 
                      type="button"
                      key={type.id}
                      className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-center relative overflow-hidden group select-none w-full text-xs font-semibold
                        ${isSelected 
                          ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/5' 
                          : 'bg-[#151922]/50 border-border/20 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                      onClick={() => {
                        console.log('Category clicked:', type.id);
                        setSelectedCreativeType(type.id);
                        setErrors({});
                      }}
                      onDoubleClick={() => {
                        console.log('Category double clicked:', type.id);
                        setSelectedCreativeType(type.id);
                        setDiscipline(type.id);
                        setStep(1);
                      }}
                    >
                      <span className="text-base select-none">{type.icon}</span>
                      <span className="truncate">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStepNum === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><Info size={16}/> Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Title *</label>
                  <Input value={title} onChange={e => { setTitle(e.target.value); setErrors({}); }} placeholder="e.g. 3D Cyberpunk Soundscape Generator" className="bg-[#151922]" />
                  {errors.title && <p className="text-[10px] text-pink-500 font-semibold mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subtitle / Tagline</label>
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Summary tagline..." className="bg-[#151922]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category (Pre-filled)</label>
                    <Input value={selectedCreativeType} disabled className="bg-[#151922]/40 opacity-70" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Creative Discipline / Role</label>
                    <Input value={discipline} onChange={e => setDiscipline(e.target.value)} placeholder="e.g. Lead Sound Designer" className="bg-[#151922]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Short Description (Max 250 chars) *</label>
                  <textarea 
                    maxLength={250}
                    className="w-full flex min-h-[80px] rounded-lg border border-border bg-[#151922] px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7C5CFC]/60"
                    value={description}
                    onChange={e => { setDescription(e.target.value); setErrors({}); }}
                  />
                  {errors.description && <p className="text-[10px] text-pink-500 font-semibold mt-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Full Case Study / Project Story</label>
                  <textarea 
                    placeholder="Discuss case studies, target research, or core logic..."
                    className="w-full flex min-h-[140px] rounded-lg border border-border bg-[#151922] px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7C5CFC]/60"
                    value={fullCaseStudy}
                    onChange={e => setFullCaseStudy(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Project Details */}
          {currentStepNum === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><Layers size={16}/> Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Role</label>
                  <Input value={role} onChange={e => setRole(e.target.value)} className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skills Demonstrated</label>
                  <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Interaction, Synthesis" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Technologies Used</label>
                  <Input value={technologies} onChange={e => setTechnologies(e.target.value)} placeholder="e.g. React, Three.js" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Software Used</label>
                  <Input value={softwareUsed} onChange={e => setSoftwareUsed(e.target.value)} placeholder="e.g. Figma, Ableton Live" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tools / Collaborators</label>
                  <Input value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Collaborator emails..." className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Client (Optional)</label>
                  <Input value={client} onChange={e => setClient(e.target.value)} placeholder="Personal / Agency" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Timeline (Start & End Date)</label>
                  <div className="flex gap-2">
                    <Input type="date" value={timelineStart} onChange={e => setTimelineStart(e.target.value)} className="bg-[#151922] text-xs" />
                    <Input type="date" value={timelineEnd} onChange={e => setTimelineEnd(e.target.value)} className="bg-[#151922] text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Team Size</label>
                    <Input type="number" min={1} value={teamSize} onChange={e => setTeamSize(e.target.value)} className="bg-[#151922]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-[#151922] p-2.5 text-xs text-foreground focus:outline-none"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Challenges Faced</label>
                  <Input value={challenges} onChange={e => setChallenges(e.target.value)} placeholder="What was the core bottleneck?" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Solution</label>
                  <Input value={solution} onChange={e => setSolution(e.target.value)} placeholder="How did you resolve it?" className="bg-[#151922]" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {currentStepNum === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><ImageIcon size={16}/> Media Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Image *</label>
                  <div 
                    className="border-2 border-dashed border-border/50 rounded-2xl p-10 text-center cursor-pointer hover:bg-secondary/20 transition bg-[#151922]"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverImage ? (
                      <p className="text-primary font-bold text-xs">{coverImage.name}</p>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-1 text-xs">
                        <UploadCloud size={28} className="opacity-60" />
                        <span>Select Cover Thumbnail</span>
                      </div>
                    )}
                  </div>
                  {errors.coverImage && <p className="text-[10px] text-pink-500 font-semibold mt-1">{errors.coverImage}</p>}
                  <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => { e.target.files?.[0] && setCoverImage(e.target.files[0]); setErrors({}); }} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Files (Images, Videos, Audio, PDFs, ZIPs)</label>
                  <div 
                    className="border-2 border-dashed border-border/50 rounded-2xl p-10 text-center cursor-pointer hover:bg-secondary/20 transition bg-[#151922]"
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <div className="text-muted-foreground flex flex-col items-center gap-1 text-xs">
                      <UploadCloud size={28} className="opacity-60" />
                      <span>Upload Visual/Resource Attachments</span>
                    </div>
                  </div>
                  <input type="file" ref={mediaInputRef} className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,application/zip" onChange={handleMediaUpload} />
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Attached Assets ({mediaFiles.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFiles.map((file, i) => (
                      <div key={i} className="relative p-3 bg-[#151922]/55 rounded-xl border border-border/30 flex flex-col justify-between items-center text-center">
                        <button type="button" onClick={() => removeMedia(i)} className="absolute top-1 right-1 text-muted-foreground hover:text-pink-500">
                          <X size={12}/>
                        </button>
                        <span className="text-[10px] text-foreground font-semibold line-clamp-2 pt-2">{file.name}</span>
                        <span className="text-[9px] text-muted-foreground mt-2 uppercase font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Links & Resources (Dynamic inputs) */}
          {currentStepNum === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><LinkIcon size={16}/> Links & Resources</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isTypeDev && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">GitHub Repo</label>
                      <Input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Live Application Website</label>
                      <Input value={live} onChange={e => setLive(e.target.value)} placeholder="https://..." className="bg-[#151922]" />
                    </div>
                  </>
                )}

                {isTypeDesign && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Figma Prototype Link</label>
                      <Input value={figma} onChange={e => setFigma(e.target.value)} placeholder="https://figma.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Behance Project</label>
                      <Input value={behance} onChange={e => setBehance(e.target.value)} placeholder="https://behance.net/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dribbble Shot</label>
                      <Input value={dribbble} onChange={e => setDribbble(e.target.value)} placeholder="https://dribbble.com/..." className="bg-[#151922]" />
                    </div>
                  </>
                )}

                {isTypeAudio && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Spotify Playlist/Track</label>
                      <Input value={spotify} onChange={e => setSpotify(e.target.value)} placeholder="https://open.spotify.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">SoundCloud Link</label>
                      <Input value={soundcloud} onChange={e => setSoundcloud(e.target.value)} placeholder="https://soundcloud.com/..." className="bg-[#151922]" />
                    </div>
                  </>
                )}

                {isTypeVideo && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">YouTube Video URL</label>
                      <Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vimeo Link</label>
                      <Input value={live} onChange={e => setLive(e.target.value)} placeholder="https://vimeo.com/..." className="bg-[#151922]" />
                    </div>
                  </>
                )}

                {isTypeWriting && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Medium Article</label>
                      <Input value={medium} onChange={e => setMedium(e.target.value)} placeholder="https://medium.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notion Draft Document</label>
                      <Input value={notion} onChange={e => setNotion(e.target.value)} placeholder="https://notion.so/..." className="bg-[#151922]" />
                    </div>
                  </>
                )}

                {!isTypeDev && !isTypeDesign && !isTypeAudio && !isTypeVideo && !isTypeWriting && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#7C5CFC] uppercase tracking-wider mb-1">GitHub Repo</label>
                      <Input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." className="bg-[#151922]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Live Demo / Website</label>
                      <Input value={live} onChange={e => setLive(e.target.value)} placeholder="https://..." className="bg-[#151922]" />
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-border/30 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Unlimited Custom Links</h4>
                <div className="flex gap-2">
                  <Input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Label (e.g. ArtStation Profile)" className="bg-[#151922] text-xs flex-1" />
                  <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL (https://...)" className="bg-[#151922] text-xs flex-2" />
                  <Button type="button" onClick={addCustomLink} size="sm"><Plus size={16}/></Button>
                </div>

                {customLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customLinks.map((lnk, idx) => (
                      <div key={idx} className="bg-secondary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-border/40 text-foreground">
                        <span>{lnk.label}: <span className="text-primary">{lnk.url}</span></span>
                        <X size={12} className="cursor-pointer hover:text-pink-500" onClick={() => removeCustomLink(idx)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Additional Info */}
          {currentStepNum === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><Award size={16}/> Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Target Audience</label>
                  <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. Sound designers, developers" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Industry Sectors</label>
                  <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Audio Technology, Web3" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Languages Used</label>
                  <Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="e.g. English, JS, C++" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budget / Costs (Optional)</label>
                  <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $5,000" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Distribution License</label>
                  <select 
                    className="w-full rounded-xl border border-border bg-[#151922] p-2.5 text-xs text-foreground focus:outline-none"
                    value={licensing}
                    onChange={e => setLicensing(e.target.value)}
                  >
                    <option value="Copyright">Standard Copyright (All rights reserved)</option>
                    <option value="Creative Commons">Creative Commons (Attribution required)</option>
                    <option value="MIT">MIT License (Permissive open source)</option>
                    <option value="GPL">GNU GPL (ShareAlike copyleft)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Copyright Credits Text</label>
                  <Input value={copyright} onChange={e => setCopyright(e.target.value)} className="bg-[#151922]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Awards / Winner Badges</label>
                  <Input value={awards} onChange={e => setAwards(e.target.value)} placeholder="e.g. CSS Design Award" className="bg-[#151922]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Certifications / Courses</label>
                  <Input value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="e.g. AWS Audio Engineer Certification" className="bg-[#151922]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-secondary/10 rounded-xl border border-border/40">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-foreground">
                    <input type="checkbox" checked={openForCollaboration} onChange={e => setOpenForCollaboration(e.target.checked)} className="rounded border-border bg-[#151922] checked:bg-[#7C5CFC]" />
                    Open for Collaboration
                  </label>
                </div>
                <div className="p-4 bg-secondary/10 rounded-xl border border-border/40">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-foreground">
                    <input type="checkbox" checked={openForFreelance} onChange={e => setOpenForFreelance(e.target.checked)} className="rounded border-border bg-[#151922] checked:bg-[#7C5CFC]" />
                    Open for Hire
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Visibility & Publishing */}
          {currentStepNum === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2"><Eye size={16}/> Visibility Scope</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Visibility</label>
                  <select 
                    className="w-full rounded-xl border border-border bg-[#151922] p-2.5 text-xs text-foreground focus:outline-none"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value)}
                  >
                    <option value="PUBLIC">Public (Visible in feed & search)</option>
                    <option value="CONNECTIONS">Connections Only (Verified followers)</option>
                    <option value="PRIVATE">Private Draft (Only you can access)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/10 rounded-xl border border-border/40">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-foreground">
                      <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded border-border bg-[#151922] checked:bg-[#7C5CFC]" />
                      Pin to profile dashboard featured board
                    </label>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-xl border border-border/40">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-foreground">
                      <input type="checkbox" checked={allowComments} onChange={e => setAllowComments(e.target.checked)} className="rounded border-border bg-[#151922] checked:bg-[#7C5CFC]" />
                      Allow feedback comments
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Publish */}
          {currentStepNum === 7 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-foreground">Review & Publish Project</h2>
                <p className="text-xs text-muted-foreground">Verify case study summary cards before broadcasting to followers.</p>
              </div>

              <div className="bg-[#151922]/55 p-6 rounded-2xl border border-border/40 space-y-4 text-xs">
                <div className="flex justify-between items-start border-b border-border/20 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{title || 'Untitled Case Study'}</h4>
                    <p className="text-muted-foreground mt-0.5">{subtitle || 'No tagline subtitle'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded text-[10px] uppercase">{selectedCreativeType}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-muted-foreground/60 uppercase font-bold text-[9px] tracking-wider mb-0.5">Role</span>
                    <span className="text-foreground font-semibold">{role}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground/60 uppercase font-bold text-[9px] tracking-wider mb-0.5">Software</span>
                    <span className="text-foreground font-semibold">{softwareUsed || 'None listed'}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground/60 uppercase font-bold text-[9px] tracking-wider mb-0.5">Visibility</span>
                    <span className="text-foreground font-semibold">{visibility}</span>
                  </div>
                </div>

                {description && (
                  <div className="pt-2 border-t border-border/10">
                      <span className="block text-muted-foreground/60 uppercase font-bold text-[9px] tracking-wider mb-0.5">Short Summary</span>
                      <p className="text-foreground/90 leading-relaxed font-medium">{description}</p>
                  </div>
                )}

                {coverImage && (
                  <div className="p-3 bg-secondary/15 rounded-xl border border-border/30 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Banner attachment: {coverImage.name}</span>
                    <span className="text-[10px] font-bold text-primary">Ready to upload</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Step Buttons Footer using robust native buttons styled with tailwind */}
        <div className="flex justify-between pt-6 border-t border-border/30 mt-8">
          <div className="flex gap-2">
            <button 
              type="button" 
              disabled={currentStepNum === 0 || loading} 
              onClick={prevStep} 
              className="gap-1.5 text-xs font-bold px-4 py-2 border border-border bg-[#1C2230] text-foreground rounded-xl disabled:opacity-50 disabled:pointer-events-none flex items-center cursor-pointer"
            >
              <ArrowLeft size={14} className="mr-1"/> Previous
            </button>
            <button 
              type="button" 
              onClick={handleSaveDraft}
              className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-4 py-2 border border-transparent bg-transparent rounded-xl flex items-center cursor-pointer"
            >
              <Save size={14} className="mr-1"/> Save as Draft
            </button>
          </div>

          {currentStepNum < 7 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className="gap-1.5 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center cursor-pointer"
            >
              Next Step <ArrowRight size={14} className="ml-1"/>
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handlePublish} 
              disabled={loading} 
              className="gap-1.5 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-bold shadow-lg shadow-[#7C5CFC]/20 text-xs px-4 py-2 rounded-xl flex items-center cursor-pointer"
            >
              {loading ? 'Broadcasting...' : 'Publish Project'} <Check size={14} className="ml-1"/>
            </button>
          )}
        </div>

      </div>

    </motion.div>
  );
}
