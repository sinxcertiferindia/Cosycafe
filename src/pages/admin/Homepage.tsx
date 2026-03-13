import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Loader2, UploadCloud } from "lucide-react";

export default function AdminHomepage() {
    const [loading, setLoading] = useState(false);
    const [uploadingStory, setUploadingStory] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);
    const [data, setData] = useState({
        id: "",
        hero_title: "",
        hero_subtitle: "",
        hero_video_url: "",
        story_title: "",
        story_description: "",
        story_image: "",
        dining_description: "",
    });

    useEffect(() => {
        async function fetchData() {
            const { data: result, error } = await supabase.from("homepage_content").select("*").single();
            if (result) {
                setData(result);
            } else if (error && error.code !== "PGRST116") {
                toast.error("Failed to load homepage data");
            }
        }
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        bucket: string,
        fieldName: string,
        setUploading: (v: boolean) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${fieldName}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (uploadError) {
            toast.error('Upload failed: ' + uploadError.message);
            setUploading(false);
            return;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        setData(prev => ({ ...prev, [fieldName]: data.publicUrl }));
        toast.success('Image uploaded!');
        setUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let error;

        if (data.id) {
            const { error: updateError } = await supabase
                .from("homepage_content")
                .update(data)
                .eq("id", data.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from("homepage_content").insert([data]);
            error = insertError;
        }

        if (error) {
            toast.error("Failed to save changes: " + error.message);
        } else {
            toast.success("Homepage content updated successfully!");
        }

        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Homepage Content</h2>
                <p className="text-muted-foreground mt-2">Manage all text and media for the main landing page.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hero Section</CardTitle>
                        <CardDescription>Main greeting and video</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hero_title">Hero Title</Label>
                            <Input id="hero_title" name="hero_title" value={data.hero_title} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                            <Input id="hero_subtitle" name="hero_subtitle" value={data.hero_subtitle || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hero_video_url">Hero Video URL</Label>
                            <Input id="hero_video_url" name="hero_video_url" type="url" placeholder="https://..." value={data.hero_video_url || ""} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* Story Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Our Story Section</CardTitle>
                        <CardDescription>Text and image for the \"Our Story\" block</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="story_title">Story Title</Label>
                            <Input id="story_title" name="story_title" value={data.story_title || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="story_description">Story Description</Label>
                            <Textarea rows={4} id="story_description" name="story_description" value={data.story_description || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="story_image">Story Image</Label>
                            <div className="flex gap-3 items-center">
                                <Button type="button" variant="outline" className="relative overflow-hidden shrink-0">
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        {uploadingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        <span>{data.story_image ? 'Replace Image' : 'Upload Image'}</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => handleImageUpload(e, 'about', 'story_image', setUploadingStory)}
                                        disabled={uploadingStory}
                                    />
                                </Button>
                                {data.story_image && (
                                    <div className="w-20 h-14 rounded overflow-hidden border shrink-0">
                                        <img src={data.story_image} alt="Story" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {!data.story_image && <span className="text-xs text-muted-foreground">No image uploaded yet</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dining Intro */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dining Intro Section</CardTitle>
                        <CardDescription>Short snippet for the dining feature on homepage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dining_description">Dining Description</Label>
                            <Textarea rows={3} id="dining_description" name="dining_description" value={data.dining_description || ""} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={loading} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? "Saving..." : "Save All Changes"}
                </Button>
            </form>
        </div>
    );
}
