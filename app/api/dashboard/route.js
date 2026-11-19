import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getOrderPaymentStatus } from '@/lib/paymentStatus';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let dateFilter = ' AND deleted_at IS NULL';
        const dateParams = [];
        if (year) { 
            dateFilter += " AND substr(COALESCE(NULLIF(tanggal, ''), created_at), 1, 4) = ?"; 
            dateParams.push(year); 
        }
        if (month) { 
            dateFilter += " AND substr(COALESCE(NULLIF(tanggal, ''), created_at), 6, 2) = ?"; 
            dateParams.push(month.padStart(2, '0')); 
        }

        const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE 1=1${dateFilter}`).get(...dateParams).count;
        const totalRevenue = db.prepare(`SELECT SUM(price) as total FROM orders WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;
        const activeOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('baru', 'proses')${dateFilter}`).get(...dateParams).count;
        const completedOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('selesai', 'dikirim')${dateFilter}`).get(...dateParams).count;
        const recentOrders = db.prepare(`SELECT * FROM orders WHERE 1=1${dateFilter} ORDER BY COALESCE(NULLIF(tanggal, ''), created_at) DESC LIMIT 6`).all(...dateParams);
        const statusCounts = db.prepare(`SELECT status, COUNT(*) as count FROM orders WHERE 1=1${dateFilter} GROUP BY status`).all(...dateParams);

        // Analisa Status Piutang & Pembayaran untuk seluruh pesanan dalam filter periode
        const allOrdersInPeriod = db.prepare(`SELECT * FROM orders WHERE 1=1${dateFilter}`).all(...dateParams);
        let totalPiutangDiikhlaskan = 0;
        let diikhlaskanCount = 0;
        let totalPiutangMacet = 0;
        let macetCount = 0;
        let totalBelumLunas = 0;
        let belumLunasCount = 0;
        let lunasPeriodCount = 0;

        for (const o of allOrdersInPeriod) {
            const payStatus = getOrderPaymentStatus(o);
            if (payStatus.status === 'diikhlaskan') {
                totalPiutangDiikhlaskan += payStatus.diikhlaskan;
                diikhlaskanCount++;
            } else if (payStatus.status === 'macet') {
                totalPiutangMacet += payStatus.sisa;
                macetCount++;
            } else if (payStatus.status === 'belum_lunas') {
                totalBelumLunas += payStatus.sisa;
                belumLunasCount++;
            } else if (payStatus.status === 'lunas') {
                lunasPeriodCount++;
            }
        }

        // Transaction-based for chart (DP is now stored directly in transactions table)
        let txFilter = ' AND deleted_at IS NULL';
        const txParams = [];
        if (year) { 
            txFilter += " AND substr(date, 1, 4) = ?"; 
            txParams.push(year); 
        }
        if (month) { 
            txFilter += " AND substr(date, 6, 2) = ?"; 
            txParams.push(month.padStart(2, '0')); 
        }

        const totalIn = db.prepare(`SELECT SUM(amount_in) as total FROM transactions WHERE 1=1${txFilter}`).get(...txParams).total || 0;
        const totalOut = db.prepare(`SELECT SUM(amount_out) as total FROM transactions WHERE 1=1${txFilter}`).get(...txParams).total || 0;

        // Dynamic monthly revenue from transactions table
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        let revenueQuery = `
            SELECT substr(date, 1, 7) as ym,
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

        // ── Order Profit/Loss Summary (Target vs Realisasi) ──────────────────
        const orderHppRows = db.prepare(`
            SELECT DISTINCT t.order_id
            FROM transactions t
            WHERE t.order_id IS NOT NULL AND t.category_group = 'HPP' AND t.amount_out > 0
        `).all();

        let totalLabaBersihTarget = 0;
        let totalLabaBersihRealisasi = 0;
        let totalHppAll = 0;
        let totalHargaPesanan = 0;
        let totalDiikhlaskanProfit = 0;
        const orderProfitData = [];

        for (const row of orderHppRows) {
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.order_id);
            if (!order || order.deleted_at) continue;

            const orderTxs = db.prepare(`
                SELECT * FROM transactions WHERE order_id = ? ORDER BY date ASC
            `).all(row.order_id);

            const totalHpp = orderTxs
                .filter(t => t.category_group === 'HPP')
                .reduce((sum, t) => sum + (t.amount_out || 0), 0);

            const payStatus = getOrderPaymentStatus(order);
            const orderPrice = order.price || 0;
            const diikhlaskan = payStatus.diikhlaskan || 0;
            const realPrice = Math.max(0, orderPrice - diikhlaskan);

            const labaTarget = orderPrice - totalHpp;
            const marginTarget = orderPrice > 0 ? (labaTarget / orderPrice) * 100 : 0;

            const labaRealisasi = realPrice - totalHpp;
            const marginRealisasi = realPrice > 0 ? (labaRealisasi / realPrice) * 100 : 0;

            totalLabaBersihTarget += labaTarget;
            totalLabaBersihRealisasi += labaRealisasi;
            totalHppAll += totalHpp;
            totalHargaPesanan += orderPrice;
            totalDiikhlaskanProfit += diikhlaskan;

            orderProfitData.push({
                order_id: order.id,
                customer: order.customer,
                product: order.product,
                totalHarga: orderPrice,
                diikhlaskan,
                realPrice,
                totalHpp,
                labaBersih: labaTarget,
                labaRealisasi,
                margin: Math.round(marginTarget * 10) / 10,
                marginRealisasi: Math.round(marginRealisasi * 10) / 10,
                paymentStatus: payStatus.status,
                paymentLabel: payStatus.label,
                isLunas: payStatus.isLunas,
                isDiikhlaskan: payStatus.isDiikhlaskan,
                isMacet: payStatus.isMacet,
                sisaTagihan: payStatus.sisa
            });
        }

        const avgMarginTarget = totalHargaPesanan > 0
            ? Math.round((totalLabaBersihTarget / totalHargaPesanan) * 1000) / 10
            : 0;

        const totalRealisasiAll = Math.max(0, totalHargaPesanan - totalDiikhlaskanProfit);
        const avgMarginRealisasi = totalRealisasiAll > 0
            ? Math.round((totalLabaBersihRealisasi / totalRealisasiAll) * 1000) / 10
            : 0;

        return NextResponse.json({
            kpi: {
                totalOrders,
                totalRevenue,
                totalRevenueRealisasi: Math.max(0, totalRevenue - totalPiutangDiikhlaskan),
                totalPiutangDiikhlaskan,
                diikhlaskanCount,
                totalPiutangMacet,
                macetCount,
                totalBelumLunas,
                belumLunasCount,
                lunasPeriodCount,
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
                totalLabaBersih: totalLabaBersihTarget,
                totalLabaBersihRealisasi,
                totalHpp: totalHppAll,
                totalHargaPesanan,
                totalDiikhlaskan: totalDiikhlaskanProfit,
                avgMargin: avgMarginTarget,
                avgMarginRealisasi,
                orderCount: orderHppRows.length,
            },
            orderProfitData,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
