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
        if (year) { dateFilter += " AND strftime('%Y', date) = ?"; dateParams.push(year); }
        if (month) { dateFilter += " AND strftime('%m', date) = ?"; dateParams.push(month); }

        // DP is now stored directly in transactions table (type='dp'), no need to sum from orders separately
        const transactions = db.prepare(`SELECT * FROM transactions WHERE 1=1${dateFilter} ORDER BY date DESC`).all(...dateParams);
        const totalIn = db.prepare(`SELECT SUM(amount_in) as total FROM transactions WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;
        const totalOut = db.prepare(`SELECT SUM(amount_out) as total FROM transactions WHERE 1=1${dateFilter}`).get(...dateParams).total || 0;

        // Dynamic monthly cashflow from transactions table (includes DP + pelunasan + manual)
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

        // Dynamic expense breakdown from transactions table
        const expenseRows = db.prepare(`
            SELECT category, SUM(amount_out) as total
            FROM transactions
            WHERE amount_out > 0${dateFilter}
            GROUP BY category
            ORDER BY total DESC
        `).all(...dateParams);
        const expenseTotal = expenseRows.reduce((sum, r) => sum + (r.total || 0), 0);
        const expenseColors = {
            'Bahan Baku': '#a78bfa', 'Gaji': '#3b82f6', 'Operasional': '#f59e0b',
            'Pengiriman': '#34d399', 'Lain-lain': '#f472b6', 'Penjualan': '#60a5fa',
        };
        const expenseBreakdown = expenseTotal > 0
            ? expenseRows.map(r => ({
                label: r.category,
                value: Math.round((r.total / expenseTotal) * 100),
                color: expenseColors[r.category] || '#94a3b8',
            }))
            : [];

        return NextResponse.json({
            transactions,
            summary: { totalIn, totalOut, balance: totalIn - totalOut },
            monthlyCashflow,
            expenseBreakdown,
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
            INSERT INTO transactions (date, description, category, amount_in, amount_out, type)
            VALUES (?, ?, ?, ?, ?, 'manual')
        `);

        const result = stmt.run(body.date, body.description, body.category, body.amount_in || 0, body.amount_out || 0);
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
                UPDATE transactions SET amount_in=?, date=?, description=?
                WHERE id=?
            `).run(
                body.amount_in ?? existing.amount_in,
                body.date ?? existing.date,
                body.description ?? existing.description,
                id
            );

            // Also sync DP amount back to orders table
            const newDpAmount = parseInt(body.amount_in ?? existing.amount_in) || 0;
            db.prepare("UPDATE orders SET dp = ? WHERE id = ?").run(newDpAmount, existing.order_id);

            // Handle pelunasan (settlement payment)
            const pelunasanAmount = parseInt(body.pelunasan) || 0;
            if (pelunasanAmount > 0) {
                // Check existing pelunasan transaction for this order
                const existingPelunasan = db.prepare("SELECT * FROM transactions WHERE order_id = ? AND type = 'pelunasan'").get(existing.order_id);

                if (existingPelunasan) {
                    // Update existing pelunasan
                    db.prepare("UPDATE transactions SET amount_in = ?, date = ? WHERE id = ?").run(
                        pelunasanAmount,
                        body.date ?? existing.date,
                        existingPelunasan.id
                    );
                } else {
                    // Create new pelunasan transaction
                    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(existing.order_id);
                    db.prepare(`
                        INSERT INTO transactions (date, description, category, amount_in, amount_out, order_id, type)
                        VALUES (?, ?, ?, ?, 0, ?, 'pelunasan')
                    `).run(
                        body.date ?? existing.date,
                        `Pelunasan Pesanan ${existing.order_id} - ${order?.customer || ''}`,
                        'Penjualan',
                        pelunasanAmount,
                        existing.order_id
                    );
                }

                // Update pelunasan amount on the order
                db.prepare("UPDATE orders SET pelunasan = ? WHERE id = ?").run(pelunasanAmount, existing.order_id);
            }

            const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
            return NextResponse.json(updated);
        }

        // For normal (manual) transactions: standard update
        const stmt = db.prepare(`
            UPDATE transactions SET date=?, description=?, category=?, amount_in=?, amount_out=?
            WHERE id=?
        `);

        stmt.run(
            body.date ?? existing.date,
            body.description ?? existing.description,
            body.category ?? existing.category,
            body.amount_in ?? existing.amount_in,
            body.amount_out ?? existing.amount_out,
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
