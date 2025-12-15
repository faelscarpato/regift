"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function FeedPage() {
    const supabase = createClient();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchFeed = async () => {
            const { data } = await supabase
                .from('items')
                .select('id, title, photo_url, created_at')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (data) setItems(data);
        };
        fetchFeed();
    }, []);

    return (
        <div className="p-4 pb-24 max-w-md mx-auto min-h-screen bg-gray-50">
            <h1 className="text-2xl font-black mb-6 text-gray-800">Recém Chegados 🎄</h1>
            
            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                    <Link key={item.id} href={`/item/${item.id}`}>
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="aspect-square bg-gray-200 relative">
                                <img src={item.photo_url} className="w-full h-full object-cover" />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                    Novo
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                                <p className="text-xs text-gray-400 mt-1">Ver detalhes</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
