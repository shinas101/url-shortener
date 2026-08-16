"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiKey =
    "4a5413de3c326d2cdfca09e86cc90667c2f580fb25b1bfc6710d3bb283470cf7";

  async function handleShorten() {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        url,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setShortUrl(data.shortUrl);
      setFlipped(true);
    } else {
      console.log(data.error);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-5">
      <div className="[perspective:1000px] w-full max-w-md h-80">
        <div
          className={`relative h-full w-full duration-700 transition-transform [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
        >
          {/* Front */}
          <div className="absolute inset-0  border border-white bg-black p-8 flex flex-col justify-center gap-8 [backface-visibility:hidden]">
            <h1 className="text-4xl font-bold text-white text-center">
              URL Shortener
            </h1>

            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your URL"
              className="bg-black border border-white px-4 py-3 text-white outline-none focus:border-white transition"
            />

            <button
              onClick={handleShorten}
              className="border border-white py-3 text-white hover:bg-white hover:text-black transition"
            >
              Shorten
            </button>
          </div>

          <div className="absolute inset-0 border border-zinc-700 bg-black p-8 flex flex-col justify-center items-center gap-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <h2 className="text-3xl font-bold text-white">Done ✨</h2>

            <div className="w-full border border-zinc-700 p-3 break-all text-white">
              {shortUrl}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shortUrl);
                  setCopied(true);

                  setTimeout(() => {
                    setCopied(false);
                  }, 2000);
                }}
                className="flex-1 border border-zinc-600 py-2 text-white hover:bg-white hover:text-black transition"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>

              <button
                onClick={() => window.open(shortUrl, "_blank")}
                className="flex-1 border border-zinc-600 py-2 text-white hover:bg-white hover:text-black transition"
              >
                Open
              </button>
            </div>

            <button
              onClick={() => {
                setFlipped(false);
                setUrl("");
                setShortUrl("");
              }}
              className="text-zinc-400 hover:text-white text-sm"
            >
              ← Shorten another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}