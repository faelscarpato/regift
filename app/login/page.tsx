"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Attempt Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.log("Login failed, trying signup...", signInError.message);
            // Attempt Signup if login fails (MVP shortcut)
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: email.split("@")[0],
                        avatar_url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${email}`
                    }
                }
            });

            if (signUpError) {
                alert("Erro: " + (signInError?.message || signUpError?.message));
            } else {
                // Auto login often happens after signup, or check email message
                alert("Conta criada! Verifique se logou ou tente novamente.");
                router.push("/");
            }
        } else {
            router.push("/");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-holiday-red to-red-900">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-holiday-green mb-2">ReGift 🎁</h1>
                    <p className="text-gray-500">Troque o que não usa por algo incrível.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-holiday-green focus:outline-none transition bg-gray-50 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 ml-1">Senha</label>
                        <input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-holiday-green focus:outline-none transition bg-gray-50 text-gray-900"
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-holiday-green text-white font-bold text-lg p-4 rounded-2xl hover:bg-green-800 transition disabled:opacity-70 shadow-lg shadow-green-200"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
                <p className="mt-6 text-center text-xs text-gray-400">
                    Se não tiver conta, criaremos uma automaticamente.
                </p>
            </div>
        </div>
    );
}
