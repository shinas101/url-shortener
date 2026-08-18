"use client";

import { authClient } from "@/app/lib/auth-client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
            });
        } catch (error) {
            console.error("Google authentication failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-5 selection:bg-white selection:text-black">
            <div className="w-full max-w-md border border-white bg-black p-8 flex flex-col gap-8 shadow-2xl">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-zinc-400 font-mono">
                        Sign in to access your shortened links, analytics, and settings
                    </p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 border border-white py-3 px-4 text-white hover:bg-white hover:text-black transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group font-medium"
                >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
                </button>

                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-500">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="hover:text-white transition"
                        >
                            ← Return to Home
                        </Link>

                        <Link
                            href="/docs"
                            className="hover:text-white transition"
                        >
                            Documentation ➔
                        </Link>
                    </div>

                    <p className="text-[11px] text-zinc-600 text-center pt-2">
                        Created by <a href="https://github.com/shinas101" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white hover:underline font-semibold">shinas101</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
