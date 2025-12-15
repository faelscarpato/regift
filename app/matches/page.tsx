"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface MatchItem {
    title: string;
    photo_url: string;
    owner: {
        whatsapp: string;
    }
}

interface Match {
    id: string;
    user1_id: string;
    user2_id: string;
    item1: MatchItem;
    item2: MatchItem;
}

export default function MatchesPage() {
    const supabase = createClient();
    const [matches, setMatches] = useState<Match[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);

            const { data, error } = await supabase
                .from('matches')
                .select(`
                    id,
                    user1_id,
                    user2_id,
                    item1:items!item1_id(title, photo_url, owner:profiles(whatsapp)),
                    item2:items!item2_id(title, photo_url, owner:profiles(whatsapp))
                `)
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao buscar matches:", error);
            } else if (data) {
                // @ts-ignore - Supabase types complexos, ignorando para MVP
                setMatches(data);
            }
            setLoading(false);
        };

        fetchMatches();
    }, []);

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center text-holiday-red">
            <Loader2 className="animate-spin mr-2" /> Carregando seus matches...
        </div>
    );

    if (matches.length === 0) return (
        <div className="flex flex-col h-[80vh] items-center justify-center p-8 text-center pb-24 text-gray-400">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Sem matches ainda 😢</h2>
            <p>Continue curtindo itens! Quando alguém curtir o seu de volta, aparecerá aqui.</p>
            <Link href="/" className="mt-6 px-6 py-3 bg-holiday-green text-white rounded-full font-bold shadow-lg">
                Voltar para o Feed
            </Link>
        </div>
    );

    return (
        <div className="p-4 pb-24 max-w-md mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-black mb-6 text-holiday-red tracking-tight">Seus Matches 🔥</h1>
            <div className="grid gap-4">
                {matches.map((match) => {
                    const isUser1 = currentUserId === match.user1_id;
                    const myItem = isUser1 ? match.item1 : match.item2;
                    const theirItem = isUser1 ? match.item2 : match.item1;
                    
                    const contactNumber = theirItem.owner?.whatsapp || '5511999999999';
                    const message = `Olá! Dei match no ReGift! Eu tenho "${myItem.title}" e queria trocar pelo seu "${theirItem.title}". Vamos negociar?`;
                    
                    // CORREÇÃO AQUI: removido o 'v' do regex
                    const whatsappLink = `https://wa.me/${contactNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

                    return (
                        <div key={match.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex items-center justify-between relative">
                                <div className="w-[45%] aspect-square rounded-2xl bg-gray-100 overflow-hidden relative">
                                    <img src={myItem.photo_url} className="h-full w-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center font-bold">
                                        VOCÊ
                                    </div>
                                </div>
                                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-10 text-holiday-green font-black text-xl border-4 border-gray-50">
                                    Vs
                                </div>
                                <div className="w-[45%] aspect-square rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-holiday-gold/50">
                                    <img src={theirItem.photo_url} className="h-full w-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-holiday-gold text-white text-[10px] p-1 text-center font-bold">
                                        MATCH
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-sm text-gray-600">
                                    <span className="font-bold text-gray-900">{theirItem.title}</span>
                                </div>
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-full font-bold shadow-md hover:bg-green-600 transition hover:scale-105 active:scale-95"
                                >
                                    <MessageCircle size={20} />
                                    <span>Zap</span>
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
