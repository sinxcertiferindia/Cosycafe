import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";

const SECTIONS = [
    { section_name: "Hero Section", image_key: "hero_background", description: "Main background image or video for the hero section." },
    { section_name: "Story Section", image_key: "story_image", description: "Image displayed in the Our Story section." },
    { section_name: "Dining Section", image_key: "dining_banner", description: "Hero image for the Dining section." },
    { section_name: "About Page", image_key: "about_image", description: "Main image for the About page." },
    { section_name: "Site Assets", image_key: "site_logo", description: "Logo used across the site." },
    { section_name: "Site Assets", image_key: "footer_bg", description: "Background image for the footer." },
];

export default function AdminSiteImages() {
    const [images, setImages] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchSiteImages();
    }, []);

    const fetchSiteImages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("site_images").select("*");

            if (error) throw error;

            const imageMap: Record<string, any> = {};
            data?.forEach((img) => {
                imageMap[img.image_key] = img;
            });
            setImages(imageMap);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch site images");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, section_name: string, image_key: string) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(image_key);

            const fileExt = file.name.split('.').pop();
            const fileName = `${image_key}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let bucket = "site_assets";
            if (section_name.toLowerCase().includes("hero")) bucket = "hero";
            else if (section_name.toLowerCase().includes("story")) bucket = "about";
            else if (section_name.toLowerCase().includes("dining")) bucket = "dining";

            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const publicUrl = publicUrlData.publicUrl;

            // Update or insert into site_images
            const existing = images[image_key];

            if (existing) {
                const { error: updateError } = await supabase
                    .from("site_images")
                    .update({ image_url: publicUrl })
                    .eq("image_key", image_key);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("site_images")
                    .insert([{ section_name, image_key, image_url: publicUrl }]);
                if (insertError) throw insertError;
            }

            toast.success("Image updated successfully");
            fetchSiteImages();
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (image_key: string) => {
        try {
            const existing = images[image_key];
            if (!existing) return;

            // Notice: we don't necessarily delete from storage here to avoid breaking things if used elsewhere, 
            // but we delete the database reference.
            const { error } = await supabase.from("site_images").delete().eq("image_key", image_key);
            if (error) throw error;

            toast.success("Image removed");
            fetchSiteImages();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove image");
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Site Images Manager</h2>
                <p className="text-muted-foreground mt-2">
                    Manage standalone images and assets used across the website.
                </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {SECTIONS.map((section) => {
                    const currentImage = images[section.image_key];

                    return (
                        <Card key={section.image_key} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <CardTitle className="text-lg">{section.section_name}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                                <div className="text-xs font-mono bg-slate-200 w-fit px-2 py-1 rounded mt-2 text-slate-600">
                                    Key: {section.image_key}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                                <div className="w-full aspect-video bg-slate-100 rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                                    {currentImage?.image_url ? (
                                        currentImage.image_url.endsWith(".mp4") ? (
                                            <video src={currentImage.image_url} className="w-full h-full object-cover" autoPlay muted loop />
                                        ) : (
                                            <img src={currentImage.image_url} alt={section.image_key} className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center gap-2">
                                            <ImageIcon size={32} />
                                            <span className="text-sm">No image</span>
                                        </div>
                                    )}

                                    {uploading === section.image_key && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center flex-col gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <span className="text-xs font-medium text-primary">Uploading...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full flex gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            type="file"
                                            accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.nef,video/mp4"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => handleImageUpload(e, section.section_name, section.image_key)}
                                            disabled={uploading === section.image_key}
                                        />
                                        <Button variant="outline" className="w-full" disabled={uploading === section.image_key}>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {currentImage ? "Replace" : "Upload"}
                                        </Button>
                                    </div>

                                    {currentImage && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDelete(section.image_key)}
                                            disabled={uploading === section.image_key}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
