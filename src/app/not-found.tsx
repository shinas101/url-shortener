import Link from "next/link";
import { Link2Off, ArrowLeft, Plus } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between p-6">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                        <span className="font-bold text-sm">US</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                </Link>

                <Link
                    href="/docs"
                    className="text-xs font-mono text-zinc-400 hover:text-white transition"
                >
                    Documentation
                </Link>
            </header>

            {/* Main Center Box */}
            <main className="w-full max-w-md mx-auto my-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="border border-white bg-black p-8 sm:p-10 space-y-6 shadow-2xl">
                    <div className="w-14 h-14 border border-zinc-800 bg-zinc-950 mx-auto flex items-center justify-center">
                        <Link2Off className="w-6 h-6 text-zinc-400" />
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">Error 404</span>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Link Not Found
                        </h1>
                        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                            The short link you followed may have expired, been removed, or does not exist.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Link
                            href="/"
                            className="flex-1 border border-white bg-white text-black py-2.5 px-4 text-xs font-bold hover:bg-zinc-200 transition flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Shorten a URL</span>
                        </Link>

                        <Link
                            href="/dashboard"
                            className="flex-1 border border-zinc-800 py-2.5 px-4 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition flex items-center justify-center gap-1.5"
                        >
                            <span>Dashboard</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono py-2">
                <p>&copy; {new Date().getFullYear()} URL Shortener &bull; Created by <a href="https://github.com/shinas101" target="_blank" rel="noreferrer" className="text-zinc-300 hover:underline">shinas101</a></p>
                <div className="flex items-center gap-6">
                    <Link href="/" className="hover:text-zinc-300 transition">Home</Link>
                    <Link href="/docs" className="hover:text-zinc-300 transition">Docs</Link>
                    <Link href="/dashboard" className="hover:text-zinc-300 transition">Dashboard</Link>
                </div>
            </footer>
        </div>
    );
}
