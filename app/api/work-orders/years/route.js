import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getDb();
        const currentYear = String(new Date().getFullYear());
        const years = new Set();
        years.add(currentYear);

        // Fetch all created_at and data_transaksi to get unique years
        const rows = db.prepare('SELECT created_at, data_transaksi FROM work_orders WHERE deleted_at IS NULL').all();
        for (const r of rows) {
            if (r.created_at) {
                const y = String(r.created_at).slice(0, 4);
                if (y && /^\d{4}$/.test(y)) years.add(y);
            }
            if (r.data_transaksi) {
                try {
                    const dt = typeof r.data_transaksi === 'string' ? JSON.parse(r.data_transaksi) : r.data_transaksi;
                    if (dt?.tanggal_masuk) {
                        const y = String(dt.tanggal_masuk).slice(0, 4);
                        if (y && /^\d{4}$/.test(y)) years.add(y);
                    }
                } catch {
                    // ignore JSON parse error
                }
            }
        }

        const sortedYears = Array.from(years).sort((a, b) => Number(b) - Number(a));
        return NextResponse.json(sortedYears);
    } catch (error) {
        console.error('GET work_orders/years error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
