import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/') {
        return NextResponse.next();
    }

    const shortCode = pathname.slice(1);

    const cachedUrl = await redis.get<string>(`url:${shortCode}`);

    if (cachedUrl) {
        console.log(request.headers)
        return NextResponse.redirect(new URL(cachedUrl), 302);
    }

    return NextResponse.next();
}
