import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

// ── Accounting logic helpers ─────────────────────────────────────────────────
// Groups where Debit increases balance and Kredit decreases balance (normal debit balance)
const DEBIT_NORMAL_GROUPS = ['Aset Lancar', 'HPP', 'Biaya'];
// Groups where Kredit increases balance and Debit decreases balance (normal credit balance)
const CREDIT_NORMAL_GROUPS = ['Kewajiban Lancar', "Owner's Equity", 'Pendapatan'];

function classifyTransaction(tx) {
    const group = tx.category_group || '';
    const isDebitNormal = DEBIT_NORMAL_GROUPS.includes(group);
    // For income/expense reporting:
    // Income = Kredit on Pendapatan (revenue received)
    // Expense = Debit on HPP, Biaya, or Kredit on Aset (cash going out)
    if (tx.tx_type === 'debit') {
        return { income: tx.amount_in, expense: tx.amount_out };
    } else {
        return { income: tx.amount_in, expense: tx.amount_out };
    }
}

// Build full category path for display
function buildCategoryPath(tx) {
    const parts = [tx.category_group, tx.category, tx.category_sub].filter(Boolean);
    return parts.join(' > ') || tx.category || '-';
}

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let dateFilter = '';
        const dateParams = [];
        if (year) { dateFilter += " AND strftime('%Y', date) = ?"; dateParams.push(year); }
        if (month) { dateFilter += " AND strftime('%m', date) = ?"; dateParams.push(month); }

        const transactions = db.prepare(`
            SELECT t.*, o.customer AS order_customer, o.product AS order_product
            FROM transactions t
            LEFT JOIN orders o ON t.order_id = o.id
            WHERE 1=1${dateFilter.replace(/date/g, 't.date')}
            ORDER BY t.created_at DESC
        `).all(...dateParams);

        // Enrich transactions with full category path
        const enrichedTransactions = transactions.map(t => ({
            ...t,
            category_path: buildCategoryPath(t),
        }));

        const totalIn = db.prepare(`SELECT SUM(amount_in) as total FROM transactions WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;
        const totalOut = db.prepare(`SELECT SUM(amount_out) as total FROM transactions WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;

        // Dynamic monthly cashflow from transactions table
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const cashflowRows = db.prepare(`
            SELECT strftime('%Y-%m', date) as ym,
                   SUM(amount_in) as income,
                   SUM(amount_out) as expense
            FROM transactions
            WHERE 1=1${dateFilter}
            GROUP BY ym
            ORDER BY ym ASC
        `).all(...dateParams);
        const monthlyCashflow = cashflowRows.map(r => {
            const [, m] = r.ym.split('-');
            return {
                month: monthNames[parseInt(m) - 1],
                income: Math.round((r.income || 0) / 1000000 * 10) / 10,
                expense: Math.round((r.expense || 0) / 1000000 * 10) / 10,
            };
        });

        // Dynamic expense breakdown by category_group > category
        const expenseRows = db.prepare(`
            SELECT category_group, category, SUM(amount_out) as total
            FROM transactions
            WHERE amount_out > 0${dateFilter}
            GROUP BY category_group, category
            ORDER BY total DESC
        `).all(...dateParams);
        const expenseTotal = expenseRows.reduce((sum, r) => sum + (r.total || 0), 0);
        const expenseColors = [
            '#a78bfa', '#3b82f6', '#f59e0b', '#34d399', '#f472b6',
            '#60a5fa', '#fb923c', '#e879f9', '#94a3b8', '#fbbf24',
            '#4ade80', '#f87171', '#38bdf8', '#c084fc',
        ];
        const expenseBreakdown = expenseTotal > 0
            ? expenseRows.map((r, i) => ({
                label: r.category_group ? `${r.category_group} > ${r.category}` : r.category,
                value: Math.round((r.total / expenseTotal) * 100),
                color: expenseColors[i % expenseColors.length],
            }))
            : [];

        // ── Order Profit/Loss Data ──────────────────────────────────────────
        // Find all orders that have at least one HPP transaction linked
        const orderHppRows = db.prepare(`
            SELECT DISTINCT t.order_id
            FROM transactions t
            WHERE t.order_id IS NOT NULL AND t.category_group = 'HPP' AND t.amount_out > 0
        `).all();

        const orderProfitData = [];
        for (const row of orderHppRows) {
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.order_id);
            if (!order) continue;

            // All transactions linked to this order
            const orderTxs = db.prepare(`
                SELECT * FROM transactions WHERE order_id = ? ORDER BY date ASC
            `).all(row.order_id);

            // Total HPP = sum of amount_out where category_group = 'HPP'
            const totalHpp = orderTxs
                .filter(t => t.category_group === 'HPP')
                .reduce((sum, t) => sum + (t.amount_out || 0), 0);

            // Total Income = sum of amount_in (DP + Pelunasan)
            const totalIncome = orderTxs
                .reduce((sum, t) => sum + (t.amount_in || 0), 0);

            const labaBersih = (order.price || 0) - totalHpp;
            const margin = order.price > 0 ? (labaBersih / order.price) * 100 : 0;
            const isLunas = totalIncome >= (order.price || 0);

            orderProfitData.push({
                order_id: order.id,
                customer: order.customer,
                product: order.product,
                totalHarga: order.price || 0,
                totalHpp,
                totalIncome,
                labaBersih,
                margin: Math.round(margin * 10) / 10,
                isLunas,
                transactions: orderTxs.map(t => ({
                    id: t.id,
                    date: t.date,
                    description: t.description,
                    category_group: t.category_group,
                    category: t.category,
                    type: t.type,
                    tx_type: t.tx_type,
                    amount_in: t.amount_in || 0,
                amount_out: t.amount_out || 0,
                })),
                created_at: order.created_at || '',
            });
        }
        
        // Urutkan orderProfitData berdasarkan created_at descending
        orderProfitData.sort((a, b) => b.created_at.localeCompare(a.created_at));

        // Computing the summary for order profit
        let totalLabaBersih = 0;
        let totalHppAll = 0;
        let totalHargaPesanan = 0;
        let lunasCount = 0;

        for (const op of orderProfitData) {
            totalLabaBersih += op.labaBersih;
            totalHppAll += op.totalHpp;
            totalHargaPesanan += op.totalHarga;
            if (op.isLunas) lunasCount++;
        }

        const avgMargin = totalHargaPesanan > 0 
            ? Math.round((totalLabaBersih / totalHargaPesanan) * 1000) / 10 
            : 0;

        const orderProfitSummary = {
            totalLabaBersih,
            totalHpp: totalHppAll,
            totalHargaPesanan,
            avgMargin,
            orderCount: orderProfitData.length,
            lunasCount,
        };

        return NextResponse.json({
            transactions: enrichedTransactions,
            summary: { totalIn, totalOut, balance: totalIn - totalOut },
            monthlyCashflow,
            expenseBreakdown,
            orderProfitData,
            orderProfitSummary,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        const stmt = db.prepare(`
            INSERT INTO transactions (date, description, customer, category_group, category, category_sub, tx_type, amount_in, amount_out, order_id, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
        `);

        const result = stmt.run(
            body.date,
            body.description,
            body.customer || '',
            body.category_group || '',
            body.category || '',
            body.category_sub || '',
            body.tx_type || 'debit',
            body.amount_in || 0,
            body.amount_out || 0,
            body.linked_order || null
        );
        const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(newTx, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id } = body;

        const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

        // For DP transactions: handle pelunasan
        if (existing.type === 'dp' && existing.order_id) {
            // Update the DP transaction amount (editable)
            db.prepare(`
                UPDATE transactions SET amount_in=?, date=?, description=?, customer=?,
                    category_group=?, category=?, category_sub=?, tx_type=?
                WHERE id=?
            `).run(
                body.amount_in ?? existing.amount_in,
                body.date ?? existing.date,
                body.description ?? existing.description,
                body.customer ?? existing.customer ?? '',
                body.category_group ?? existing.category_group ?? '',
                body.category ?? existing.category,
                body.category_sub ?? existing.category_sub ?? '',
                body.tx_type ?? existing.tx_type ?? 'debit',
                id
            );

            // Also sync DP amount back to orders table
            const newDpAmount = parseInt(body.amount_in ?? existing.amount_in) || 0;
            db.prepare("UPDATE orders SET dp = ? WHERE id = ?").run(newDpAmount, existing.order_id);

            // Handle pelunasan (settlement payment)
            const pelunasanAmount = parseInt(body.pelunasan) || 0;
            if (pelunasanAmount > 0) {
                const existingPelunasan = db.prepare("SELECT * FROM transactions WHERE order_id = ? AND type = 'pelunasan'").get(existing.order_id);

                if (existingPelunasan) {
                    db.prepare("UPDATE transactions SET amount_in = ?, date = ? WHERE id = ?").run(
                        pelunasanAmount,
                        body.date ?? existing.date,
                        existingPelunasan.id
                    );
                } else {
                    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(existing.order_id);
                    db.prepare(`
                        INSERT INTO transactions (date, description, category_group, category, category_sub, tx_type, amount_in, amount_out, order_id, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'pelunasan')
                    `).run(
                        body.date ?? existing.date,
                        `Pelunasan Pesanan ${existing.order_id} - ${order?.customer || ''}`,
                        'Pendapatan',
                        'Penjualan',
                        '',
                        'debit',
                        pelunasanAmount,
                        existing.order_id
                    );
                }

                db.prepare("UPDATE orders SET pelunasan = ? WHERE id = ?").run(pelunasanAmount, existing.order_id);
            }

            const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
            return NextResponse.json(updated);
        }

        // For normal (manual) transactions: standard update
        const stmt = db.prepare(`
            UPDATE transactions SET date=?, description=?, customer=?, category_group=?, category=?, category_sub=?, tx_type=?, amount_in=?, amount_out=?, order_id=?
            WHERE id=?
        `);

        stmt.run(
            body.date ?? existing.date,
            body.description ?? existing.description,
            body.customer ?? existing.customer ?? '',
            body.category_group ?? existing.category_group ?? '',
            body.category ?? existing.category,
            body.category_sub ?? existing.category_sub ?? '',
            body.tx_type ?? existing.tx_type ?? 'debit',
            body.amount_in ?? existing.amount_in,
            body.amount_out ?? existing.amount_out,
            body.linked_order ?? existing.order_id ?? null,
            id
        );

        const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const idStr = searchParams.get('id');

        if (!idStr) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        const id = Number(idStr);

        const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

        // Block deletion of order-linked transactions (DP and pelunasan)
        if (existing.type === 'dp' || existing.type === 'pelunasan') {
            return NextResponse.json(
                { error: 'Transaksi DP/Pelunasan tidak dapat dihapus karena terkait dengan pesanan.' },
                { status: 403 }
            );
        }

        db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Transaction deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
