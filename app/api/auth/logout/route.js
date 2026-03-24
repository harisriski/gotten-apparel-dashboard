import { NextResponse } from 'next/server';
import { deleteSession, SESSION_COOKIE } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;

        if (token) {
            deleteSession(token);
        }

        const response = NextResponse.json({ success: true });
        response.cookies.set(SESSION_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
