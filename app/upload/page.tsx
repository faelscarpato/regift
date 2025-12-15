"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, X } from "lucide-react";

export default function UploadPage() {
    const supabase = createClient();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [condition, setCondition] = useState<"new" | "used">("new");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;
        setUploading(true);

        try {
            // CORREÇÃO: Verificamos o usuário ANTES de tentar o upload
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Se não estiver logado, redireciona e para tudo
                router.push("/login");
                return;
            };

            // 1. Upload Image (Agora seguro)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('items')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('items')
                .getPublicUrl(fileName);

            // 3. Get User Location (Snapshot)
            const location = await new Promise<{ lat: number, lng: number } | null>((resolve) => {
                if (!navigator.geolocation) { resolve(null); return; }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => { console.error(err); resolve(null); }
                )
            });

            if (!location) {
                alert("Precisamos da sua localização para publicar!");
                setUploading(false);
                return;
            }

            // 4. Insert Item (Usando o ID do usuário que já pegamos no início)
            const { error: insertError } = await supabase
                .from('items')
                .insert({
                    owner_id: user.id,
                    title,
                    description,
                    condition,
                    photo_url: publicUrl,
                    // PostGIS format: POINT(lng lat)
                    location: `POINT(${location.lng} ${location.lat})`
                });

            if (insertError) throw insertError;

            router.push("/");

        } catch (error: any) {
            console.error(error); // Bom para debug no console
            alert("Erro ao publicar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 pb-24 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-holiday-red">Anunciar Presente</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                        required
                    />
                    <label
                        htmlFor="photo-upload"
                        className={`block w-full aspect-square rounded-2xl border-4 border-dashed flex items-center justify-center cursor-pointer transition overflow-hidden relative ${previewUrl ? 'border-transparent' : 'border-gray-300 hover:border-holiday-green bg-gray-50'}`}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <UploadIcon size={48} className="mx-auto mb-2" />
                                <span className="font-semibold">Tirar Foto</span>
                            </div>
                        )}
                    </label>
                    {previewUrl && (
                        <button type="button" onClick={() => { setFile(null); setPreviewUrl(null) }} className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-red-500 shadow-md backdrop-blur-sm z-10">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Fields */}
                <input
                    type="text"
                    placeholder="O que é isso?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-holiday-green outline-none font-bold text-lg"
                    required
                />

                <textarea
                    placeholder="Descreva o item (motivo da troca, estado, etc)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-holiday-green outline-none h-32 resize-none"
                    required
                />

                <div className="flex gap-4">
                    <button type="button" onClick={() => setCondition("new")} className={`flex-1 p-3 rounded-xl font-bold border-2 transition ${condition === 'new' ? 'border-holiday-green bg-green-50 text-holiday-green' : 'border-gray-200 text-gray-400'}`}>
                        Novo
                    </button>
                    <button type="button" onClick={() => setCondition("used")} className={`flex-1 p-3 rounded-xl font-bold border-2 transition ${condition === 'used' ? 'border-holiday-green bg-green-50 text-holiday-green' : 'border-gray-200 text-gray-400'}`}>
                        Usado
                    </button>
                </div>

                <button disabled={uploading} className="w-full bg-holiday-green text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 disabled:opacity-50 hover:scale-[1.02] transition">
                    {uploading ? "Publicando..." : "Publicar"}
                </button>
            </form>
        </div>
    )
}
