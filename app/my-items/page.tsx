"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trash2, CheckCircle, EyeOff } from "lucide-react";
import Link from "next/link";

export default function MyItemsPage() {
    const supabase = createClient();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('owner_id', user.id)
            .neq('status', 'deleted') // Não mostra os excluídos
            .order('created_at', { ascending: false });

        if (data) setItems(data);
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('items')
            .update({ status: newStatus, is_active: newStatus === 'available' })
            .eq('id', id);

        if (!error) {
            loadItems(); // Recarrega a lista
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando estoque...</div>;

    return (
        <div className="p-4 pb-24 max-w-md mx-auto min-h-screen bg-gray-50">
            <h1 className="text-2xl font-black mb-6 text-gray-800">Meus Presentes 🎁</h1>
            
            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex gap-4 ${item.status === 'swapped' ? 'opacity-60 grayscale' : 'border-gray-100'}`}>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                            <img src={item.photo_url} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-grow flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.title}</h3>
                                <p className="text-xs text-gray-500 uppercase font-bold mt-1">
                                    {item.status === 'available' ? <span className="text-green-600">Ativo</span> : <span className="text-gray-500">Trocado</span>}
                                </p>
                            </div>

                            {item.status === 'available' && (
                                <div className="flex justify-end gap-3 mt-2">
                                    <button 
                                        onClick={() => updateStatus(item.id, 'deleted')}
                                        className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(item.id, 'swapped')}
                                        className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 hover:bg-green-200"
                                    >
                                        <CheckCircle size={14} /> Já Troquei
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
                          }
