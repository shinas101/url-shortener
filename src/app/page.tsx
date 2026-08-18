"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { useSession, signOut } from "@/app/lib/auth-client";
import Link from "next/link";
import {
    Copy,
    Check,
    ExternalLink,
    Download,
    Sparkles,
    RotateCcw,
    Lock,
    KeyRound,
    LogOut,
    ArrowRight
} from "lucide-react";

export default function Home() {
    const { data: session } = useSession();

    // Form states
    const [url, setUrl] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isShortening, setIsShortening] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Result states
    const [shortUrl, setShortUrl] = useState("");
    const [shortCode, setShortCode] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [flipped, setFlipped] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleShorten(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!url.trim()) return;

        setErrorMessage("");
        setIsShortening(true);

        try {
            const res = await fetch("/api/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: url.trim(),
                    pass: password ? password.trim() : undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.shortUrl) {
                setShortUrl(data.shortUrl);
                setShortCode(data.shortCode || "link");

                const qrImage = await QRCode.toDataURL(data.shortUrl, {
                    width: 360,
                    margin: 2,
                    color: {
                        dark: "#ffffff",
                        light: "#000000",
                    },
                });
                setQrDataUrl(qrImage);
                setFlipped(true);
            } else {
                setErrorMessage(data.error || "Failed to shorten URL");
            }
        } catch {
            setErrorMessage("Network error. Please try again.");
        } finally {
            setIsShortening(false);
        }
    }

    function handleReset() {
        setFlipped(false);
        setTimeout(() => {
            setUrl("");
            setPassword("");
            setShowPassword(false);
            setShortUrl("");
            setShortCode("");
            setQrDataUrl("");
            setCopied(false);
            setErrorMessage("");
        }, 300);
    }

    async function handleCopy() {
        if (!shortUrl) return;
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                        <span className="font-bold text-sm">US</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                </Link>

                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 border border-white bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition"
                            >
                                <span>Dashboard</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            <button
                                onClick={() => signOut()}
                                className="border border-zinc-800 p-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition"
                            >
                                Sign In
                            </Link>

                            <Link
                                href="/dashboard"
                                className="border border-white bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition"
                            >
                                Dashboard ➔
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* 3D Flip Card */}
            <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
                <div className="[perspective:1200px] w-full max-w-md">
                    <div
                        className={`grid grid-cols-1 w-full duration-700 transition-transform [transform-style:preserve-3d] ${
                            flipped ? "[transform:rotateY(180deg)]" : ""
                        }`}
                    >
                        {/* Front Side: Input Form */}
                        <div
                            className={`col-start-1 row-start-1 w-full border border-white bg-black p-8 flex flex-col justify-between gap-6 shadow-2xl [backface-visibility:hidden] ${
                                flipped ? "pointer-events-none" : ""
                            }`}
                        >
                            <div className="space-y-2 text-center">
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                                    <Sparkles className="w-6 h-6 text-white" />
                                    URL Shortener
                                </h1>
                            </div>

                            {errorMessage && (
                                <div className="border border-red-800 bg-red-950/40 p-3 text-red-400 text-xs font-mono">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleShorten} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                                        Destination URL
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/very-long-url"
                                        className="w-full bg-black border border-white px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-white transition"
                                    />
                                </div>

                                <div>
                                    {!showPassword ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(true)}
                                            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>+ Add Password Protection (Optional)</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-1.5 animate-in fade-in duration-200">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                                                    <KeyRound className="w-3 h-3 text-zinc-400" />
                                                    Passcode
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowPassword(false);
                                                        setPassword("");
                                                    }}
                                                    className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter password to lock URL"
                                                className="w-full bg-zinc-950 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-white transition"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isShortening || !url.trim()}
                                    className="w-full border border-white bg-white text-black py-3.5 font-bold hover:bg-zinc-200 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isShortening ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <span>Shortening...</span>
                                        </>
                                    ) : (
                                        <span>Shorten URL ➔</span>
                                    )}
                                </button>
                            </form>

                            <div className="pt-2 border-t border-zinc-800 text-center">
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    ⚡ Free & Instant &bull; QR Code Included &bull; Real-Time Analytics
                                </p>
                            </div>
                        </div>

                        {/* Back Side: Result & QR */}
                        <div
                            className={`col-start-1 row-start-1 w-full border border-white bg-black p-6 sm:p-8 flex flex-col justify-between items-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl gap-4 ${
                                !flipped ? "pointer-events-none" : ""
                            }`}
                        >
                            <div className="space-y-1">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 text-white" />
                                    Link Ready ✨
                                </h2>
                                <p className="text-xs text-zinc-400 font-mono">
                                    Your shortened URL & QR code are generated
                                </p>
                            </div>

                            {qrDataUrl && (
                                <div className="border border-white bg-black p-3.5 flex flex-col items-center justify-center shadow-lg group relative">
                                    <img
                                        src={qrDataUrl}
                                        alt={`QR code for ${shortUrl}`}
                                        className="w-40 h-40 object-contain"
                                    />
                                </div>
                            )}

                            <div className="w-full border border-zinc-700 bg-zinc-950 p-2.5 break-all text-xs sm:text-sm font-mono text-white select-all">
                                {shortUrl}
                            </div>

                            <div className="flex gap-2.5 w-full">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className={`flex-1 border py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                        copied
                                            ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                                            : "border-zinc-600 text-white hover:bg-white hover:text-black"
                                    }`}
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Copied ✓" : "Copy"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => window.open(shortUrl, "_blank")}
                                    className="flex-1 border border-zinc-600 py-2.5 px-3 text-xs font-medium text-white hover:bg-white hover:text-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open</span>
                                </button>

                                {qrDataUrl && (
                                    <a
                                        href={qrDataUrl}
                                        download={`qrcode-${shortCode}.png`}
                                        className="border border-zinc-600 p-2.5 text-white hover:bg-white hover:text-black transition flex items-center justify-center cursor-pointer"
                                        title="Download QR Code"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition pt-1 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>← Shorten another</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono z-20">
                <p>&copy; {new Date().getFullYear()} URL Shortener. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="hover:text-zinc-300 transition">Dashboard</Link>
                    <Link href="/login" className="hover:text-zinc-300 transition">Account</Link>
                </div>
            </footer>
        </div>
    );
}