"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function UnlockPage() {
    const { code } = useParams<{ code: string }>();

    const [password, setPassword] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const res = await fetch("/api/verify-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                password,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            window.location.href = data.url;
        } else {
            console.log(data.error);
        }
    }

    return (
        <main>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col max-w-lg mx-auto"
            >
                <p className="mt-4">Enter your password to unlock the URL</p>

                <input
                    className="mt-4 border p-2"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="mt-4 border p-2">
                    Unlock
                </button>
            </form>
        </main>
    );
}