"use client";

import { useSession, signOut } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
    Link2,
    Copy,
    Check,
    QrCode,
    ExternalLink,
    Trash2,
    Lock,
    Eye,
    Plus,
    Search,
    LogOut,
    Clock,
    Sparkles,
    Shield,
    BarChart3,
    X,
    Calendar,
    KeyRound,
    Globe,
    Laptop,
    Smartphone,
    Tablet,
    Activity,
    ArrowUpRight,
    Compass,
    TrendingUp,
    RefreshCw
} from "lucide-react";

interface LinkItem {
    id: string;
    shortCode: string;
    originalUrl: string;
    hasPassword: boolean;
    createdAt: string;
    expireAt: string | null;
    clicks: number;
}

interface AnalyticsData {
    summary: {
        totalLinks: number;
        totalClicks: number;
        todayClicks: number;
        last7DaysClicks: number;
    };
    timeSeries: { date: string; count: number }[];
    devices: { device: string; count: number }[];
    os: { os: string; count: number }[];
    referrers: { referer: string; count: number }[];
    countries: { country: string; count: number }[];
    topLinks: { id: string; shortCode: string; originalUrl: string; clicks: number }[];
}

interface LinkDetailAnalytics {
    link: {
        id: string;
        shortCode: string;
        originalUrl: string;
        createdAt: string;
        hasPassword: boolean;
        expireAt: string | null;
    };
    totalClicks: number;
    todayClicks: number;
    timeSeries: { date: string; count: number }[];
    devices: { device: string; count: number }[];
    os: { os: string; count: number }[];
    referrers: { referer: string; count: number }[];
    countries: { country: string; count: number }[];
    recentClicks: {
        id: string;
        createdAt: string;
        device: string | null;
        os: string | null;
        referer: string | null;
        country: string | null;
    }[];
}

