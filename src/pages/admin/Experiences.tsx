import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Pencil, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Experience {
    id: string;
    title: string;
    description: string;
    image_url: string;
    display_order: number;
}

export default function Experiences() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [displayOrder, setDisplayOrder] = useState("0");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("experiences").select("*").order("display_order", { ascending: true });
            if (error) throw error;
            setExperiences(data || []);
        } catch (error: any) {
            toast.error("Failed to load experiences: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (experience?: Experience) => {
        if (experience) {
            setEditingExperience(experience);
            setTitle(experience.title);
            setDescription(experience.description || "");
            setImagePreview(experience.image_url || "");
            setDisplayOrder(experience.display_order?.toString() || "0");
            setImageFile(null);
        } else {
            setEditingExperience(null);
            setTitle("");
            setDescription("");
            setImagePreview("");
            setImageFile(null);
            setDisplayOrder("0");
        }
        setIsDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!title || (!imageFile && !imagePreview)) {
                throw new Error("Title and Image are required.");
            }

            let imageUrl = imagePreview;

            // Ensure experiences bucket exists
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage.from("experiences").upload(filePath, imageFile);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from("experiences").getPublicUrl(filePath);
                imageUrl = publicUrlData.publicUrl;
            }

            const experienceData = {
                title,
                description,
                image_url: imageUrl,
                display_order: parseInt(displayOrder) || 0,
            };

            if (editingExperience) {
                const { error } = await supabase.from("experiences").update(experienceData).eq("id", editingExperience.id);
                if (error) throw error;
                toast.success("Experience updated successfully");
            } else {
                const { error } = await supabase.from("experiences").insert([experienceData]);
                if (error) throw error;
                toast.success("Experience added successfully");
            }

            setIsDialogOpen(false);
            fetchExperiences();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!window.confirm("Are you sure you want to delete this experience?")) return;

        try {
            const { error } = await supabase.from("experiences").delete().eq("id", id);
            if (error) throw error;

            toast.success("Experience deleted");
            fetchExperiences();
        } catch (error: any) {
            toast.error("Failed to delete experience: " + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Curated Experiences</h2>
                    <p className="text-muted-foreground mt-2">Manage experiences offered at the guest house.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Experience
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingExperience ? "Edit Experience" : "Add Experience"}</DialogTitle>
                            <DialogDescription>
                                Fill in the details for the experience offering.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="image">Experience Image</Label>
                                <div className="flex items-center gap-4">
                                    {imagePreview ? (
                                        <div className="relative w-24 h-24 rounded overflow-hidden border">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
                                            <ImagePlus className="h-6 w-6 mb-1" />
                                            <span className="text-xs">Upload</span>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input id="image" type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef" onChange={handleImageChange} />
                                        <p className="text-xs text-muted-foreground mt-2">Recommended: 4:5 aspect ratio (e.g. 800x1000px)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rooftop Dining" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Experience description..." rows={3} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input id="order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} min={0} />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {editingExperience ? "Update" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {experiences.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No experiences found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                experiences.map((exp) => (
                                    <TableRow key={exp.id}>
                                        <TableCell>
                                            <div className="w-16 h-16 rounded overflow-hidden">
                                                <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{exp.title}</TableCell>
                                        <TableCell>{exp.display_order}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(exp)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDelete(exp.id, exp.image_url)}>
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
        </div>
    );
}
