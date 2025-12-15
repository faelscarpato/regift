"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Heart, User, LayoutGrid } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    // Não mostra a navbar no login
    if (pathname === "/login") return null;

    const navItemClass = (path: string) => 
        `p-2 flex flex-col items-center transition-colors ${pathname === path ? "text-holiday-red font-bold" : "text-gray-400 hover:text-gray-600"}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-between px-2 items-center h-16 max-w-md mx-auto">
                
                {/* 1. Swipe (Home) */}
                <Link href="/" className={navItemClass("/")}>
                    <Home size={22} />
                    <span className="text-[10px] mt-1">Jogar</span>
                </Link>

                {/* 2. Feed (Vitrine) - NOVO */}
                <Link href="/feed" className={navItemClass("/feed")}>
                    <LayoutGrid size={22} />
                    <span className="text-[10px] mt-1">Vitrine</span>
                </Link>

                {/* 3. Upload (Destaque Central) */}
                <Link href="/upload" className="relative -top-5">
                    <div className="p-3 bg-holiday-green rounded-full text-white shadow-xl border-4 border-white transform transition hover:scale-105 hover:rotate-3 active:scale-95">
                        <Camera size={26} />
                    </div>
                </Link>

                {/* 4. Matches */}
                <Link href="/matches" className={navItemClass("/matches")}>
                    <Heart size={22} />
                    <span className="text-[10px] mt-1">Matches</span>
                </Link>

                {/* 5. Perfil */}
                <Link href="/profile" className={navItemClass("/profile")}>
                    <User size={22} />
                    <span className="text-[10px] mt-1">Perfil</span>
                </Link>
            </div>
        </nav>
    );
}
