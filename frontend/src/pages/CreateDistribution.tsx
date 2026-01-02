import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Camera, Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { distributionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CreateDistribution = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, role } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImages(prev => [...prev, ...files].slice(0, 5));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || images.length === 0) {
            toast({
                title: "Missing fields",
                description: "Description and at least one photo are mandatory.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            const data = { title, description };
            await distributionApi.create(data, images);

            toast({
                title: "Impact Posted!",
                description: "Your distribution event is now visible on the feed.",
            });
            navigate('/distribution');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to post event',
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header userType={role || 'ngo'} />

            <main className="flex-1 container py-8 max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/distribution')}
                    className="mb-6 hover:bg-slate-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Feed
                </Button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold">Post Distribution Event</h1>
                        <p className="text-slate-500">Showcase your NGO's impact and book distribution drives</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block text-slate-700">Event Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Annual Book Drive at Saint Joseph High School"
                                    className="border-slate-200 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block text-slate-700">Detailed Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the distribution event, how many students were helped, which books were distributed, etc."
                                    className="w-full h-40 px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5 text-success" />
                                Add Photos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <label className="block">
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-success/50 hover:bg-success/5 transition-all cursor-pointer">
                                    <Upload className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">Click to upload event photos</p>
                                    <p className="text-xs text-slate-400 mt-1">Recommended: Action shots of students receiving books</p>
                                    <p className="text-xs text-slate-400 mt-1 italic">Max 5 photos • JPG, PNG</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-full h-24 object-cover rounded-lg ring-1 ring-slate-200 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button type="submit" size="lg" className="w-full bg-success hover:bg-success/90 h-12 text-lg font-bold" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            'Share Distribution Event'
                        )}
                    </Button>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default CreateDistribution;
