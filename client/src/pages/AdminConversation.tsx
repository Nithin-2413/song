import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, Send, Calendar, Mail, User, Heart, Phone, Package, Sparkles, MapPin } from 'lucide-react';
import backgroundMusic from '@assets/WhatsApp Audio 2025-08-15 at 12.09.54 AM_1755197391594.mp4';

interface Hug {
  id: string;
  Name: string;
  'Email Address': string;
  'Phone Number': number;
  'Recipient\'s Name': string;
  'Type of Message': string;
  Feelings: string;
  Story: string;
  'Specific Details': string;
  'Delivery Type': string;
  Date: string;
  Status: string;
}

interface Reply {
  id: string;
  created_at: string;
  sender_type: string;
  sender_name: string;
  message: string;
  email_sent?: boolean;
  is_read?: boolean;
  email_message_id?: string;
}

const AdminConversation = () => {
  const { id } = useParams();
  const [hug, setHug] = useState<Hug | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [adminName, setAdminName] = useState('CEO-The Written Hug');
  const [sending, setSending] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize background music and finisher header animation
  useEffect(() => {
    // Setup background music
    const setupBackgroundMusic = () => {
      if (audioRef.current) {
        const audio = audioRef.current;
        audio.volume = 0.15;
        audio.loop = true;
        audio.preload = 'auto';
        audio.autoplay = true;
        audio.muted = false;
        
        // Auto-play music with aggressive mobile support
        const playMusic = async () => {
          try {
            await audio.play();
            console.log('Music started automatically');
          } catch (e) {
            console.log('Auto-play prevented, setting up interaction listeners:', e);
            const startOnInteraction = () => {
              audio.play().then(() => {
                console.log('Music started after user interaction');
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
                document.removeEventListener('touchend', startOnInteraction);
                document.removeEventListener('scroll', startOnInteraction);
              }).catch(console.log);
            };
            
            document.addEventListener('click', startOnInteraction, { once: true });
            document.addEventListener('touchstart', startOnInteraction, { once: true });
            document.addEventListener('touchend', startOnInteraction, { once: true });
            document.addEventListener('scroll', startOnInteraction, { once: true });
          }
        };

        // Force immediate play attempt
        const forcePlay = () => {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Music started immediately');
            }).catch(() => {
              console.log('Immediate play blocked, setting up interaction triggers');
            });
          }
        };

        // Try immediate strategies
        forcePlay();
        playMusic();
      }
    };

    setupBackgroundMusic();

    // Initialize finisher header animation
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/finisher-header@1.7.6/dist/finisher-header.es5.min.js';
    script.onload = () => {
      if (window.FinisherHeader) {
        new window.FinisherHeader({
          "count": 100,
          "size": {
            "min": 2,
            "max": 4,
            "pulse": 0.1
          },
          "speed": {
            "x": {
              "min": 0,
              "max": 0.4
            },
            "y": {
              "min": 0,
              "max": 0.7
            }
          },
          "colors": {
            "background": "#ffffff",
            "particles": [
              "#d041c5",
              "#42c0f2",
              "#d27e35",
              "#6a13a1"
            ]
          },
          "blending": "overlay",
          "opacity": {
            "center": 1,
            "edge": 0
          },
          "skew": 0,
          "shapes": [
            "t",
            "s"
          ]
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
      setAuthenticated(true);
    } else {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  useEffect(() => {
    if (id) {
      fetchConversation();
    }
  }, [id]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/getConversation?hugid=${id}`);
      const result = await response.json();
      
      if (result.success) {
        setHug(result.hug);
        setReplies(result.replies);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch conversation",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !id) return;

    setSending(true);
    try {
      const response = await fetch('/api/sendReply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hugid: id,
          message: replyMessage,
          admin_name: adminName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the new reply to the UI immediately
        const newReply: Reply = {
          id: result.reply.id,
          created_at: result.reply.created_at,
          sender_type: 'admin',
          sender_name: adminName,
          message: replyMessage,
          email_sent: true,
          is_read: true,
        };
        setReplies([...replies, newReply]);
        setReplyMessage('');
        
        toast({
          title: "Reply Sent",
          description: "Your reply has been sent to the client via email",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send reply",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (replyId: string) => {
    try {
      const response = await fetch('/api/markEmailRead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyId: replyId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the reply in the UI
        setReplies(replies.map(reply => 
          reply.id === replyId ? { ...reply, is_read: true } : reply
        ));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  if (!authenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background overflow-hidden premium-scroll relative flex items-center justify-center">
        <div className="finisher-header absolute inset-0 w-full h-full" style={{ zIndex: 0 }}></div>
        <div className="relative z-20 text-lg">Loading conversation...</div>
      </div>
    );
  }

  if (!hug) {
    return (
      <div className="min-h-screen bg-background overflow-hidden premium-scroll relative flex items-center justify-center">
        <div className="finisher-header absolute inset-0 w-full h-full" style={{ zIndex: 0 }}></div>
        <div className="relative z-20 text-lg">Conversation not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden premium-scroll relative">
      {/* Background Music */}
      <audio ref={audioRef} preload="auto">
        <source src={backgroundMusic} type="audio/mpeg" />
      </audio>
      
      {/* Animated Background Header */}
      <div className="finisher-header absolute inset-0 w-full h-full" style={{ zIndex: 0 }}></div>
      
      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-32 left-16 animate-float opacity-15">
          <Heart className="w-6 h-6 text-pink-300 fill-current" />
        </div>
        <div className="absolute top-96 right-20 animate-float delay-1000 opacity-20">
          <Heart className="w-4 h-4 text-rose-300 fill-current" />
        </div>
        <div className="absolute top-[400px] left-1/4 animate-float delay-2000 opacity-25">
          <Sparkles className="w-5 h-5 text-purple-300" />
        </div>
        <div className="absolute top-[600px] right-1/3 animate-float delay-3000 opacity-20">
          <MapPin className="w-4 h-4 text-indigo-300" />
        </div>
        <div className="absolute top-[800px] left-1/3 animate-float delay-4000 opacity-15">
          <Mail className="w-5 h-5 text-blue-300" />
        </div>
      </div>

      <div className="relative z-20 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="border-rose-200/50 backdrop-blur-sm hover:bg-rose-50/80 rounded-full" data-testid="link-back-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold great-vibes-font bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Conversation with {hug.Name}
            </h1>
          </div>
        </div>

        {/* Order Details Card */}
        <Card className="mb-8 border-rose-200/30 bg-white/95 backdrop-blur-md shadow-xl">
          <CardHeader className="bg-gradient-to-r from-rose-100/50 to-pink-100/50 border-b border-rose-200/30 backdrop-blur-sm">
            <CardTitle className="flex items-center gap-2 text-rose-800">
              <Heart className="h-5 w-5 text-rose-600" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-rose-50/80 backdrop-blur-sm rounded-lg border border-rose-200/30">
                  <User className="h-5 w-5 text-rose-600" />
                  <div>
                    <Label className="text-sm font-medium text-rose-700">Client Name</Label>
                    <p className="font-semibold text-gray-900" data-testid="text-client-name">{hug.Name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                  <Mail className="h-5 w-5 text-rose-600" />
                  <div>
                    <Label className="text-sm font-medium text-rose-700">Email</Label>
                    <p className="text-gray-900">{hug['Email Address']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                  <Phone className="h-5 w-5 text-rose-600" />
                  <div>
                    <Label className="text-sm font-medium text-rose-700">Phone</Label>
                    <p className="text-gray-900">{hug['Phone Number']}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <div>
                    <Label className="text-sm font-medium text-pink-700">Recipient</Label>
                    <p className="font-semibold text-gray-900">{hug['Recipient\'s Name']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Package className="h-5 w-5 text-pink-600" />
                  <div>
                    <Label className="text-sm font-medium text-pink-700">Message Type</Label>
                    <p className="text-gray-900">{hug['Type of Message']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Package className="h-5 w-5 text-pink-600" />
                  <div>
                    <Label className="text-sm font-medium text-pink-700">Delivery Type</Label>
                    <p className="text-gray-900">{hug['Delivery Type']}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="text-sm font-medium text-purple-700">Date Submitted</Label>
                    <p className="text-gray-900">{new Date(hug.Date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Label className="text-sm font-medium text-purple-700">Status</Label>
                  <div className="mt-2">
                    <Badge 
                      variant={hug.Status === 'New' ? 'default' : 'secondary'}
                      className={hug.Status === 'New' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                    >
                      {hug.Status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                <Label className="text-sm font-medium text-rose-700 mb-2 block">Feelings</Label>
                <p className="text-gray-800 leading-relaxed">{hug.Feelings}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <Label className="text-sm font-medium text-pink-700 mb-2 block">Story</Label>
                <p className="text-gray-800 leading-relaxed">{hug.Story}</p>
              </div>
              {hug['Specific Details'] && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <Label className="text-sm font-medium text-purple-700 mb-2 block">Specific Details</Label>
                  <p className="text-gray-800 leading-relaxed">{hug['Specific Details']}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Thread */}
        <Card className="mb-6 border-rose-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 border-b border-rose-200">
            <CardTitle className="text-rose-800">Conversation History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {replies.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-rose-300 mx-auto mb-4" />
                  <p className="text-rose-500 text-lg">No replies yet</p>
                  <p className="text-rose-400 text-sm">Start the conversation with your client!</p>
                </div>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex ${reply.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm relative ${
                        reply.sender_type === 'admin'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                          : reply.is_read === false
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 border-2 border-blue-300 cursor-pointer hover:from-blue-100 hover:to-blue-150'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                      }`}
                      onClick={() => {
                        if (reply.sender_type === 'client' && reply.is_read === false) {
                          markAsRead(reply.id);
                        }
                      }}
                    >
                      {/* Unread indicator */}
                      {reply.sender_type === 'client' && reply.is_read === false && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      )}
                      
                      <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                        reply.sender_type === 'admin' ? 'text-rose-100' : 'text-gray-600'
                      }`}>
                        <span>{reply.sender_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          reply.sender_type === 'admin' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {reply.sender_type}
                        </span>
                        
                        {/* Email status indicator */}
                        {reply.sender_type === 'admin' && reply.email_sent && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <Mail className="w-3 h-3" />
                            Sent
                          </span>
                        )}
                        
                        {reply.sender_type === 'client' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            <Mail className="w-3 h-3" />
                            Email
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm leading-relaxed">{reply.message}</div>
                      
                      <div className={`text-xs mt-2 flex items-center justify-between ${
                        reply.sender_type === 'admin' ? 'text-rose-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {new Date(reply.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {reply.sender_type === 'client' && (
                          <span className={`text-xs ${reply.is_read ? 'text-green-600' : 'text-red-600 font-medium'}`}>
                            {reply.is_read ? '✓ Read' : '● Unread'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Card className="border-rose-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 border-b border-rose-200">
            <CardTitle className="text-rose-800 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Reply as CEO-The Written Hug
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-rose-700 font-medium">Reply Message</Label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your heartfelt reply here..."
                rows={6}
                className="mt-2 border-rose-200 focus:border-rose-400 focus:ring-rose-400 resize-none"
              />
            </div>
            <Button
              onClick={sendReply}
              disabled={!replyMessage.trim() || sending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending Kabootar...' : 'Send Kabootar to Client'}
            </Button>
            <p className="text-sm text-rose-600 text-center">
              This will send an email notification to the client and update their order status to "Replied"
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};



export default AdminConversation;