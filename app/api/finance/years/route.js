import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getDb();
        const currentYear = String(new Date().getFullYear());
        const years = new Set();
        years.add(currentYear);

        const rows = db.prepare(`
            SELECT DISTINCT substr(date, 1, 4) as y 
            FROM transactions 
            WHERE date IS NOT NULL AND length(date) >= 4
        `).all();

        for (const r of rows) {
            if (r.y && /^\d{4}$/.test(r.y)) {
                years.add(r.y);
            }
        }

        const sortedYears = Array.from(years).sort((a, b) => Number(b) - Number(a));
        return NextResponse.json(sortedYears);
    } catch (error) {
        console.error('GET finance/years error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
