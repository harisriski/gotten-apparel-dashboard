import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || '';
        const month = searchParams.get('month') || '';
        const search = (searchParams.get('search') || '').trim();
        const sort = searchParams.get('sort') || 'spent'; // 'spent' | 'qty' | 'orders'

        // 1. Sinkronisasi otomatis: Masukkan pelanggan unik dari orders ke tabel customers jika belum ada
        try {
            const orderCustomers = db.prepare(`
                SELECT DISTINCT TRIM(customer) as name, company, phone, email, address, COALESCE(NULLIF(tanggal, ''), created_at) as created_at
                FROM orders
                WHERE customer IS NOT NULL AND TRIM(customer) != ''
            `).all();

            const checkStmt = db.prepare('SELECT id FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1');
            const insertCustomerStmt = db.prepare(`
                INSERT INTO customers (name, company, phone, email, address, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const oc of orderCustomers) {
                const existing = checkStmt.get(oc.name);
                if (!existing) {
                    insertCustomerStmt.run(
                        oc.name,
                        oc.company || '',
                        oc.phone || '',
                        oc.email || '',
                        oc.address || '',
                        oc.created_at || new Date().toISOString()
                    );
                }
            }
        } catch (syncErr) {
            console.error('Customer auto-sync error:', syncErr);
        }

        // 2. Query klausa filter tanggal transaksi pesanan
        const dateWhere = [];
        const dateParams = [];
        if (year) {
            dateWhere.push("substr(COALESCE(NULLIF(tanggal, ''), created_at), 1, 4) = ?");
            dateParams.push(year);
        }
        if (month) {
            dateWhere.push("substr(COALESCE(NULLIF(tanggal, ''), created_at), 6, 2) = ?");
            dateParams.push(month.padStart(2, '0'));
        }
        const orderDateFilterSql = dateWhere.length > 0 ? ' AND ' + dateWhere.join(' AND ') : '';

        // 3. Query daftar pelanggan dasar
        let searchWhere = '';
        const searchParamsList = [];
        if (search) {
            searchWhere = ` AND (LOWER(c.name) LIKE ? OR LOWER(c.company) LIKE ? OR LOWER(c.phone) LIKE ?)`;
            const s = `%${search.toLowerCase()}%`;
            searchParamsList.push(s, s, s);
        }

        const customers = db.prepare(`
            SELECT c.* 
            FROM customers c
            WHERE 1=1 ${searchWhere}
            ORDER BY c.name ASC
        `).all(...searchParamsList);

        // 4. Enrich metrik pesanan tiap pelanggan pada periode terpilih
        const orderSummaryStmt = db.prepare(`
            SELECT 
                COUNT(*) as orderCount,
                COALESCE(SUM(qty), 0) as totalQty,
                COALESCE(SUM(price), 0) as totalSpent,
                MAX(COALESCE(NULLIF(tanggal, ''), created_at)) as latestOrder
            FROM orders
            WHERE LOWER(TRIM(customer)) = LOWER(TRIM(?)) ${orderDateFilterSql}
        `);

        const orderListStmt = db.prepare(`
            SELECT 
                id, product, qty, price, status, 
                COALESCE(NULLIF(tanggal, ''), created_at) as tanggal, 
                deadline, shipping_date
            FROM orders
            WHERE LOWER(TRIM(customer)) = LOWER(TRIM(?)) ${orderDateFilterSql}
            ORDER BY COALESCE(NULLIF(tanggal, ''), created_at) DESC
        `);

        let enriched = customers.map(c => {
            const stats = orderSummaryStmt.get(c.name, ...dateParams) || { orderCount: 0, totalQty: 0, totalSpent: 0, latestOrder: null };
            const orders = orderListStmt.all(c.name, ...dateParams) || [];

            const totalSpent = Number(stats.totalSpent) || 0;
            const totalQty = Number(stats.totalQty) || 0;
            const orderCount = Number(stats.orderCount) || 0;
            const averageOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;

            return {
                ...c,
                orderCount,
                totalQty,
                totalSpent,
                averageOrderValue,
                latestOrder: stats.latestOrder || null,
                orders
            };
        });

        // Jika filter tahun/bulan aktif, hanya tampilkan pelanggan yang ada pesanan di periode tsb
        if (year || month) {
            enriched = enriched.filter(c => c.orderCount > 0);
        }

        // 5. Sorting Leaderboard
        if (sort === 'qty') {
            enriched.sort((a, b) => (b.totalQty - a.totalQty) || (b.totalSpent - a.totalSpent) || (b.orderCount - a.orderCount));
        } else if (sort === 'orders') {
            enriched.sort((a, b) => (b.orderCount - a.orderCount) || (b.totalSpent - a.totalSpent) || (b.totalQty - a.totalQty));
        } else {
            // Default 'spent'
            enriched.sort((a, b) => (b.totalSpent - a.totalSpent) || (b.totalQty - a.totalQty) || (b.orderCount - a.orderCount));
        }

        // Tambahkan nomor peringkat (Rank #1, #2, dst)
        enriched = enriched.map((c, idx) => ({
            ...c,
            rank: idx + 1
        }));

        // 6. Ringkasan Keseluruhan (Summary Metrics)
        const totalCustomers = enriched.length;
        const totalRevenue = enriched.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalQty = enriched.reduce((sum, c) => sum + c.totalQty, 0);
        const totalOrders = enriched.reduce((sum, c) => sum + c.orderCount, 0);

        return NextResponse.json({
            customers: enriched,
            summary: {
                totalCustomers,
                totalRevenue,
                totalQty,
                totalOrders,
                topCustomer: enriched[0] || null
            }
        });
    } catch (error) {
        console.error('GET /api/customers error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        const stmt = db.prepare(`
            INSERT INTO customers (name, company, phone, email, address)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(body.name, body.company || '', body.phone || '', body.email || '', body.address || '');
        const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id } = body;

        const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const stmt = db.prepare(`
            UPDATE customers SET name=?, company=?, phone=?, email=?, address=?
            WHERE id=?
        `);

        stmt.run(
            body.name ?? existing.name,
            body.company ?? existing.company,
            body.phone ?? existing.phone,
            body.email ?? existing.email,
            body.address ?? existing.address,
            id
        );

        const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
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

        const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        db.prepare('DELETE FROM customers WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Customer deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
