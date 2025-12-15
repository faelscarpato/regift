"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MapPin, User, ArrowLeft, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadItem = async () => {
            const { data, error } = await supabase
                .from('items')
                .select(`
                    *,
                    owner:profiles(full_name, avatar_url)
                `)
                .eq('id', params.id)
                .single();
            
            if (data) setItem(data);
            setLoading(false);
        };
        loadItem();
    }, [params.id]);

    const handleInterest = async () => {
        // Aqui simulamos o "Like" direto
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) { router.push('/login'); return; }

        await supabase.from('swipes').insert({
            liker_id: user.id,
            item_id: item.id,
            is_like: true
        });
        
        alert("Interesse registrado! Se ele curtir algo seu, dará Match! 🤞");
        router.push('/');
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!item) return <div className="p-8 text-center">Item não encontrado.</div>;

    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Header Image */}
            <div className="relative h-96 w-full">
                <Link href="/feed" className="absolute top-4 left-4 z-10 bg-white/50 backdrop-blur p-2 rounded-full text-black">
                    <ArrowLeft size={24} />
                </Link>
                <img src={item.photo_url} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            <div className="p-6 -mt-10 relative z-10 bg-white rounded-t-3xl">
                <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{item.title}</h1>
                
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                    <MapPin size={16} />
                    <span>Localização aproximada (Raio de segurança)</span>
                </div>

                {/* Owner Info (Restricted) */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        {item.owner?.avatar_url ? <img src={item.owner.avatar_url} /> : <User className="p-2" />}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Postado por</p>
                        <p className="font-bold text-gray-800">{item.owner?.full_name?.split(' ')[0] || "Usuário"}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2">Sobre o presente</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    <div className="mt-4 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase">
                        Condição: {item.condition === 'new' ? 'Novo' : 'Usado'}
                    </div>
                </div>

                <button 
                    onClick={handleInterest}
                    className="w-full py-4 bg-holiday-red text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-200 hover:scale-[1.02] transition flex items-center justify-center gap-2"
                >
                    <Heart fill="white" /> Tenho Interesse!
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">
                    Ao clicar, o item entrará na sua lista de likes. Se houver reciprocidade, o contato será liberado.
                </p>
            </div>
        </div>
    );
}
