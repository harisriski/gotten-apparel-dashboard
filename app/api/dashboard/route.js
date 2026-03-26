import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let dateFilter = '';
        const dateParams = [];
        if (year) { dateFilter += " AND strftime('%Y', created_at) = ?"; dateParams.push(year); }
        if (month) { dateFilter += " AND strftime('%m', created_at) = ?"; dateParams.push(month); }

        const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE 1=1${dateFilter}`).get(...dateParams).count;
        const totalRevenue = db.prepare(`SELECT SUM(price) as total FROM orders WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;
        const activeOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('baru', 'proses')${dateFilter}`).get(...dateParams).count;
        const completedOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('selesai', 'dikirim')${dateFilter}`).get(...dateParams).count;
        const recentOrders = db.prepare(`SELECT * FROM orders WHERE 1=1${dateFilter} ORDER BY created_at DESC LIMIT 6`).all(...dateParams);
        const statusCounts = db.prepare(`SELECT status, COUNT(*) as count FROM orders WHERE 1=1${dateFilter} GROUP BY status`).all(...dateParams);

        // Transaction-based for chart (DP is now stored directly in transactions table)
        let txFilter = '';
        const txParams = [];
        if (year) { txFilter += " AND strftime('%Y', date) = ?"; txParams.push(year); }
        if (month) { txFilter += " AND strftime('%m', date) = ?"; txParams.push(month); }

        const totalIn = db.prepare(`SELECT SUM(amount_in) as total FROM transactions WHERE 1=1${txFilter}`).get(...txParams).total || 0;
        const totalOut = db.prepare(`SELECT SUM(amount_out) as total FROM transactions WHERE 1=1${txFilter}`).get(...txParams).total || 0;

        // Dynamic monthly revenue from transactions table
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        let revenueQuery = `
            SELECT strftime('%Y-%m', date) as ym,
                   SUM(amount_in) as revenue,
                   SUM(amount_out) as expense
            FROM transactions
            WHERE 1=1${txFilter}
            GROUP BY ym
            ORDER BY ym ASC
        `;
        const revenueRows = db.prepare(revenueQuery).all(...txParams);
        const monthlyRevenue = revenueRows.map(r => {
            const [, m] = r.ym.split('-');
            return {
                month: monthNames[parseInt(m) - 1],
                revenue: Math.round((r.revenue || 0) / 1000000 * 10) / 10,
                expense: Math.round((r.expense || 0) / 1000000 * 10) / 10,
            };
        });

        return NextResponse.json({
            kpi: {
                totalOrders,
                totalRevenue,
                activeOrders,
                completedOrders,
                totalIn,
                totalOut,
                monthlyTarget: 100000000,
                avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            },
            recentOrders,
            statusCounts: statusCounts.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, {}),
            monthlyRevenue,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
