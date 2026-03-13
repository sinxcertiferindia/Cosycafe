import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Loader2, UploadCloud, ChevronUp, ChevronDown } from "lucide-react";

export default function AdminStories() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        content: "",
        cover_image: "",
        gallery_images: [] as string[],
        publish_date: new Date().toISOString().split('T')[0],
    });
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    async function fetchStories() {
        setLoading(true);
        const { data, error } = await supabase.from("travel_stories").select("*").order("created_at", { ascending: false });
        if (error) {
            toast.error("Error fetching stories: " + error.message);
        } else {
            setStories(data || []);
        }
        setLoading(false);
    }

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({
            title: "",
            slug: "",
            description: "",
            content: "",
            cover_image: "",
            gallery_images: [],
            publish_date: new Date().toISOString().split('T')[0],
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            slug: item.slug,
            description: item.description || "",
            content: item.content || "",
            cover_image: item.cover_image || "",
            gallery_images: item.gallery_images || [],
            publish_date: item.publish_date || new Date().toISOString().split('T')[0],
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this story?")) return;

        const { error } = await supabase.from("travel_stories").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete story: " + error.message);
        } else {
            toast.success("Story deleted");
            fetchStories();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(filePath, file);

        if (uploadError) {
            toast.error('Error uploading image: ' + uploadError.message);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('stories').getPublicUrl(filePath);

        setFormData(prev => ({
            ...prev,
            cover_image: data.publicUrl
        }));

        setUploading(false);
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingGallery(true);
        const newImages = [...formData.gallery_images];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `stories/gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(filePath, file);

            if (uploadError) {
                toast.error(`Error uploading gallery image: ${uploadError.message}`);
                continue;
            }

            const { data } = supabase.storage.from('stories').getPublicUrl(filePath);
            newImages.push(data.publicUrl);
        }

        setFormData(prev => ({
            ...prev,
            gallery_images: newImages
        }));
        setUploadingGallery(false);
    };

    const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...formData.gallery_images];
        if (direction === 'up' && index > 0) {
            const temp = newImages[index - 1];
            newImages[index - 1] = newImages[index];
            newImages[index] = temp;
        } else if (direction === 'down' && index < newImages.length - 1) {
            const temp = newImages[index + 1];
            newImages[index + 1] = newImages[index];
            newImages[index] = temp;
        }
        setFormData({ ...formData, gallery_images: newImages });
    };

    const removeGalleryImage = (index: number) => {
        const newImages = [...formData.gallery_images];
        newImages.splice(index, 1);
        setFormData({ ...formData, gallery_images: newImages });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        // Auto-generate slug from title if we are creating a new post
        setFormData(prev => ({
            ...prev,
            title,
            slug: editingId ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData };

        let error;
        if (editingId) {
            const { error: updateErr } = await supabase.from("travel_stories").update(payload).eq("id", editingId);
            error = updateErr;
        } else {
            const { error: insertErr } = await supabase.from("travel_stories").insert([payload]);
            error = insertErr;
        }

        if (error) {
            toast.error("Error saving story: " + error.message);
        } else {
            toast.success(editingId ? "Story updated!" : "Story created!");
            setIsDialogOpen(false);
            fetchStories();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Travel Stories</h2>
                    <p className="text-muted-foreground mt-2">Manage your blog posts and travel stories.</p>
                </div>
                <Button onClick={handleOpenNew} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Story
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cover</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && stories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : stories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No travel stories found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stories.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.cover_image ? (
                                                <div className="h-12 w-20 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                                                    <img src={item.cover_image} alt={item.title} className="object-cover h-full w-full" />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-20 rounded bg-slate-200"></div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>{new Date(item.publish_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right flex justify-end gap-2 mt-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Story" : "Add New Story"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" value={formData.title} onChange={handleTitleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL)</Label>
                                    <Input id="slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="publish_date">Publish Date</Label>
                                    <Input id="publish_date" type="date" value={formData.publish_date} onChange={e => setFormData({ ...formData, publish_date: e.target.value })} />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <Label className="mb-2">Cover Image</Label>
                                    <div className="flex gap-4 items-center h-10 w-full pl-2">
                                        <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden group shrink-0">
                                            <div className="flex items-center gap-2 pointer-events-none">
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                                <span>Upload</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                                disabled={uploading}
                                            />
                                        </Button>
                                        <div className="truncate text-xs px-2 border rounded py-2 w-full">
                                            {formData.cover_image || "No image uploaded"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-base font-semibold">Optional Gallery Images</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden group">
                                        <div className="flex items-center gap-2 pointer-events-none">
                                            {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                            <span>Upload Stories Gallery</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleGalleryUpload}
                                            accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                            multiple
                                            disabled={uploadingGallery}
                                        />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">Select multiple images. Use arrows to reorder.</span>
                                </div>
                                <div className="flex gap-2 flex-wrap mt-4 bg-slate-50 p-4 border rounded-md">
                                    {formData.gallery_images.length === 0 && <span className="text-sm text-slate-500 italic">No gallery images added.</span>}
                                    {formData.gallery_images.map((img, i) => (
                                        <div key={i} className="relative group w-24 h-24 shrink-0 shadow-sm">
                                            <img src={img} alt="" className="w-full h-full object-cover border rounded-md" />
                                            <div className="absolute top-1 left-1 flex gap-1 bg-white/90 rounded-sm shadow-sm opacity-0 group-hover:opacity-100 transition p-0.5">
                                                <button type="button" onClick={() => moveGalleryImage(i, 'up')} disabled={i === 0}>
                                                    <ChevronUp className="w-4 h-4 text-slate-600 hover:text-black" />
                                                </button>
                                                <button type="button" onClick={() => moveGalleryImage(i, 'down')} disabled={i === formData.gallery_images.length - 1}>
                                                    <ChevronDown className="w-4 h-4 text-slate-600 hover:text-black" />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryImage(i)}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Short Description</Label>
                                <Textarea id="description" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Full Content (Markdown/HTML supported)</Label>
                                <Textarea id="content" rows={12} className="font-mono text-sm" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
