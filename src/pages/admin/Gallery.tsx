import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2, Loader2, UploadCloud, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminGallery() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchGallery();
    }, []);

    async function fetchGallery() {
        setLoading(true);
        const { data, error } = await supabase.from("gallery").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: false });
        if (error) {
            toast.error("Error fetching gallery: " + error.message);
        } else {
            setImages(data || []);
        }
        setLoading(false);
    }

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        // First, delete from DB
        const { error: dbError } = await supabase.from("gallery").delete().eq("id", id);
        if (dbError) {
            toast.error("Failed to delete record: " + dbError.message);
            return;
        }

        // Attempt to delete from Storage (optional but good practice)
        try {
            // url example: .../storage/v1/object/public/gallery/filename.jpg
            const urlParts = imageUrl.split('/gallery/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from("gallery").remove([filePath]);
            }
        } catch (e) {
            console.error("Storage cleanup error:", e);
        }

        toast.success("Image deleted successfully");
        fetchGallery();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        // Find highest existing display order
        const maxOrder = images.length > 0 ? Math.max(...images.map(img => img.display_order || 0)) : -1;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(filePath, file);

            if (uploadError) {
                toast.error(`Error uploading image: ${uploadError.message}`);
                continue;
            }

            const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);

            // Save to Database
            const { error: dbError } = await supabase.from("gallery").insert([
                { image_url: data.publicUrl, title: file.name, display_order: maxOrder + 1 + i }
            ]);

            if (dbError) {
                toast.error(`Error saving image record: ${dbError.message}`);
            }
        }

        setUploading(false);
        toast.success("Upload complete!");
        fetchGallery();
    };

    const updateTitle = async (id: string, newTitle: string) => {
        const { error } = await supabase.from("gallery").update({ title: newTitle }).eq("id", id);
        if (error) {
            toast.error("Error updating title: " + error.message);
        } else {
            toast.success("Title updated");
        }
    };

    const moveImage = async (index: number, direction: 'left' | 'right') => {
        const newImages = [...images];
        if (direction === 'left' && index > 0) {
            // Swap display orders
            const currentOrder = newImages[index].display_order || index;
            const prevOrder = newImages[index - 1].display_order || index - 1;

            newImages[index].display_order = prevOrder;
            newImages[index - 1].display_order = currentOrder;

            // Swap positions in array for immediate UI response
            const temp = newImages[index - 1];
            newImages[index - 1] = newImages[index];
            newImages[index] = temp;
        } else if (direction === 'right' && index < newImages.length - 1) {
            const currentOrder = newImages[index].display_order || index;
            const nextOrder = newImages[index + 1].display_order || index + 1;

            newImages[index].display_order = nextOrder;
            newImages[index + 1].display_order = currentOrder;

            // Swap positions
            const temp = newImages[index + 1];
            newImages[index + 1] = newImages[index];
            newImages[index] = temp;
        } else {
            return; // No movement possible
        }

        setImages(newImages);

        // Update DB in background
        const promises = newImages.map((img, i) => {
            // Force consecutive display orders to clean up any gaps
            img.display_order = i;
            return supabase.from("gallery").update({ display_order: i }).eq("id", img.id);
        });

        try {
            await Promise.all(promises);
        } catch (error) {
            console.error("Order save failed", error);
            fetchGallery(); // Re-fetch on failure
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Gallery Management</h2>
                    <p className="text-muted-foreground mt-2">Upload and manage all images shown in the website gallery.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Button asChild className="relative overflow-hidden cursor-pointer gap-2">
                        <div>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            <span>{uploading ? "Uploading..." : "Upload Images"}</span>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={handleFileUpload}
                                accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef"
                                multiple
                                disabled={uploading}
                            />
                        </div>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loading && images.length === 0 ? (
                    <div className="col-span-full h-32 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-muted-foreground bg-white border rounded">
                        No images in the gallery yet. Start by uploading some!
                    </div>
                ) : (
                    images.map((image, i) => (
                        <Card key={image.id} className="overflow-hidden group">
                            <div className="aspect-square relative flex items-center justify-center bg-slate-100">
                                <img src={image.image_url} alt={image.title} className="object-cover w-full h-full" />

                                <div className="absolute top-2 left-2 flex gap-1 bg-white/90 rounded opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shadow">
                                    <button
                                        type="button"
                                        onClick={() => moveImage(i, 'left')}
                                        disabled={i === 0}
                                        className="p-1 disabled:opacity-30 hover:bg-slate-200 rounded"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-slate-700" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveImage(i, 'right')}
                                        disabled={i === images.length - 1}
                                        className="p-1 disabled:opacity-30 hover:bg-slate-200 rounded"
                                    >
                                        <ChevronRight className="w-4 h-4 text-slate-700" />
                                    </button>
                                </div>

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-2 pointer-events-none">
                                    <div className="pointer-events-auto flex flex-col gap-2 w-full mt-auto">
                                        <Input
                                            defaultValue={image.title || ""}
                                            onBlur={(e) => updateTitle(image.id, e.target.value)}
                                            placeholder="Image title (optional)"
                                            className="h-8 text-xs bg-white/90 border-0"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full h-8 text-xs gap-1"
                                            onClick={() => handleDelete(image.id, image.image_url)}
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
