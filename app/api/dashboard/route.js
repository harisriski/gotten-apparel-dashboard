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

        // ── Order Profit/Loss Summary ──────────────────────────────────────
        const orderHppRows = db.prepare(`
            SELECT DISTINCT t.order_id
            FROM transactions t
            WHERE t.order_id IS NOT NULL AND t.category_group = 'HPP' AND t.amount_out > 0
        `).all();

        let totalLabaBersih = 0;
        let totalHppAll = 0;
        let totalHargaPesanan = 0;
        let lunasCount = 0;
        const orderProfitData = [];

        for (const row of orderHppRows) {
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.order_id);
            if (!order) continue;

            const orderTxs = db.prepare(`
                SELECT * FROM transactions WHERE order_id = ? ORDER BY date ASC
            `).all(row.order_id);

            const totalHpp = orderTxs
                .filter(t => t.category_group === 'HPP')
                .reduce((sum, t) => sum + (t.amount_out || 0), 0);

            const totalIncomeOrder = orderTxs
                .reduce((sum, t) => sum + (t.amount_in || 0), 0);

            const labaBersih = (order.price || 0) - totalHpp;
            const margin = order.price > 0 ? (labaBersih / order.price) * 100 : 0;
            const isLunas = totalIncomeOrder >= (order.price || 0);

            totalLabaBersih += labaBersih;
            totalHppAll += totalHpp;
            totalHargaPesanan += (order.price || 0);
            if (isLunas) lunasCount++;

            orderProfitData.push({
                order_id: order.id,
                customer: order.customer,
                product: order.product,
                totalHarga: order.price || 0,
                totalHpp,
                labaBersih,
                margin: Math.round(margin * 10) / 10,
                isLunas,
            });
        }

        const avgMargin = totalHargaPesanan > 0
            ? Math.round((totalLabaBersih / totalHargaPesanan) * 1000) / 10
            : 0;

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
            orderProfitSummary: {
                totalLabaBersih,
                totalHpp: totalHppAll,
                totalHargaPesanan,
                avgMargin,
                orderCount: orderHppRows.length,
                lunasCount,
            },
            orderProfitData,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
