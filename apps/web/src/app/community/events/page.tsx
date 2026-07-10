'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, User, Clock, MapPin, Plus } from 'lucide-react';

export default function WorkshopsCatalog() {
  const { token, user, isAuthenticated } = useAuth();
  const { success, error: showError, info } = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Event Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [capacity, setCapacity] = useState('100');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events`);
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title, description, speaker, date, venue, liveLink, capacity
        })
      });
      if (res.ok) {
        setShowModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setSpeaker('');
        setDate('');
        setVenue('');
        setLiveLink('');
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (eventId: string, registered: boolean) => {
    if (!isAuthenticated) return info('Please login to RSVP');
    const endpoint = registered ? 'cancel' : 'register';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/${eventId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        success(registered ? 'RSVP cancelled successfully' : 'RSVP registered successfully!');
        fetchEvents();
      } else {
        showError('RSVP action failed');
      }
    } catch (err) {
      showError('Network error');
    }
  };

  return (
    <motion.div 
      className="p-8 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Workshops & Events</h1>
          <p className="text-muted-foreground">Register for virtual panels, masterclasses, and group discussions.</p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus size={18} /> Schedule Event
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-3xl">
          No upcoming workshops scheduled yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(ev => {
            const isRegistered = ev.registrations?.some((r: any) => r.userId === user?.id);
            return (
              <div key={ev.id} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/40 transition flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold text-foreground leading-tight">{ev.title}</h3>
                    <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                      {ev.registrations?.length || 0} / {ev.capacity} RSVP
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{ev.description}</p>
                  
                  <div className="space-y-2 border-t border-border/30 pt-4 text-xs text-foreground/80 font-medium grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground" /> Host: {ev.speaker}</div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /> {new Date(ev.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2 md:col-span-2"><MapPin size={14} className="text-muted-foreground" /> Venue: {ev.venue}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/20">
                  {ev.liveLink && isRegistered && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(ev.liveLink, '_blank')}>
                      Join Online Room
                    </Button>
                  )}
                  <Button 
                    variant={isRegistered ? 'ghost' : 'default'} 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleRegister(ev.id, isRegistered)}
                  >
                    {isRegistered ? 'Cancel RSVP' : 'Register Now'}
                  </Button>
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
              <h3 className="text-2xl font-bold text-foreground">Schedule Workshop</h3>
              <p className="text-xs text-muted-foreground">List a virtual class or live session.</p>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Event Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-input" />
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
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Speaker/Host *</label>
                  <Input value={speaker} onChange={e => setSpeaker(e.target.value)} required className="bg-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date & Time *</label>
                  <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="bg-input text-foreground text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Venue *</label>
                  <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Discord, Zoom" required className="bg-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Live link (optional)</label>
                  <Input value={liveLink} onChange={e => setLiveLink(e.target.value)} placeholder="e.g. https://zoom.us/..." className="bg-input" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Capacity *</label>
                <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="bg-input" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
