import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar"; // <--- Importando a Navbar

export const runtime = "edge";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ReGift - Unwrap the potential",
    description: "Swap unwanted gifts nearby.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={outfit.className}>
                <main className="min-h-screen bg-background pb-20 sm:pb-0">
                    {children}
                </main>
                <Navbar /> {/* <--- Adicionando a Navbar aqui para aparecer em todas as telas */}
            </body>
        </html>
    );

}
