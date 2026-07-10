'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User as UserIcon, MessageSquare, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const { token, user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated, router, token]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      
      // Basic polling for new messages (could be replaced with WebSockets)
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, background = false) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const tempMessage = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/messages/${activeConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: tempMessage })
      });
      if (res.ok) {
        fetchMessages(activeConversation.id);
        fetchConversations(); // Update snippet and time in list
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (convo: any) => {
    return convo.participants.find((p: any) => p.userId !== user?.id)?.user;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-80px)] p-4 md:p-8 max-w-7xl mx-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-foreground" />
          Messages
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Connect with creators, mentors, and recruiters.</p>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex shadow-sm">
        
        {/* Left Pane: Conversation List */}
        <div className="w-full md:w-1/3 border-r border-border flex flex-col bg-secondary/20">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="font-bold text-foreground">Recent Chats</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-border rounded-full" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-border rounded w-1/2" />
                      <div className="h-3 bg-border rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs mt-1">Start a conversation from a user's profile.</p>
              </div>
            ) : (
              conversations.map(convo => {
                const otherUser = getOtherParticipant(convo);
                const isActive = activeConversation?.id === convo.id;
                const lastMsg = convo.messages?.[0];
                
                return (
                  <div 
                    key={convo.id}
                    onClick={() => setActiveConversation(convo)}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex gap-3
                      ${isActive ? 'bg-black/5 border-black/20 dark:bg-white/5 dark:border-white/20' : 'hover:bg-secondary/50'}`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center border border-border/50 shrink-0">
                      {otherUser?.profile?.avatarUrl ? (
                        <img src={otherUser.profile.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate text-sm ${isActive ? 'text-black dark:text-white' : 'text-foreground'}`}>
                          {otherUser?.name || 'Unknown User'}
                        </h3>
                        {lastMsg && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {new Date(lastMsg.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMsg ? (
                          <span className={lastMsg.senderId !== user?.id && !lastMsg.isRead ? 'font-bold text-foreground' : ''}>
                            {lastMsg.senderId === user?.id ? 'You: ' : ''}{lastMsg.content}
                          </span>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat */}
        <div className="hidden md:flex flex-1 flex-col bg-card">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-card/80 backdrop-blur-sm z-10 sticky top-0 shadow-sm">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                  {getOtherParticipant(activeConversation)?.profile?.avatarUrl ? (
                    <img src={getOtherParticipant(activeConversation)?.profile?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{getOtherParticipant(activeConversation)?.name}</h3>
                  <p className="text-xs text-muted-foreground">{getOtherParticipant(activeConversation)?.email}</p>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm bg-secondary/50 px-4 py-2 rounded-full">This is the start of your conversation.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    const showTime = i === 0 || (new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 5 * 60000);
                    
                    return (
                      <div key={msg.id} className="flex flex-col">
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] font-bold tracking-wider text-white bg-black/80 dark:bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white" />
                              {new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                            isMe 
                              ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm' 
                              : 'bg-cyan-500 text-black rounded-tl-sm border-0'
                          }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 bg-secondary/30 border-border pr-12 focus-visible:ring-black/50 dark:focus-visible:ring-white/50 rounded-full h-12"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim()}
                    className="absolute right-1 top-1 bottom-1 h-10 w-10 rounded-full bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
              <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6 border border-border shadow-inner">
                <MessageSquare className="w-10 h-10 opacity-40 text-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Your Messages</h2>
              <p className="text-sm max-w-xs text-center">Select a conversation from the sidebar to start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
