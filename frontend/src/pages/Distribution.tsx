import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/contexts/AuthContext';
import { distributionApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Heart, MessageCircle, Upload, Loader2, Camera, Plus, Trash2 } from 'lucide-react';

const Distribution = () => {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
    const [comments, setComments] = useState<{ [key: string]: any[] }>({});
    const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await distributionApi.list();
            setEvents(data);

            // Trigger comment loading for each event
            data.forEach(ev => loadComments(ev.id));
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load distribution events', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async (eventId: string) => {
        try {
            setLoadingComments(prev => ({ ...prev, [eventId]: true }));
            const data = await distributionApi.getComments(eventId);
            setComments(prev => ({ ...prev, [eventId]: data }));
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setLoadingComments(prev => ({ ...prev, [eventId]: false }));
        }
    };

    const handleLike = async (eventId: string) => {
        if (!user) {
            toast({ title: 'Login Required', description: 'Please log in to like posts' });
            return;
        }
        try {
            const res: any = await distributionApi.toggleLike(eventId);
            setEvents(prev => prev.map(ev => {
                if (ev.id === eventId) {
                    const liked = res.liked;
                    return {
                        ...ev,
                        likes_count: liked ? ev.likes_count + 1 : ev.likes_count - 1,
                        liked_by: liked ? [...(ev.liked_by || []), user.uid] : (ev.liked_by || []).filter((id: string) => id !== user.uid)
                    };
                }
                return ev;
            }));
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to like post', variant: 'destructive' });
        }
    };

    const handleAddComment = async (eventId: string) => {
        const text = commentText[eventId];
        if (!text || !text.trim()) return;
        if (!user) {
            toast({ title: 'Login Required', description: 'Please log in to comment' });
            return;
        }

        try {
            await distributionApi.addComment(eventId, text);
            setCommentText(prev => ({ ...prev, [eventId]: '' }));
            // Reload comments for this event
            await loadComments(eventId);
            setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, comments_count: ev.comments_count + 1 } : ev));
            toast({ title: 'Comment Added' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
        }
    };

    const handleDelete = async (eventId: string) => {
        try {
            await distributionApi.delete(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast({ title: 'Post Deleted' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete post', variant: 'destructive' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header userType={role || 'student'} />

            <main className="flex-1 container py-8 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Book Distribution Feed</h1>
                        <p className="text-slate-500">Celebrating the impact of EduCycle in our community</p>
                    </div>
                    {role === 'ngo' && (
                        <Button onClick={() => navigate('/create-distribution')} className="bg-success hover:bg-success/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Post Impact
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {events.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Camera className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No distribution events posted yet.</p>
                                    {role === 'ngo' && <p className="text-sm text-slate-400 mt-1">Be the first to share your impact!</p>}
                                </CardContent>
                            </Card>
                        ) : (
                            events.map((event) => (
                                <Card key={event.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 flex items-center gap-3 border-b bg-white">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {event.ngo_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{event.ngo_name}</p>
                                            <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            {role === 'ngo' && event.ngo_uid === user?.uid && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This post will be permanently removed from the feed.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                            <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                                                Distribution
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="p-0">
                                        {event.image_urls && event.image_urls.length > 0 && (
                                            <div className="grid grid-cols-1 gap-1">
                                                <img
                                                    src={event.image_urls[0]}
                                                    alt={event.title}
                                                    className="w-full aspect-video object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-5">
                                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                        <p className="text-slate-600 mb-6">{event.description}</p>

                                        {/* Comments Display Section */}
                                        <div className="space-y-4 mb-6 pt-4 border-t border-slate-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comments</p>
                                            {loadingComments[event.id] ? (
                                                <div className="flex py-2"><Loader2 className="h-4 w-4 animate-spin text-slate-300" /></div>
                                            ) : (
                                                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                    {(!comments[event.id] || comments[event.id].length === 0) ? (
                                                        <p className="text-sm text-slate-400 italic">No comments yet. Start the conversation!</p>
                                                    ) : (
                                                        comments[event.id].map((c: any) => (
                                                            <div key={c.id} className="flex gap-2 text-sm items-start">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                    {c.user_name?.charAt(0)}
                                                                </div>
                                                                <div className="bg-slate-50 rounded-2xl px-3 py-2 flex-1">
                                                                    <span className="font-bold mr-2 text-slate-900">{c.user_name}</span>
                                                                    <span className="text-slate-700">{c.text}</span>
                                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                                        {c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                                            <button
                                                onClick={() => handleLike(event.id)}
                                                className={`flex items-center gap-2 group transition-colors ${event.liked_by?.includes(user?.uid) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                                                    }`}
                                            >
                                                <Heart className={`h-5 w-5 ${event.liked_by?.includes(user?.uid) ? 'fill-rose-500' : 'group-hover:scale-110 transition-transform'}`} />
                                                <span className="font-medium">{event.likes_count || 0}</span>
                                            </button>

                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MessageCircle className="h-5 w-5" />
                                                <span className="font-medium">{event.comments_count || 0}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Input
                                                placeholder="Add a comment..."
                                                className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9"
                                                value={commentText[event.id] || ''}
                                                onChange={(e) => setCommentText(prev => ({ ...prev, [event.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(event.id)}
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-primary font-bold hover:bg-primary/5"
                                                onClick={() => handleAddComment(event.id)}
                                            >
                                                Post
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Distribution;
