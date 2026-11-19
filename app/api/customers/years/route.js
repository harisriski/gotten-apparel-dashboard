import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getDb();
        const rows = db.prepare(`
            SELECT DISTINCT substr(COALESCE(NULLIF(tanggal, ''), created_at), 1, 4) as year
            FROM orders
            WHERE customer IS NOT NULL AND TRIM(customer) != '' AND deleted_at IS NULL
            ORDER BY year DESC
        `).all();

        const currentYear = String(new Date().getFullYear());
        const dbYears = rows.map(r => r.year).filter(Boolean);
        const uniqueYears = Array.from(new Set([currentYear, ...dbYears])).sort((a, b) => b.localeCompare(a));

        return NextResponse.json(uniqueYears);
    } catch (error) {
        console.error('GET /api/customers/years error:', error);
        return NextResponse.json([String(new Date().getFullYear())]);
    }
}
