import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Loader2, UploadCloud, ChevronUp, ChevronDown } from "lucide-react";

export default function AdminRooms() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        features: "", // Comma-separated internally, text input
        price: "",
        images: [] as { url: string; id?: string }[], // Track images with URLs
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    async function fetchRooms() {
        setLoading(true);
        const { data, error } = await supabase
            .from("rooms")
            .select("*, room_images(id, image_url, display_order)")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Error fetching rooms: " + error.message);
        } else {
            // Sort images by display_order
            const processedRooms = data?.map(room => ({
                ...room,
                room_images: room.room_images ? room.room_images.sort((a: any, b: any) => a.display_order - b.display_order) : []
            })) || [];
            setRooms(processedRooms);
        }
        setLoading(false);
    }

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({ name: "", description: "", features: "", price: "", images: [] });
        setIsDialogOpen(true);
    };

    const handleEdit = (room: any) => {
        setEditingId(room.id);
        const mappedImages = room.room_images ? room.room_images.map((img: any) => ({ url: img.image_url, id: img.id })) : [];
        setFormData({
            name: room.name,
            description: room.description || "",
            features: room.features ? room.features.join(", ") : "",
            price: room.price || "",
            images: mappedImages,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this room?")) return;

        const { error } = await supabase.from("rooms").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete room: " + error.message);
        } else {
            toast.success("Room deleted successfully");
            fetchRooms();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages = [...formData.images];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `rooms/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('rooms')
                .upload(filePath, file);

            if (uploadError) {
                toast.error('Error uploading image: ' + uploadError.message);
                continue;
            }

            const { data } = supabase.storage.from('rooms').getPublicUrl(filePath);
            newImages.push({ url: data.publicUrl });
        }

        setFormData(prev => ({
            ...prev,
            images: newImages
        }));

        setUploading(false);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...formData.images];
        if (direction === 'up' && index > 0) {
            const temp = newImages[index - 1];
            newImages[index - 1] = newImages[index];
            newImages[index] = temp;
        } else if (direction === 'down' && index < newImages.length - 1) {
            const temp = newImages[index + 1];
            newImages[index + 1] = newImages[index];
            newImages[index] = temp;
        }
        setFormData({ ...formData, images: newImages });
    };

    const removeImage = (index: number) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            description: formData.description,
            features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
            price: formData.price ? parseFloat(formData.price) : null,
        };

        let roomId = editingId;

        // 1. Save or Update Room
        if (roomId) {
            const { error: updateErr } = await supabase.from("rooms").update(payload).eq("id", roomId);
            if (updateErr) {
                toast.error("Error updating room: " + updateErr.message);
                setLoading(false);
                return;
            }
        } else {
            const { data: newRoom, error: insertErr } = await supabase.from("rooms").insert([payload]).select().single();
            if (insertErr) {
                toast.error("Error creating room: " + insertErr.message);
                setLoading(false);
                return;
            }
            roomId = newRoom.id;
        }

        // 2. Clear old room images
        const { error: deleteImagesError } = await supabase.from("room_images").delete().eq("room_id", roomId);
        if (deleteImagesError) {
            console.error("Failed to clear old images:", deleteImagesError);
        }

        // 3. Insert new images mapped with updated display orders
        if (formData.images.length > 0) {
            const formattedImages = formData.images.map((img, idx) => ({
                room_id: roomId,
                image_url: img.url,
                display_order: idx
            }));
            const { error: insertImagesErr } = await supabase.from("room_images").insert(formattedImages);
            if (insertImagesErr) {
                toast.error("Error saving room images: " + insertImagesErr.message);
            }
        }

        toast.success(editingId ? "Room updated!" : "Room created!");
        setIsDialogOpen(false);
        fetchRooms();
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Rooms Management</h2>
                    <p className="text-muted-foreground mt-2">Add, edit, and delete property rooms.</p>
                </div>
                <Button onClick={handleOpenNew} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Room
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No rooms found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rooms.map((room) => (
                                    <TableRow key={room.id}>
                                        <TableCell>
                                            {room.room_images && room.room_images.length > 0 ? (
                                                <div className="h-12 w-20 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                                                    <img src={room.room_images[0]?.image_url} alt={room.name} className="object-cover h-full w-full" />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-20 rounded bg-slate-200 flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{room.name}</TableCell>
                                        <TableCell>{room.price ? `₹${room.price}` : "N/A"}</TableCell>
                                        <TableCell className="text-right flex justify-end gap-2 mt-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEdit(room)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(room.id)} className="text-destructive">
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Room" : "Add New Room"}</DialogTitle>
                        <DialogDescription>Fill out the details below.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Room Name</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="features">Features (comma-separated)</Label>
                                <Input id="features" placeholder="AC, WiFi, Fort View" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input id="price" type="number" placeholder="4500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label className="text-base font-semibold">Gallery Images</Label>
                            <div className="flex items-center gap-4 mt-2">
                                <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden group">
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        <span>Upload Images</span>
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                        multiple
                                        disabled={uploading}
                                    />
                                </Button>
                                <span className="text-xs text-muted-foreground">Select multiple images at once. Use arrows to reorder.</span>
                            </div>
                            <div className="flex gap-2 flex-wrap mt-4 bg-slate-50 p-4 border rounded-md">
                                {formData.images.length === 0 && <span className="text-sm text-slate-500 italic">No images added yet.</span>}
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative group w-24 h-24 shrink-0 shadow-sm">
                                        <img src={img.url} alt="" className="w-full h-full object-cover border rounded-md" />
                                        <div className="absolute top-1 left-1 flex gap-1 bg-white/90 rounded-sm shadow-sm opacity-0 group-hover:opacity-100 transition p-0.5">
                                            <button type="button" onClick={() => moveImage(i, 'up')} disabled={i === 0}>
                                                <ChevronUp className="w-4 h-4 text-slate-600 hover:text-black" />
                                            </button>
                                            <button type="button" onClick={() => moveImage(i, 'down')} disabled={i === formData.images.length - 1}>
                                                <ChevronDown className="w-4 h-4 text-slate-600 hover:text-black" />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="mt-8 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Room
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
