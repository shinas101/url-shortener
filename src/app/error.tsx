"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global application error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between p-6">
            <header className="w-full max-w-6xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                        <span className="font-bold text-sm">US</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                </Link>
            </header>

            <main className="w-full max-w-md mx-auto my-auto text-center space-y-6">
                <div className="border border-white bg-black p-8 sm:p-10 space-y-6 shadow-2xl">
                    <div className="w-14 h-14 border border-red-800 bg-red-950/40 mx-auto flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs uppercase font-mono tracking-widest text-red-400">Application Error</span>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Something went wrong
                        </h1>
                        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                            An unexpected error occurred while processing your request.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => reset()}
                            className="flex-1 border border-white bg-white text-black py-2.5 px-4 text-xs font-bold hover:bg-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Try Again</span>
                        </button>

                        <Link
                            href="/"
                            className="flex-1 border border-zinc-800 py-2.5 px-4 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition flex items-center justify-center"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="w-full max-w-6xl mx-auto text-center py-2 text-xs text-zinc-500 font-mono">
                &copy; {new Date().getFullYear()} URL Shortener &bull; Created by <a href="https://github.com/shinas101" target="_blank" rel="noreferrer" className="text-zinc-300 hover:underline">shinas101</a>
            </footer>
        </div>
    );
}
