"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Heart, MapPin, Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface Item {
    id: string;
    title: string;
    photo_url: string;
    description: string;
    condition: string;
    owner_id: string;
}

export default function Home() {
    const supabase = createClient();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchRadius, setSearchRadius] = useState(50000); // Start 50km

    // Framer Motion Values for the top card
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacityLike = useTransform(x, [50, 150], [0, 1]);
    const opacityNope = useTransform(x, [-50, -150], [0, 1]);

    // Background Color interpolation based on swipe
    const bgLike = useTransform(x, [0, 150], ["#ffffff", "#dcfce7"]); // White to Greenish
    const bgNope = useTransform(x, [0, -150], ["#ffffff", "#fee2e2"]); // White to Reddish

    useEffect(() => {
        initFeed();
    }, [searchRadius]);

    const initFeed = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        if (!navigator.geolocation) {
            alert("Geolocalização necessária");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // 1. Atualiza a localização do usuário no banco (igual antes)
                    await supabase.from('profiles').update({
                        location: `POINT(${longitude} ${latitude})`
                    }).eq('id', user.id);

                    // 2. NOVA PARTE: Busca a preferência de raio salva no perfil do usuário
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('search_radius')
                        .eq('id', user.id)
                        .single();

                    // Define o raio: usa o do banco OU 50km se não tiver nada salvo
                    const userRadius = profile?.search_radius || 50000;

                    // Atualiza o estado visual para o slider ficar na posição certa
                    setSearchRadius(userRadius);

                    // 3. Busca os itens usando o raio correto (userRadius)
                    const { data, error } = await supabase.rpc('get_nearby_items', {
                        user_lat: latitude,
                        user_long: longitude,
                        radius_meters: userRadius // <--- AQUI usamos a variável que acabamos de pegar
                    });

                    if (data) setItems(data as Item[]);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            },
            () => setLoading(false)
        );
    };
    const handleDragEnd = async (event: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) {
            await completeSwipe(true);
        } else if (offset < -100 || velocity < -500) {
            await completeSwipe(false);
        }
    };

    const completeSwipe = async (isLike: boolean) => {
        const item = items[0];
        if (!item) return;

        // Remove from list immediately (UI Optimistic)
        setItems(prev => prev.slice(1));

        // Reset motion value for next card
        x.set(0);

        // Database Call
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('swipes').insert({
                liker_id: user.id,
                item_id: item.id,
                is_like: isLike
            });
        }
    };

    // Button controls
    const swipe = (dir: 'left' | 'right') => {
        completeSwipe(dir === 'right');
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center flex-col gap-4 bg-gray-50">
            <div className="relative">
                <div className="absolute inset-0 bg-holiday-green blur-xl opacity-20 animate-pulse rounded-full"></div>
                <Gift size={64} className="text-holiday-red animate-bounce relative z-10" />
            </div>
            <p className="text-gray-500 font-medium animate-pulse">Procurando no trenó...</p>
        </div>
    );

    if (items.length === 0) return (
        <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center gap-6 bg-gradient-to-b from-white to-gray-50">
            <div className="bg-green-100 p-6 rounded-full">
                <Gift size={64} className="text-holiday-green" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">Zerou o Natal! 🎅</h2>
                <p className="text-gray-500 text-lg">Não há mais itens novos por perto.</p>
            </div>
            <button
                onClick={() => setSearchRadius(prev => prev * 2)}
                className="bg-holiday-red text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
                <MapPin size={20} />
                Expandir para {searchRadius * 2 / 1000}km
            </button>
        </div>
    );

    return (
        <div className="h-[calc(100vh-64px)] w-full relative overflow-hidden bg-gray-100 dark:bg-slate-900 flex flex-col justify-center items-center">

            <div className="relative w-full max-w-sm aspect-[3/4] z-10">
                <AnimatePresence>
                    {items.map((item, index) => {
                        const isTop = index === 0;
                        if (index > 1) return null; // Render only top 2 cards for performance

                        return (
                            <motion.div
                                key={item.id}
                                style={{
                                    x: isTop ? x : 0,
                                    rotate: isTop ? rotate : 0,
                                    zIndex: items.length - index,
                                    scale: isTop ? 1 : 0.95,
                                    y: isTop ? 0 : 20,
                                    opacity: isTop ? 1 : 0.5
                                }}
                                drag={isTop ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={handleDragEnd}
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5, y: isTop ? 0 : 20 }}
                                exit={{ x: isTop ? (x.get() < 0 ? -500 : 500) : 0, opacity: 0, transition: { duration: 0.2 } }}
                                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden cursor-grab active:cursor-grabbing origin-bottom"
                            >
                                {/* LIKE/NOPE Overlays */}
                                {isTop && (
                                    <>
                                        <motion.div style={{ opacity: opacityLike }} className="absolute top-8 left-8 z-20 transform -rotate-12 border-4 border-green-500 text-green-500 rounded-xl px-4 py-2 font-black text-4xl uppercase tracking-widest bg-white/20 backdrop-blur-sm">
                                            AMEI
                                        </motion.div>
                                        <motion.div style={{ opacity: opacityNope }} className="absolute top-8 right-8 z-20 transform rotate-12 border-4 border-red-500 text-red-500 rounded-xl px-4 py-2 font-black text-4xl uppercase tracking-widest bg-white/20 backdrop-blur-sm">
                                            PASSO
                                        </motion.div>
                                    </>
                                )}

                                {/* Image */}
                                <div className="h-3/4 w-full relative bg-gray-200">
                                    <img src={item.photo_url} className="h-full w-full object-cover pointer-events-none" draggable="false" alt={item.title} />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-24 text-white">
                                        <h2 className="text-3xl font-bold leading-tight drop-shadow-md">{item.title}</h2>
                                        <div className="flex items-center text-sm opacity-90 mt-1">
                                            <MapPin size={16} className="mr-1 text-holiday-gold" />
                                            <span className="text-holiday-gold font-medium">Próximo a você</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="h-1/4 p-6 flex flex-col justify-start dark:text-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.condition === 'new' ? 'Novo' : 'Usado'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Controls */}
            {items.length > 0 && (
                <div className="flex items-center justify-center gap-6 mt-8 z-20">
                    <button
                        onClick={() => swipe('left')}
                        className="h-14 w-14 bg-white dark:bg-slate-800 rounded-full shadow-lg text-red-500 border border-gray-100 dark:border-slate-700 flex items-center justify-center hover:scale-110 active:scale-90 transition duration-200"
                    >
                        <X size={28} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => swipe('right')}
                        className="h-14 w-14 bg-holiday-green rounded-full shadow-lg shadow-green-200/50 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition duration-200"
                    >
                        <Heart size={28} fill="currentColor" strokeWidth={0} />
                    </button>
                </div>
            )}
        </div>
    );
}
