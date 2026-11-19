import { NextResponse } from 'next/server';

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Allow public landing page, tracking page, login page, public tracking API, auth API routes, uploads, and static assets
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/lacak' ||
        pathname.startsWith('/lacak') ||
        pathname.startsWith('/api/track') ||
        pathname.startsWith('/api/auth/') ||
        pathname.startsWith('/uploads/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.webp') ||
        pathname.endsWith('.svg')
    ) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionToken = request.cookies.get('gotten_session')?.value;

    if (!sessionToken) {
        // Redirect to login for page requests
        if (!pathname.startsWith('/api/')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Return 401 for API requests
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for static files
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
