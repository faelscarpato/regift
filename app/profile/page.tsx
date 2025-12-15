"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { MapPin, Save, LogOut, Camera, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form States
    const [fullName, setFullName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [address, setAddress] = useState("");
    const [searchRadius, setSearchRadius] = useState(20000); // Metros
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }
        setUser(user);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setFullName(data.full_name || "");
            setWhatsapp(data.whatsapp || "");
            setAddress(data.address || "");
            setSearchRadius(data.search_radius || 20000);
            setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        const updates = {
            id: user.id,
            full_name: fullName,
            whatsapp,
            address,
            search_radius: searchRadius,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) {
            alert("Erro ao atualizar!");
            console.error(error);
        } else {
            alert("Perfil atualizado com sucesso! 🎅");
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${user.id}_${Math.random()}.${fileExt}`;

        setSaving(true);
        // Upload
        const { error: uploadError } = await supabase.storage.from('items').upload(fileName, file);

        if (uploadError) {
            alert("Erro no upload da imagem");
            setSaving(false);
            return;
        }

        // Get URL
        const { data: { publicUrl } } = supabase.storage.from('items').getPublicUrl(fileName);

        // Update State & DB immediately
        setAvatarUrl(publicUrl);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        setSaving(false);
    };

    const updateLocation = () => {
        if (!navigator.geolocation) return alert("GPS não suportado");

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const { error } = await supabase.from('profiles').update({
                location: `POINT(${longitude} ${latitude})`
            }).eq('id', user.id);

            if (!error) alert("Localização GPS atualizada! 📍");
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) return <div className="p-8 text-center">Carregando perfil...</div>;

    return (
        <div className="p-6 pb-32 max-w-md mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-black text-gray-800 mb-8">Meu Perfil</h1>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <UserIcon size={48} />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-holiday-green text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-green-700 transition">
                        <Camera size={20} />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Form */}
            <div className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                    <input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-holiday-red outline-none"
                        placeholder="Como quer ser chamado?"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp (com DDD)</label>
                    <input
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-holiday-red outline-none"
                        placeholder="11999999999"
                        type="tel"
                    />
                    <p className="text-xs text-gray-400 mt-1">Será usado apenas quando der Match.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Endereço de Troca (Opcional)</label>
                    <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-holiday-red outline-none resize-none h-20"
                        placeholder="Ex: Metrô Santa Cruz ou Rua X..."
                    />
                </div>

                {/* Range Slider Visionário */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">Distância de Busca</label>
                        <span className="text-sm font-bold text-holiday-green bg-green-50 px-2 py-1 rounded-lg">
                            {(searchRadius / 1000).toFixed(0)} km
                        </span>
                    </div>
                    <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="1000"
                        value={searchRadius}
                        onChange={e => setSearchRadius(Number(e.target.value))}
                        className="w-full accent-holiday-red h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Bairro (1km)</span>
                        <span>Cidade (100km)</span>
                    </div>
                </div>

                <button
                    onClick={updateLocation}
                    className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                    <MapPin size={18} /> Atualizar GPS Atual
                </button>

                <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="w-full py-4 bg-holiday-red text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                    {saving ? "Salvando..." : <><Save size={20} /> Salvar Alterações</>}
                </button>
            </div>

            <button
                onClick={handleLogout}
                className="w-full mt-8 py-3 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition"
            >
                <LogOut size={18} /> Sair da Conta
            </button>
        </div>
    );
}