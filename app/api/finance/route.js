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
        const day = searchParams.get('day');

        let dateFilter = '';
        const dateParams = [];
        if (year) { dateFilter += " AND substr(date, 1, 4) = ?"; dateParams.push(year); }
        if (month) { dateFilter += " AND substr(date, 6, 2) = ?"; dateParams.push(month.padStart(2, '0')); }
        if (day) { dateFilter += " AND substr(date, 9, 2) = ?"; dateParams.push(day.padStart(2, '0')); }

        const transactions = db.prepare(`
            SELECT t.*, o.customer AS order_customer, o.product AS order_product,
                   o.price AS order_price, o.dp AS order_dp, o.pelunasan AS order_pelunasan
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

        // Validasi HPP Project (Mandatori Pesanan & Sisa Plafon Anggaran)
        if (body.category_group === 'HPP' || body.linked_order) {
            const orderId = (body.linked_order || '').trim();
            if (!orderId) {
                return NextResponse.json(
                    { error: 'Pesanan / Project wajib dipilih untuk pencatatan HPP.' },
                    { status: 400 }
                );
            }

            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
            if (!order) {
                return NextResponse.json(
                    { error: `Pesanan "${orderId}" tidak ditemukan.` },
                    { status: 404 }
                );
            }

            const amountOut = Number(body.amount_out) || 0;
            if (amountOut <= 0) {
                return NextResponse.json(
                    { error: 'Jumlah pengeluaran (Kredit) harus lebih dari 0 dan tidak boleh minus.' },
                    { status: 400 }
                );
            }

            // Hitung HPP yang sudah tercatat sebelumnya untuk pesanan ini
            const existingHppRow = db.prepare(`
                SELECT COALESCE(SUM(amount_out), 0) as totalHpp
                FROM transactions
                WHERE order_id = ? AND category_group = 'HPP'
            `).get(orderId);
            const existingHpp = Number(existingHppRow?.totalHpp) || 0;
            const orderPrice = Number(order.price) || 0;
            const sisaPlafon = Math.max(0, orderPrice - existingHpp);

            if (amountOut > sisaPlafon) {
                return NextResponse.json(
                    { 
                        error: `Nominal HPP (Rp ${amountOut.toLocaleString('id-ID')}) melebihi sisa plafon anggaran proyek (Maksimal Rp ${sisaPlafon.toLocaleString('id-ID')}). Total nilai proyek: Rp ${orderPrice.toLocaleString('id-ID')}, HPP terpakai sebelumnya: Rp ${existingHpp.toLocaleString('id-ID')}.` 
                    },
                    { status: 400 }
                );
            }
        }

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

        // For DP transactions: handle pelunasan / cicilan lanjutan
        if (existing.type === 'dp' && existing.order_id) {
            // Keep the original DP transaction locked (do not overwrite its amount with cicilan)
            db.prepare(`
                UPDATE transactions SET date=?, customer=?,
                    category_group=?, category=?, category_sub=?, tx_type=?
                WHERE id=?
            `).run(
                body.date ?? existing.date,
                body.customer ?? existing.customer ?? '',
                body.category_group ?? existing.category_group ?? '',
                body.category ?? existing.category,
                body.category_sub ?? existing.category_sub ?? '',
                body.tx_type ?? existing.tx_type ?? 'debit',
                id
            );

            // Handle pembayaran baru (cicilan / pelunasan)
            const newPayment = parseInt(body.additional_payment) || 0;
            if (newPayment > 0) {
                const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(existing.order_id);
                const orderPrice = order ? (order.price || 0) : 0;
                const orderDp = order ? (order.dp || 0) : 0;
                const currentPelunasan = order ? (order.pelunasan || 0) : 0;
                const updatedPelunasan = currentPelunasan + newPayment;

                // Cek apakah dengan pembayaran ini total bayar (DP + updatedPelunasan) sudah >= orderPrice
                const isFullyPaid = (orderDp + updatedPelunasan) >= orderPrice;
                const txType = isFullyPaid ? 'pelunasan' : 'dp';
                const txDesc = isFullyPaid
                    ? `Pelunasan Pesanan ${existing.order_id} - ${order?.customer || ''}`
                    : `Cicilan Pesanan ${existing.order_id} - ${order?.customer || ''}`;

                db.prepare(`
                    INSERT INTO transactions (date, description, customer, category_group, category, category_sub, tx_type, amount_in, amount_out, order_id, type)
                    VALUES (?, ?, ?, 'Pendapatan', 'Penjualan', '', 'debit', ?, 0, ?, ?)
                `).run(
                    body.date ?? new Date().toISOString().split('T')[0],
                    txDesc,
                    order?.customer || '',
                    newPayment,
                    existing.order_id,
                    txType
                );

                // Jika pesanan sebelumnya memiliki piutang yang diikhlaskan, kurangi otomatis (Skenario A)
                const currentDiikhlaskan = order ? (parseInt(order.piutang_diikhlaskan, 10) || 0) : 0;
                let updatedDiikhlaskan = currentDiikhlaskan;
                let settlementLogs = [];
                try {
                    settlementLogs = JSON.parse(order.settlement_logs || '[]');
                    if (!Array.isArray(settlementLogs)) settlementLogs = [];
                } catch {
                    settlementLogs = [];
                }

                if (currentDiikhlaskan > 0) {
                    updatedDiikhlaskan = Math.max(0, currentDiikhlaskan - newPayment);
                    settlementLogs.push({
                        id: Date.now(),
                        action: 'pembayaran_susulan',
                        label: 'Pembayaran Susulan Diterima',
                        amount: newPayment,
                        new_diikhlaskan: updatedDiikhlaskan,
                        reason: `Pembayaran susulan diterima Rp ${newPayment.toLocaleString('id-ID')}. Sisa piutang diikhlaskan otomatis disesuaikan menjadi Rp ${updatedDiikhlaskan.toLocaleString('id-ID')}.`,
                        date: body.date ?? new Date().toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    });
                }

                db.prepare("UPDATE orders SET pelunasan = ?, piutang_diikhlaskan = ?, settlement_logs = ? WHERE id = ?").run(
                    updatedPelunasan,
                    updatedDiikhlaskan,
                    JSON.stringify(settlementLogs),
                    existing.order_id
                );
            }

            const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
            return NextResponse.json(updated);
        }

        // For normal (manual) transactions: standard update
        const targetCategoryGroup = body.category_group ?? existing.category_group;
        const targetOrderId = (body.linked_order ?? existing.order_id ?? '').trim();

        if (targetCategoryGroup === 'HPP' || targetOrderId) {
            if (!targetOrderId) {
                return NextResponse.json(
                    { error: 'Pesanan / Project wajib dipilih untuk pencatatan HPP.' },
                    { status: 400 }
                );
            }

            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(targetOrderId);
            if (!order) {
                return NextResponse.json(
                    { error: `Pesanan "${targetOrderId}" tidak ditemukan.` },
                    { status: 404 }
                );
            }

            const amountOut = Number(body.amount_out ?? existing.amount_out) || 0;
            if (amountOut <= 0) {
                return NextResponse.json(
                    { error: 'Jumlah pengeluaran (Kredit) harus lebih dari 0 dan tidak boleh minus.' },
                    { status: 400 }
                );
            }

            // Hitung HPP yang sudah tercatat KECUALI transaksi yang sedang diedit ini
            const existingHppRow = db.prepare(`
                SELECT COALESCE(SUM(amount_out), 0) as totalHpp
                FROM transactions
                WHERE order_id = ? AND category_group = 'HPP' AND id != ?
            `).get(targetOrderId, id);
            const existingHpp = Number(existingHppRow?.totalHpp) || 0;
            const orderPrice = Number(order.price) || 0;
            const sisaPlafon = Math.max(0, orderPrice - existingHpp);

            if (amountOut > sisaPlafon) {
                return NextResponse.json(
                    { 
                        error: `Nominal HPP (Rp ${amountOut.toLocaleString('id-ID')}) melebihi sisa plafon anggaran proyek (Maksimal Rp ${sisaPlafon.toLocaleString('id-ID')}).` 
                    },
                    { status: 400 }
                );
            }
        }

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

        // Block deletion of order-linked DP transactions
        if (existing.type === 'dp') {
            return NextResponse.json(
                { error: 'Transaksi DP tidak dapat dihapus manual.' },
                { status: 403 }
            );
        }

        // Void / cancel pelunasan transaction (Skenario A: Reset total semua pembayaran lanjutan)
        if (existing.type === 'pelunasan') {
            if (existing.order_id) {
                // Reset kolom pelunasan kembali ke 0 di tabel orders
                db.prepare('UPDATE orders SET pelunasan = 0 WHERE id = ?').run(existing.order_id);

                // Hapus semua transaksi cicilan lanjutan yang terkait dengan pesanan ini (kecuali DP awal asli)
                db.prepare(`
                    DELETE FROM transactions 
                    WHERE order_id = ? 
                      AND (type = 'pelunasan' OR (type = 'dp' AND description LIKE 'Cicilan%'))
                `).run(existing.order_id);
            } else {
                db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
            }

            return NextResponse.json({ 
                message: 'Pelunasan dan seluruh cicilan lanjutan berhasil di-void (dibersihkan). Pesanan kembali ke status DP awal.',
                id 
            });
        }

        db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Transaction deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
