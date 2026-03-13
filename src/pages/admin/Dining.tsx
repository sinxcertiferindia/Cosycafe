import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Loader2, UploadCloud } from "lucide-react";

export default function AdminDining() {
    const [dining, setDining] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        features: "",
        images: [] as string[],
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDining();
    }, []);

    async function fetchDining() {
        setLoading(true);
        const { data, error } = await supabase.from("dining").select("*").order("created_at", { ascending: false });
        if (error) {
            toast.error("Error fetching dining options: " + error.message);
        } else {
            setDining(data || []);
        }
        setLoading(false);
    }

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({ title: "", description: "", features: "", images: [] });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            description: item.description || "",
            features: item.features ? item.features.join(", ") : "",
            images: item.images || [],
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this dining option?")) return;

        const { error } = await supabase.from("dining").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete dining option: " + error.message);
        } else {
            toast.success("Dining option deleted successfully");
            fetchDining();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('dining')
            .upload(filePath, file);

        if (uploadError) {
            toast.error('Error uploading image: ' + uploadError.message);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('dining').getPublicUrl(filePath);

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.publicUrl]
        }));

        setUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
            images: formData.images,
        };

        let error;
        if (editingId) {
            const { error: updateErr } = await supabase.from("dining").update(payload).eq("id", editingId);
            error = updateErr;
        } else {
            const { error: insertErr } = await supabase.from("dining").insert([payload]);
            error = insertErr;
        }

        if (error) {
            toast.error("Error saving dining option: " + error.message);
        } else {
            toast.success(editingId ? "Dining option updated!" : "Dining option created!");
            setIsDialogOpen(false);
            fetchDining();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dining Management</h2>
                    <p className="text-muted-foreground mt-2">Manage rooftop restaurant and dining areas.</p>
                </div>
                <Button onClick={handleOpenNew} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Dining Option
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Features</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && dining.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : dining.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No dining options found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dining.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.images && item.images.length > 0 ? (
                                                <div className="h-12 w-20 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                                                    <img src={item.images[0]} alt={item.title} className="object-cover h-full w-full" />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-20 rounded bg-slate-200"></div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>{item.features ? item.features.length : 0} features</TableCell>
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
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Dining Option" : "Add New Dining Option"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="features">Features (comma-separated)</Label>
                                <Input id="features" placeholder="Rooftop seating, Fort view, Candlelight dinners" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden group">
                                        <div className="flex items-center gap-2 pointer-events-none">
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                            <span>Upload Image</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                            disabled={uploading}
                                        />
                                    </Button>
                                </div>
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img src={img} alt="" className="w-24 h-24 object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