export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    // Tab State: "links" | "analytics"
    const [activeTab, setActiveTab] = useState<"links" | "analytics">("links");

    // Links Data states
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Global Analytics Data states
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Per-Link Detailed Analytics Modal state
    const [selectedLinkForAnalytics, setSelectedLinkForAnalytics] = useState<string | null>(null);
    const [linkAnalyticsData, setLinkAnalyticsData] = useState<LinkDetailAnalytics | null>(null);
    const [loadingLinkAnalytics, setLoadingLinkAnalytics] = useState(false);

    // Create Link Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [longUrl, setLongUrl] = useState("");
    const [customCode, setCustomCode] = useState("");
    const [password, setPassword] = useState("");
    const [expireDate, setExpireDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Interactive states
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [qrModalData, setQrModalData] = useState<{ url: string; code: string; qrUrl: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Redirect if unauthenticated
    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    // Fetch user links
    const fetchLinks = async () => {
        try {
            const res = await fetch("/api/user/links");
            if (res.ok) {
                const data = await res.json();
                setLinks(data.links || []);
            }
        } catch (err) {
            console.error("Failed to load links:", err);
        } finally {
            setLoadingLinks(false);
        }
    };

    // Fetch Global Analytics
    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await fetch("/api/user/analytics");
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (err) {
            console.error("Failed to load analytics:", err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // Fetch Per-Link Analytics
    const fetchLinkAnalytics = async (linkId: string) => {
        setSelectedLinkForAnalytics(linkId);
        setLoadingLinkAnalytics(true);
        setLinkAnalyticsData(null);
        try {
            const res = await fetch(`/api/user/links/${linkId}/analytics`);
            if (res.ok) {
                const data = await res.json();
                setLinkAnalyticsData(data);
            }
        } catch (err) {
            console.error("Failed to load link analytics:", err);
        } finally {
            setLoadingLinkAnalytics(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchLinks();
        }
    }, [session]);

    useEffect(() => {
        if (activeTab === "analytics" && session?.user) {
            fetchAnalytics();
        }
    }, [activeTab, session]);

    // Computed Quick Stats from links list
    const stats = useMemo(() => {
        const totalLinks = links.length;
        const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
        const protectedLinks = links.filter((link) => link.hasPassword).length;
        return { totalLinks, totalClicks, protectedLinks };
    }, [links]);

    // Filtered links by search
    const filteredLinks = useMemo(() => {
        if (!searchQuery.trim()) return links;
        const q = searchQuery.toLowerCase();
        return links.filter(
            (link) =>
                link.shortCode.toLowerCase().includes(q) ||
                link.originalUrl.toLowerCase().includes(q)
        );
    }, [links, searchQuery]);

    // Handle Copy
    const handleCopy = async (id: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Handle QR Modal
    const handleShowQR = async (link: LinkItem) => {
        const fullShortUrl = `${window.location.origin}/${link.shortCode}`;
        try {
            const qrDataUrl = await QRCode.toDataURL(fullShortUrl, {
                width: 320,
                margin: 2,
                color: {
                    dark: "#ffffff",
                    light: "#000000",
                },
            });
            setQrModalData({
                url: fullShortUrl,
                code: link.shortCode,
                qrUrl: qrDataUrl,
            });
        } catch (err) {
            console.error("Failed to generate QR code:", err);
        }
    };

    // Handle Create Link
    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/user/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: longUrl,
                    customCode: customCode || undefined,
                    password: password || undefined,
                    expireAt: expireDate ? new Date(expireDate).toISOString() : undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setFormError(data.error || "Failed to shorten link");
            } else {
                setLongUrl("");
                setCustomCode("");
                setPassword("");
                setExpireDate("");
                setIsCreateOpen(false);
                fetchLinks();
                if (activeTab === "analytics") fetchAnalytics();
            }
        } catch {
            setFormError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete
    const handleDeleteLink = async (id: string) => {
        if (!confirm("Are you sure you want to delete this shortened link?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/user/links?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setLinks((prev) => prev.filter((l) => l.id !== id));
                if (activeTab === "analytics") fetchAnalytics();
            }
        } catch (err) {
            console.error("Failed to delete link:", err);
        } finally {
            setDeletingId(null);
        }
    };

    // Loading Screen
    if (isPending || !session) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-zinc-400">Loading Dashboard...</p>
            </div>
        );
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                            <span className="font-bold text-sm">US</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 border border-zinc-800 px-3 py-1.5 bg-zinc-950">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name}
                                    className="w-6 h-6 rounded-full border border-zinc-700"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                    {session.user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <div className="text-left leading-tight">
                                <p className="text-xs font-medium text-white">{session.user.name}</p>
                                <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut().then(() => router.push("/login"))}
                            className="flex items-center gap-2 border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition cursor-pointer"
                            title="Log Out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Log Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                {/* Hero / Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-zinc-400 mt-1 font-mono">
                            Manage links, track traffic patterns, and analyze real-time engagement.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tab Switcher */}
                        <div className="flex border border-zinc-800 bg-zinc-950 p-1">
                            <button
                                onClick={() => setActiveTab("links")}
                                className={`px-4 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === "links"
                                        ? "bg-white text-black font-bold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <Link2 className="w-3.5 h-3.5" />
                                <span>Links</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`px-4 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === "analytics"
                                        ? "bg-white text-black font-bold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Analytics</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center justify-center gap-2 border border-white bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition cursor-pointer shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Link</span>
                        </button>
                    </div>
                </div>

                {/* ================= TAB 1: LINKS MANAGEMENT ================= */}
                {activeTab === "links" && (
                    <div className="space-y-8 animate-in fade-in duration-200">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-zinc-400">
                                    <span className="text-xs uppercase tracking-wider font-mono">Total Links</span>
                                    <Link2 className="w-4 h-4 text-zinc-500" />
                                </div>
                                <p className="text-3xl font-bold mt-4 font-mono">{stats.totalLinks}</p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-zinc-400">
                                    <span className="text-xs uppercase tracking-wider font-mono">Total Clicks</span>
                                    <BarChart3 className="w-4 h-4 text-zinc-500" />
                                </div>
                                <p className="text-3xl font-bold mt-4 font-mono">{stats.totalClicks}</p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-zinc-400">
                                    <span className="text-xs uppercase tracking-wider font-mono">Password Protected</span>
                                    <Shield className="w-4 h-4 text-zinc-500" />
                                </div>
                                <p className="text-3xl font-bold mt-4 font-mono">{stats.protectedLinks}</p>
                            </div>
                        </div>

                        {/* Links Management Section */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold tracking-tight">Your Short Links</h2>

                                {/* Search Input */}
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search links..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition"
                                    />
                                </div>
                            </div>

                            {/* Links List */}
                            {loadingLinks ? (
                                <div className="border border-zinc-800 p-12 text-center text-zinc-500 font-mono text-xs">
                                    Fetching links...
                                </div>
                            ) : filteredLinks.length === 0 ? (
                                <div className="border border-zinc-800 bg-zinc-950/50 p-12 text-center space-y-4">
                                    <div className="w-12 h-12 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                                        <Link2 className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-medium text-white">No shortened links found</h3>
                                        <p className="text-xs text-zinc-400">
                                            {searchQuery ? "Try searching for a different term." : "Create your first short link to get started!"}
                                        </p>
                                    </div>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => setIsCreateOpen(true)}
                                            className="border border-white py-2 px-4 text-xs font-medium text-white hover:bg-white hover:text-black transition cursor-pointer"
                                        >
                                            + Create Short Link
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredLinks.map((link) => {
                                        const fullUrl = `${origin}/${link.shortCode}`;
                                        const isCopied = copiedId === link.id;

                                        return (
                                            <div
                                                key={link.id}
                                                className="border border-zinc-800 bg-zinc-950 hover:border-zinc-700 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition group"
                                            >
                                                {/* Link Info */}
                                                <div className="space-y-2 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <a
                                                            href={fullUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-mono text-base font-bold text-white hover:underline flex items-center gap-1.5"
                                                        >
                                                            <span>/{link.shortCode}</span>
                                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                                                        </a>

                                                        {/* Badges */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => fetchLinkAnalytics(link.id)}
                                                                className="flex items-center gap-1 text-[11px] font-mono border border-zinc-700 bg-zinc-900 hover:border-white hover:bg-zinc-800 px-2 py-0.5 text-zinc-200 transition cursor-pointer"
                                                                title="View Detailed Analytics"
                                                            >
                                                                <BarChart3 className="w-3 h-3 text-white" />
                                                                <span>{link.clicks} clicks</span>
                                                            </button>

                                                            {link.hasPassword && (
                                                                <span className="flex items-center gap-1 text-[11px] font-mono border border-amber-900/60 bg-amber-950/30 px-2 py-0.5 text-amber-300">
                                                                    <Lock className="w-3 h-3 text-amber-400" />
                                                                    Locked
                                                                </span>
                                                            )}

                                                            {link.expireAt && (
                                                                <span className="flex items-center gap-1 text-[11px] font-mono border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    Expires {new Date(link.expireAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Original Destination */}
                                                    <p className="text-xs text-zinc-400 font-mono truncate max-w-xl">
                                                        ➔ {link.originalUrl}
                                                    </p>

                                                    <p className="text-[11px] text-zinc-600">
                                                        Created on {new Date(link.createdAt).toLocaleDateString(undefined, {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 self-start md:self-center">
                                                    <button
                                                        onClick={() => fetchLinkAnalytics(link.id)}
                                                        className="flex items-center gap-1 border border-zinc-800 hover:border-white px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white transition cursor-pointer"
                                                        title="Analytics"
                                                    >
                                                        <BarChart3 className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Stats</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleCopy(link.id, fullUrl)}
                                                        className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                                                            isCopied
                                                                ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                                                                : "border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white"
                                                        }`}
                                                    >
                                                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                        <span>{isCopied ? "Copied" : "Copy"}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleShowQR(link)}
                                                        className="border border-zinc-800 hover:border-zinc-600 p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                                                        title="View QR Code"
                                                    >
                                                        <QrCode className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteLink(link.id)}
                                                        disabled={deletingId === link.id}
                                                        className="border border-zinc-800 hover:border-red-800 hover:bg-red-950/30 p-2 text-zinc-500 hover:text-red-400 transition disabled:opacity-50 cursor-pointer"
                                                        title="Delete Link"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TAB 2: OVERVIEW ANALYTICS ================= */}
                {activeTab === "analytics" && (
                    <div className="space-y-8 animate-in fade-in duration-200">
                        {loadingAnalytics ? (
                            <div className="border border-zinc-800 p-16 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading Analytics Overview...</span>
                            </div>
                        ) : !analytics ? (
                            <div className="border border-zinc-800 p-12 text-center text-zinc-400">
                                No analytics data available yet.
                            </div>
                        ) : (
                            <>
                                {/* Global Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between">
                                        <div className="flex items-center justify-between text-zinc-400">
                                            <span className="text-xs uppercase tracking-wider font-mono">Total Clicks</span>
                                            <TrendingUp className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-3xl font-bold font-mono">{analytics.summary.totalClicks}</p>
                                            <p className="text-[11px] text-zinc-500 mt-1 font-mono">All-time traffic</p>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between">
                                        <div className="flex items-center justify-between text-zinc-400">
                                            <span className="text-xs uppercase tracking-wider font-mono">24h Clicks</span>
                                            <Activity className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-3xl font-bold font-mono">{analytics.summary.todayClicks}</p>
                                            <p className="text-[11px] text-zinc-500 mt-1 font-mono">Past 24 hours</p>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between">
                                        <div className="flex items-center justify-between text-zinc-400">
                                            <span className="text-xs uppercase tracking-wider font-mono">7-Day Clicks</span>
                                            <Calendar className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-3xl font-bold font-mono">{analytics.summary.last7DaysClicks}</p>
                                            <p className="text-[11px] text-zinc-500 mt-1 font-mono">Past week</p>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between">
                                        <div className="flex items-center justify-between text-zinc-400">
                                            <span className="text-xs uppercase tracking-wider font-mono">Active Links</span>
                                            <Link2 className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-3xl font-bold font-mono">{analytics.summary.totalLinks}</p>
                                            <p className="text-[11px] text-zinc-500 mt-1 font-mono">Short URLs</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 7-Day Click Activity Chart */}
                                <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-base font-bold">7-Day Click Activity</h2>
                                            <p className="text-xs text-zinc-400 font-mono">Daily engagement trends</p>
                                        </div>
                                        <button
                                            onClick={fetchAnalytics}
                                            className="p-1.5 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition cursor-pointer"
                                            title="Refresh Data"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Responsive Minimalist Bar Chart */}
                                    <div className="pt-6 pb-2">
                                        {(() => {
                                            const maxClicks = Math.max(1, ...analytics.timeSeries.map((d) => d.count));
                                            return (
                                                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-zinc-800 pb-2">
                                                    {analytics.timeSeries.map((item, idx) => {
                                                        const heightPercent = Math.round((item.count / maxClicks) * 100);
                                                        const dateObj = new Date(item.date + "T00:00:00");
                                                        const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short" });
                                                        const monthDay = dateObj.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });

                                                        return (
                                                            <div key={idx} className="flex flex-col items-center h-full justify-end group">
                                                                {/* Hover Tooltip */}
                                                                <span className="text-[10px] font-mono text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                                                                    {item.count}
                                                                </span>
                                                                <div
                                                                    className="w-full bg-zinc-800 group-hover:bg-white transition-all duration-300"
                                                                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                                                                />
                                                                <div className="text-center mt-3">
                                                                    <p className="text-[11px] font-bold text-zinc-300 font-mono">{dayName}</p>
                                                                    <p className="text-[10px] text-zinc-500 font-mono">{monthDay}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Detailed Breakdown Grids */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Referrers */}
                                    <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <Compass className="w-4 h-4 text-zinc-400" />
                                                Top Referrers
                                            </h3>
                                            <span className="text-[11px] font-mono text-zinc-500">Source</span>
                                        </div>

                                        {analytics.referrers.length === 0 ? (
                                            <p className="text-xs text-zinc-500 font-mono py-4 text-center">No referrer data yet</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {analytics.referrers.map((ref, idx) => {
                                                    const total = analytics.summary.totalClicks || 1;
                                                    const pct = Math.round((ref.count / total) * 100);
                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <div className="flex items-center justify-between text-xs font-mono">
                                                                <span className="text-white truncate max-w-[200px]">{ref.referer}</span>
                                                                <span className="text-zinc-400">{ref.count} clicks ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                                                                <div className="h-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Devices & OS */}
                                    <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <Laptop className="w-4 h-4 text-zinc-400" />
                                                Devices & Platforms
                                            </h3>
                                            <span className="text-[11px] font-mono text-zinc-500">Distribution</span>
                                        </div>

                                        {analytics.devices.length === 0 ? (
                                            <p className="text-xs text-zinc-500 font-mono py-4 text-center">No device data yet</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Devices */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {analytics.devices.map((d, idx) => (
                                                        <div key={idx} className="border border-zinc-800 p-3 text-center bg-black">
                                                            <div className="flex justify-center mb-1 text-zinc-400">
                                                                {d.device.toLowerCase().includes("mobile") ? (
                                                                    <Smartphone className="w-4 h-4" />
                                                                ) : d.device.toLowerCase().includes("tablet") ? (
                                                                    <Tablet className="w-4 h-4" />
                                                                ) : (
                                                                    <Laptop className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-bold text-white font-mono">{d.device}</p>
                                                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{d.count} clicks</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* OS list */}
                                                {analytics.os.length > 0 && (
                                                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                                                        <p className="text-[11px] uppercase font-mono text-zinc-500 tracking-wider">Operating Systems</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {analytics.os.map((o, idx) => (
                                                                <span key={idx} className="text-xs font-mono border border-zinc-800 px-2.5 py-1 bg-zinc-900 text-zinc-300">
                                                                    {o.os}: <strong className="text-white">{o.count}</strong>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Top Performing Links */}
                                <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-zinc-400" />
                                            Top Performing Short Links
                                        </h3>
                                        <span className="text-[11px] font-mono text-zinc-500">Ranked by clicks</span>
                                    </div>

                                    {analytics.topLinks.length === 0 ? (
                                        <p className="text-xs text-zinc-500 font-mono py-4 text-center">No short links created yet</p>
                                    ) : (
                                        <div className="divide-y divide-zinc-900">
                                            {analytics.topLinks.map((tl, index) => (
                                                <div key={tl.id} className="py-3 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold border border-zinc-800 text-zinc-400">
                                                            {index + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-mono text-sm font-bold text-white truncate">
                                                                /{tl.shortCode}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 font-mono truncate max-w-md">
                                                                ➔ {tl.originalUrl}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-sm font-bold text-white bg-zinc-900 border border-zinc-800 px-3 py-1">
                                                            {tl.clicks} clicks
                                                        </span>
                                                        <button
                                                            onClick={() => fetchLinkAnalytics(tl.id)}
                                                            className="border border-zinc-800 hover:border-white p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                                                            title="Inspect Link"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* ================= MODAL: PER-LINK DETAILED ANALYTICS ================= */}
            {selectedLinkForAnalytics && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl border border-white bg-black p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    {linkAnalyticsData?.link.shortCode ? `/${linkAnalyticsData.link.shortCode}` : "Link Analytics"}
                                </h3>
                                <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-md">
                                    {linkAnalyticsData?.link.originalUrl}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLinkForAnalytics(null)}
                                className="text-zinc-500 hover:text-white transition cursor-pointer p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingLinkAnalytics ? (
                            <div className="py-16 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading Link Metrics...</span>
                            </div>
                        ) : !linkAnalyticsData ? (
                            <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                                Failed to load link analytics.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary Counters */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-zinc-800 bg-zinc-950 p-4">
                                        <span className="text-[11px] uppercase font-mono text-zinc-400">Total Clicks</span>
                                        <p className="text-2xl font-bold font-mono mt-1 text-white">{linkAnalyticsData.totalClicks}</p>
                                    </div>
                                    <div className="border border-zinc-800 bg-zinc-950 p-4">
                                        <span className="text-[11px] uppercase font-mono text-zinc-400">Past 24 Hours</span>
                                        <p className="text-2xl font-bold font-mono mt-1 text-white">{linkAnalyticsData.todayClicks}</p>
                                    </div>
                                </div>

                                {/* 7-Day Mini Chart */}
                                <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                                    <p className="text-xs font-bold font-mono text-zinc-300">7-Day Click Activity</p>
                                    {(() => {
                                        const maxClicks = Math.max(1, ...linkAnalyticsData.timeSeries.map((d) => d.count));
                                        return (
                                            <div className="grid grid-cols-7 gap-2 items-end h-28 border-b border-zinc-800 pb-2">
                                                {linkAnalyticsData.timeSeries.map((item, idx) => {
                                                    const heightPercent = Math.round((item.count / maxClicks) * 100);
                                                    const dateObj = new Date(item.date + "T00:00:00");
                                                    const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short" });
                                                    return (
                                                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                                                            <span className="text-[9px] font-mono text-zinc-400 mb-0.5 opacity-0 group-hover:opacity-100 transition">
                                                                {item.count}
                                                            </span>
                                                            <div
                                                                className="w-full bg-zinc-700 group-hover:bg-white transition-all duration-300"
                                                                style={{ height: `${Math.max(4, heightPercent)}%` }}
                                                            />
                                                            <p className="text-[9px] font-mono text-zinc-400 mt-1">{dayName}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Breakdown Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Referrers */}
                                    <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                                        <p className="text-xs font-bold font-mono text-zinc-300">Top Referrers</p>
                                        {linkAnalyticsData.referrers.length === 0 ? (
                                            <p className="text-[11px] text-zinc-500 font-mono">No referrer logs</p>
                                        ) : (
                                            <div className="space-y-1.5 text-xs font-mono">
                                                {linkAnalyticsData.referrers.map((r, i) => (
                                                    <div key={i} className="flex justify-between text-zinc-300">
                                                        <span className="truncate max-w-[140px]">{r.referer}</span>
                                                        <span className="font-bold text-white">{r.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Devices */}
                                    <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                                        <p className="text-xs font-bold font-mono text-zinc-300">Devices & OS</p>
                                        {linkAnalyticsData.devices.length === 0 ? (
                                            <p className="text-[11px] text-zinc-500 font-mono">No device logs</p>
                                        ) : (
                                            <div className="space-y-1.5 text-xs font-mono">
                                                {linkAnalyticsData.devices.map((d, i) => (
                                                    <div key={i} className="flex justify-between text-zinc-300">
                                                        <span>{d.device}</span>
                                                        <span className="font-bold text-white">{d.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Click Stream Log */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold font-mono text-zinc-300">Recent Activity Stream (Last 15)</p>
                                    {linkAnalyticsData.recentClicks.length === 0 ? (
                                        <p className="text-xs text-zinc-500 font-mono border border-zinc-800 p-4 text-center bg-zinc-950">
                                            No clicks recorded yet.
                                        </p>
                                    ) : (
                                        <div className="border border-zinc-800 divide-y divide-zinc-900 bg-zinc-950 max-h-48 overflow-y-auto">
                                            {linkAnalyticsData.recentClicks.map((click) => (
                                                <div key={click.id} className="p-2.5 text-xs font-mono flex items-center justify-between text-zinc-300">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-500">{new Date(click.createdAt).toLocaleTimeString()}</span>
                                                        <span className="text-white">{click.device || "Desktop"}</span>
                                                        <span className="text-zinc-500">&bull;</span>
                                                        <span className="text-zinc-400">{click.os || "OS"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-400">{click.referer || "Direct"}</span>
                                                        {click.country && (
                                                            <span className="border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300">
                                                                {click.country}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= MODAL: CREATE LINK ================= */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg border border-white bg-black p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Shorten a New URL
                            </h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-zinc-500 hover:text-white transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 border border-red-800 bg-red-950/40 text-red-400 text-xs font-mono">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleCreateLink} className="space-y-4">
                            {/* Destination URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
                                    Destination URL *
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://example.com/very-long-url"
                                    value={longUrl}
                                    onChange={(e) => setLongUrl(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-white transition"
                                />
                            </div>

                            {/* Custom Short Code */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
                                    <span>Custom Alias (Optional)</span>
                                    <span className="text-[10px] text-zinc-500 font-normal">e.g. my-link</span>
                                </label>
                                <div className="flex items-center border border-zinc-700 bg-zinc-950 focus-within:border-white transition">
                                    <span className="px-3 text-xs text-zinc-500 font-mono border-r border-zinc-800">
                                        /
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="custom-slug"
                                        value={customCode}
                                        onChange={(e) => setCustomCode(e.target.value)}
                                        className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password Protection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                    <KeyRound className="w-3 h-3 text-zinc-500" />
                                    Password Protection (Optional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter access passcode"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-white transition"
                                />
                            </div>

                            {/* Expiration Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-zinc-500" />
                                    Expiration Date (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={expireDate}
                                    onChange={(e) => setExpireDate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-sm text-white outline-none focus:border-white transition [color-scheme:dark]"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 border border-zinc-800 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 border border-white bg-white py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? "Creating..." : "Create Short Link"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: QR CODE ================= */}
            {qrModalData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm border border-white bg-black p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <h3 className="text-base font-bold text-white font-mono">
                                QR Code: /{qrModalData.code}
                            </h3>
                            <button
                                onClick={() => setQrModalData(null)}
                                className="text-zinc-500 hover:text-white transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-black p-4 border border-zinc-800 flex justify-center">
                            <img
                                src={qrModalData.qrUrl}
                                alt={`QR Code for ${qrModalData.url}`}
                                className="w-60 h-60"
                            />
                        </div>

                        <p className="text-xs font-mono text-zinc-400 break-all">
                            {qrModalData.url}
                        </p>

                        <div className="flex gap-2">
                            <a
                                href={qrModalData.qrUrl}
                                download={`qrcode-${qrModalData.code}.png`}
                                className="flex-1 border border-white bg-white text-black py-2 text-xs font-bold hover:bg-zinc-200 transition text-center"
                            >
                                Download QR
                            </a>
                            <button
                                onClick={() => setQrModalData(null)}
                                className="flex-1 border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
