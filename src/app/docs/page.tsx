"use client";

import { useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    Code2,
    Shield,
    Sparkles,
    BarChart3,
    QrCode,
    Lock,
    Clock,
    Search,
    Copy,
    Check,
    ArrowRight,
    KeyRound,
    Globe,
    Terminal,
    HelpCircle,
    Zap,
    ExternalLink,
    Laptop,
    Share2,
    ChevronRight
} from "lucide-react";

interface CodeSnippet {
    id: string;
    lang: "curl" | "javascript" | "python";
    code: string;
}

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
    const [apiLang, setApiLang] = useState<"curl" | "javascript" | "python">("javascript");

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippetId(id);
        setTimeout(() => setCopiedSnippetId(null), 2000);
    };

    const sections = [
        { id: "getting-started", title: "Getting Started", icon: Zap },
        { id: "custom-aliases", title: "Custom Aliases", icon: Sparkles },
        { id: "password-protection", title: "Passcode Protection", icon: Lock },
        { id: "qr-codes", title: "QR Codes", icon: QrCode },
        { id: "link-expiration", title: "Link Expiration", icon: Clock },
        { id: "analytics", title: "Analytics & Tracking", icon: BarChart3 },
        { id: "api-reference", title: "REST API Reference", icon: Code2 },
        { id: "faq", title: "FAQ & Security", icon: HelpCircle },
    ];

    const shortenCodeExamples: Record<"curl" | "javascript" | "python", string> = {
        curl: `curl -X POST "https://your-domain.com/api/shorten" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/very-long-landing-page",
    "pass": "secret123"
  }'`,
        javascript: `const res = await fetch("https://your-domain.com/api/shorten", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com/very-long-landing-page",
    pass: "secret123" // Optional passcode protection
  })
});

const data = await res.json();
console.log("Short URL:", data.shortUrl);
// Output: { id: "...", shortCode: "k9xL2pQ", shortUrl: "https://your-domain.com/k9xL2pQ" }`,
        python: `import requests

payload = {
    "url": "https://example.com/very-long-landing-page",
    "pass": "secret123"
}

response = requests.post("https://your-domain.com/api/shorten", json=payload)
data = response.json()
print("Short URL:", data["shortUrl"])`
    };

    const verifyPassExamples: Record<"curl" | "javascript" | "python", string> = {
        curl: `curl -X POST "https://your-domain.com/api/verify-password" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "k9xL2pQ",
    "password": "secret123"
  }'`,
        javascript: `const res = await fetch("https://your-domain.com/api/verify-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code: "k9xL2pQ",
    password: "secret123"
  })
});

const data = await res.json();
if (res.ok) {
  window.location.href = data.url; // Destination URL
}`,
        python: `import requests

res = requests.post("https://your-domain.com/api/verify-password", json={
    "code": "k9xL2pQ",
    "password": "secret123"
})

print(res.json()["url"])`
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between">
            {/* Navigation Header */}
            <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                                <span className="font-bold text-sm">US</span>
                            </div>
                            <span className="font-bold text-lg tracking-tight">URL Shortener</span>
                        </Link>
                        <span className="text-xs font-mono border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-400">
                            Docs &amp; Guide
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="border border-white bg-white text-black px-4 py-1.5 text-xs font-bold hover:bg-zinc-200 transition flex items-center gap-1.5"
                        >
                            <span>Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Docs Content Grid */}
            <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Sidebar Navigation */}
                <aside className="md:col-span-3 space-y-6">
                    {/* Search Filter */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition font-mono"
                        />
                    </div>

                    {/* Table of Contents */}
                    <nav className="space-y-1 sticky top-24">
                        <p className="text-[11px] uppercase font-mono tracking-wider text-zinc-500 px-3 pb-2">
                            Table of Contents
                        </p>
                        {sections
                            .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((section) => {
                                const Icon = section.icon;
                                return (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition group font-mono"
                                    >
                                        <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
                                        <span>{section.title}</span>
                                    </a>
                                );
                            })}
                    </nav>
                </aside>

                {/* Main Documentation Articles */}
                <article className="md:col-span-9 space-y-16">
                    {/* Hero Intro */}
                    <div className="space-y-3 pb-8 border-b border-zinc-800">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                            <BookOpen className="w-8 h-8" />
                            Documentation &amp; User Guide
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono leading-relaxed max-w-2xl">
                            Everything you need to know about creating fast short links, securing URLs with passcodes, generating instant QR codes, and tracking real-time analytics.
                        </p>
                    </div>

                    {/* Section 1: Getting Started */}
                    <section id="getting-started" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-white" />
                            Getting Started
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            URL Shortener allows you to convert long, unwieldy web addresses into clean, memorable links in seconds. You can use it as a guest or sign in for complete management capabilities.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                    <span>1. Instant Shortening</span>
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Paste your destination URL on the homepage and click <strong>Shorten URL ➔</strong>. Your link and QR code are ready immediately.
                                </p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                    <span>2. Sign In for Dashboard</span>
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Authenticate with Google to customize aliases, view 7-day click analytics, lock URLs with passcodes, and manage all your links in one place.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Custom Aliases */}
                    <section id="custom-aliases" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-white" />
                            Custom Aliases &amp; Branded Slugs
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Instead of random 7-character strings (e.g. <code className="text-xs font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 text-white">/wIsLm0z</code>), you can create branded aliases that match your campaigns (e.g. <code className="text-xs font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 text-white">/summer-sale</code>).
                        </p>

                        <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-400">Rules for Custom Aliases</h4>
                            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside font-mono">
                                <li>Length must be between <strong>3 and 20 characters</strong>.</li>
                                <li>Allowed characters: Letters (<code className="text-white">a-z, A-Z</code>), numbers (<code className="text-white">0-9</code>), dashes (<code className="text-white">-</code>), and underscores (<code className="text-white">_</code>).</li>
                                <li>Must be unique and not already taken by another link.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Passcode Protection */}
                    <section id="password-protection" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-white" />
                            Passcode Protection
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Need to share sensitive files, beta previews, or private dashboards? You can lock any short URL with an optional password.
                        </p>

                        <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0">
                                    <KeyRound className="w-4 h-4 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white">How Passcode Protection Works</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        When someone clicks a protected short URL, they are not redirected immediately. Instead, they are presented with the secure <strong>/unlock/[code]</strong> screen asking for the passcode. Once the correct password is entered, they are seamlessly forwarded to the destination.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: QR Codes */}
                    <section id="qr-codes" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-white" />
                            Instant QR Code Generation
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Every shortened URL automatically generates a high-contrast QR code optimized for digital displays, printed flyers, business cards, and presentations.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-400">One-Click Download</h4>
                                <p className="text-xs text-zinc-400">
                                    Download high-resolution PNG image assets directly from the homepage card or the dashboard QR modal.
                                </p>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-400">Mobile Scanning</h4>
                                <p className="text-xs text-zinc-400">
                                    Compatible with standard iOS Camera, Android Google Lens, and all barcode reader apps.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Link Expiration */}
                    <section id="link-expiration" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-white" />
                            Link Expiration &amp; Auto-Deactivation
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Create temporary links that automatically stop redirecting after a specific date and time—ideal for limited-time offers, flash sales, and temporary file shares.
                        </p>
                    </section>

                    {/* Section 6: Analytics & Tracking */}
                    <section id="analytics" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-white" />
                            Real-Time Analytics &amp; Engagement
                        </h2>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Gain valuable insights into where and how your audience is engaging with your links.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-zinc-400" />
                                    Geo &amp; Referral Sources
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Tracks visitor country codes via CDN headers &amp; IP resolution, alongside traffic sources (Google, X / Twitter, LinkedIn, GitHub, Direct).
                                </p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                                    <Laptop className="w-4 h-4 text-zinc-400" />
                                    Device &amp; OS Breakdown
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Categorizes visitors by device type (Desktop, Mobile, Tablet) and operating system (iOS, Android, Windows, macOS, Linux).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7: REST API Reference */}
                    <section id="api-reference" className="space-y-6 scroll-mt-24">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-white" />
                                REST API Reference
                            </h2>
                            <p className="text-sm text-zinc-400 font-mono">
                                Programmatically create short links and verify passwords via JSON HTTP APIs.
                            </p>
                        </div>

                        {/* Language Selector */}
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <span className="text-xs text-zinc-500 font-mono mr-2">Language:</span>
                            {(["javascript", "curl", "python"] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setApiLang(lang)}
                                    className={`px-3 py-1 text-xs font-mono transition cursor-pointer ${
                                        apiLang === lang
                                            ? "border border-white bg-white text-black font-bold"
                                            : "border border-zinc-800 text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Endpoint 1: POST /api/shorten */}
                        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                                        POST
                                    </span>
                                    <code className="text-sm font-mono font-bold text-white">/api/shorten</code>
                                </div>

                                <button
                                    onClick={() => handleCopy("shorten", shortenCodeExamples[apiLang])}
                                    className="border border-zinc-800 hover:border-zinc-600 px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedSnippetId === "shorten" ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Snippet</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                Shortens a destination URL and returns the short link metadata and code.
                            </p>

                            <pre className="border border-zinc-800 bg-black p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                                <code>{shortenCodeExamples[apiLang]}</code>
                            </pre>
                        </div>

                        {/* Endpoint 2: POST /api/verify-password */}
                        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                                        POST
                                    </span>
                                    <code className="text-sm font-mono font-bold text-white">/api/verify-password</code>
                                </div>

                                <button
                                    onClick={() => handleCopy("verify", verifyPassExamples[apiLang])}
                                    className="border border-zinc-800 hover:border-zinc-600 px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedSnippetId === "verify" ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Snippet</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                Verifies access passcode for a locked URL and returns original destination on success.
                            </p>

                            <pre className="border border-zinc-800 bg-black p-4 text-xs font-mono text-zinc-300 overflow-x-auto">
                                <code>{verifyPassExamples[apiLang]}</code>
                            </pre>
                        </div>
                    </section>

                    {/* Section 8: FAQ */}
                    <section id="faq" className="space-y-4 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-white" />
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-3">
                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white">How fast is link redirection?</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                    Links are cached in an in-memory Redis layer with 1-hour TTL, enabling ultra-fast sub-millisecond 302 redirects with non-blocking click tracking.
                                </p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white">Do short links expire automatically?</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                    By default, links do not expire unless you specify an optional expiration date during link creation.
                                </p>
                            </div>

                            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white">Is analytics tracking privacy-friendly?</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                    Yes. We do not store raw IP addresses or personal identifying info—only aggregated metrics such as country code, device category, OS, and referrer source.
                                </p>
                            </div>
                        </div>
                    </section>
                </article>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono z-20">
                <p>
                    &copy; {new Date().getFullYear()} URL Shortener &bull; Created with 🖤 by{" "}
                    <a
                        href="https://github.com/shinas101"
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-300 hover:text-white hover:underline transition font-semibold"
                    >
                        shinas101
                    </a>
                </p>
                <div className="flex items-center gap-6">
                    <Link href="/" className="hover:text-zinc-300 transition">Home</Link>
                    <Link href="/dashboard" className="hover:text-zinc-300 transition">Dashboard</Link>
                    <Link href="/docs" className="text-white hover:underline">Documentation</Link>
                </div>
            </footer>
        </div>
    );
}
