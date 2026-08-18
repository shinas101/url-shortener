"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Lock,
    Unlock,
    KeyRound,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldAlert,
    Sparkles,
    ArrowLeft
} from "lucide-react";

export default function UnlockPage() {
    const params = useParams<{ code: string }>();
    const code = params?.code || "";
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!password.trim()) return;

        setError("");
        setIsVerifying(true);

        try {
            const res = await fetch("/api/verify-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    password: password.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok && data.url) {
                // Redirect directly to the unlocked URL
                window.location.href = data.url;
            } else {
                setError(data.error || "Incorrect password. Please try again.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between p-6">
            {/* Header */}
            <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                        <span className="font-bold text-sm">US</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                </Link>

                <Link
                    href="/"
                    className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Home</span>
                </Link>
            </header>

            {/* Main Center Card */}
            <main className="w-full max-w-md mx-auto my-auto py-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="border border-white bg-black p-8 sm:p-10 space-y-6 shadow-2xl">
                    {/* Icon & Title */}
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 border border-zinc-700 bg-zinc-950 mx-auto flex items-center justify-center shadow-inner">
                            <Lock className="w-6 h-6 text-white" />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                                Protected Link
                            </h1>
                            <p className="text-xs font-mono text-zinc-400">
                                This URL is passcode protected. Enter the key to proceed.
                            </p>
                        </div>

                        {/* Short Code Badge */}
                        <div className="inline-block border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-mono text-zinc-300">
                            /{code}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="border border-red-800 bg-red-950/40 p-3 text-red-400 text-xs font-mono flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                                <KeyRound className="w-3 h-3 text-zinc-400" />
                                Passcode
                            </label>

                            <div className="relative flex items-center border border-zinc-700 bg-zinc-950 focus-within:border-white transition">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoFocus
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter access password"
                                    className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none pr-10 font-mono"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying || !password.trim()}
                            className="w-full border border-white bg-white text-black py-3.5 font-bold hover:bg-zinc-200 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    <span>Unlocking URL...</span>
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    <span>Unlock & Visit ➔</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="pt-2 border-t border-zinc-900 text-center">
                        <p className="text-[11px] text-zinc-600 font-mono flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3 text-zinc-600" />
                            End-to-End Password Protected Redirection
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-5xl mx-auto text-center py-2 text-xs text-zinc-600 font-mono">
                &copy; {new Date().getFullYear()} URL Shortener. All rights reserved.
            </footer>
        </div>
    );
}