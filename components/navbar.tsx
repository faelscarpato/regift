"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Heart, User } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    if (pathname === "/login") return null;

    const navItemClass = (path: string) =>
        `p-2 flex flex-col items-center transition-colors ${pathname === path ? "text-holiday-red font-bold" : "text-gray-400 hover:text-gray-600"}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                <Link href="/" className={navItemClass("/")}>
                    <Home size={24} />
                    <span className="text-[10px] mt-1">Feed</span>
                </Link>

                <Link href="/matches" className={navItemClass("/matches")}>
                    <Heart size={24} />
                    <span className="text-[10px] mt-1">Matches</span>
                </Link>

                {/* Botão de Destaque Central */}
                <Link href="/upload" className="relative -top-6">
                    <div className="p-4 bg-holiday-green rounded-full text-white shadow-xl border-4 border-white transform transition hover:scale-105 hover:rotate-3 active:scale-95">
                        <Camera size={28} />
                    </div>
                </Link>

                <Link href="/profile" className={navItemClass("/profile")}>
                    <User size={24} />
                    <span className="text-[10px] mt-1">Perfil</span>
                </Link>
            </div>
        </nav>
    );
}