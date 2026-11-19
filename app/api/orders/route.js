import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let query = 'SELECT * FROM orders';
        const conditions = ['deleted_at IS NULL'];
        const params = [];

        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }
        if (search) {
            conditions.push('(id LIKE ? OR customer LIKE ? OR product LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (year) {
            conditions.push("substr(COALESCE(NULLIF(tanggal, ''), created_at), 1, 4) = ?");
            params.push(year);
        }
        if (month) {
            conditions.push("substr(COALESCE(NULLIF(tanggal, ''), created_at), 6, 2) = ?");
            params.push(month.padStart(2, '0'));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';

        const orders = db.prepare(query).all(...params);
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        // Validate deadline not before order date
        if (body.shipping_date && body.tanggal && body.shipping_date < body.tanggal) {
            return NextResponse.json(
                { error: 'Tanggal pengiriman (deadline) tidak boleh sebelum tanggal pesanan.' },
                { status: 400 }
            );
        }

        // Validate items: QTY (1 - 1.000.000) and Unit Price (0 - 999.000.000.000.000 / 15 digit)
        let itemsList = body.items;
        if (typeof itemsList === 'string') {
            try { itemsList = JSON.parse(itemsList); } catch { itemsList = []; }
        }
        if (Array.isArray(itemsList)) {
            for (const item of itemsList) {
                const q = Number(item.qty);
                if (isNaN(q) || q < 1 || q > 1000000) {
                    return NextResponse.json(
                        { error: `Qty produk "${item.description || 'Item'}" harus antara 1 sampai 1.000.000 pcs dan tidak boleh minus.` },
                        { status: 400 }
                    );
                }
                const p = Number(item.unit_price);
                if (isNaN(p) || p < 0 || p > 999999999999999) {
                    return NextResponse.json(
                        { error: `Harga satuan produk "${item.description || 'Item'}" tidak boleh minus dan maksimal 15 digit (Rp 999 Triliun).` },
                        { status: 400 }
                    );
                }
            }
        }

        // Validate non-negative financial fields
        if (body.potongan !== undefined && (Number(body.potongan) < 0 || Number(body.potongan) > 999999999999999)) {
            return NextResponse.json({ error: 'Nilai potongan tidak boleh minus dan maksimal 15 digit.' }, { status: 400 });
        }
        if (body.shipping_cost !== undefined && (Number(body.shipping_cost) < 0 || Number(body.shipping_cost) > 999999999999999)) {
            return NextResponse.json({ error: 'Biaya pengiriman tidak boleh minus dan maksimal 15 digit.' }, { status: 400 });
        }
        if (body.dp !== undefined && (Number(body.dp) < 0 || Number(body.dp) > 999999999999999)) {
            return NextResponse.json({ error: 'Down Payment (DP) tidak boleh minus dan maksimal 15 digit.' }, { status: 400 });
        }

        const lastOrder = db.prepare(`
            SELECT id FROM orders 
            WHERE id LIKE 'GTN-%'
            ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC 
            LIMIT 1
        `).get();
        let nextNum = 1;
        if (lastOrder) {
            const num = parseInt(lastOrder.id.replace('GTN-', ''));
            nextNum = isNaN(num) ? 1 : num + 1;
        }
        const newId = `GTN-${String(nextNum).padStart(4, '0')}`;

        const initialStatus = body.status || 'baru';
        const initialTanggalSelesai = (initialStatus === 'selesai' || initialStatus === 'dikirim')
            ? new Date().toISOString().split('T')[0]
            : null;

        const stmt = db.prepare(`
            INSERT INTO orders (
                id, customer, product, qty, price, status, deadline,
                tanggal, company, email, phone, address, items, subtotal, potongan, dp, shipping_cost,
                shipping_term, shipping_method, shipping_date, tanggal_selesai
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            newId,
            body.customer,
            body.product,
            body.qty,
            body.price,
            initialStatus,
            body.deadline || '',
            body.tanggal || '',
            body.company || '',
            body.email || '',
            body.phone || '',
            body.address || '',
            body.items ? JSON.stringify(body.items) : '[]',
            body.subtotal || 0,
            body.potongan || 0,
            body.dp || 0,
            body.shipping_cost || 0,
            body.shipping_term || '',
            body.shipping_method || '',
            body.shipping_date || '',
            initialTanggalSelesai
        );

        // Auto-create DP transaction if DP > 0
        const dpAmount = parseInt(body.dp) || 0;
        if (dpAmount > 0) {
            db.prepare(`
                INSERT INTO transactions (date, description, category_group, category, amount_in, amount_out, order_id, type)
                VALUES (?, ?, 'Pendapatan', 'Penjualan', ?, 0, ?, 'dp')
            `).run(
                body.tanggal || new Date().toISOString().split('T')[0],
                `DP Pesanan ${newId} - ${body.customer}`,
                dpAmount,
                newId
            );
        }

        // Auto-create Work Order for every new order
        const countRow = db.prepare('SELECT COUNT(*) as count FROM work_orders').get();
        const seq = String((countRow ? countRow.count : 0) + 1).padStart(4, '0');
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        const woNumber = `WO-${dateStr}-${seq}`;

        db.prepare(`
            INSERT INTO work_orders (wo_number, order_id, customer, team_name, status, designs, notes)
            VALUES (?, ?, ?, ?, 'pending', '[]', ?)
        `).run(
            woNumber,
            newId,
            body.customer || '',
            body.company || body.product || '',
            body.shipping_term ? `Ketentuan: ${body.shipping_term}` : ''
        );

        // Auto-sync customer to customers table
        if (body.customer && body.customer.trim()) {
            const custName = body.customer.trim();
            const existingCust = db.prepare('SELECT id FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1').get(custName);
            if (!existingCust) {
                db.prepare(`
                    INSERT INTO customers (name, company, phone, email, address, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    custName,
                    body.company || '',
                    body.phone || '',
                    body.email || '',
                    body.address || '',
                    body.tanggal || new Date().toISOString()
                );
            } else {
                // Update contact details if provided
                db.prepare(`
                    UPDATE customers SET
                        company = CASE WHEN ? != '' THEN ? ELSE company END,
                        phone = CASE WHEN ? != '' THEN ? ELSE phone END,
                        email = CASE WHEN ? != '' THEN ? ELSE email END,
                        address = CASE WHEN ? != '' THEN ? ELSE address END
                    WHERE id = ?
                `).run(
                    body.company || '', body.company || '',
                    body.phone || '', body.phone || '',
                    body.email || '', body.email || '',
                    body.address || '', body.address || '',
                    existingCust.id
                );
            }
        }

        const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newId);
        return NextResponse.json(newOrder, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
