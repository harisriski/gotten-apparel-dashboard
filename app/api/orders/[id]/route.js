import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const stmt = db.prepare(`
            UPDATE orders SET 
                customer=?, product=?, qty=?, price=?, status=?, deadline=?,
                tanggal=?, company=?, email=?, phone=?, address=?, items=?, subtotal=?, potongan=?, dp=?,
                shipping_cost=?, shipping_term=?, shipping_method=?, shipping_date=?
            WHERE id=?
        `);

        stmt.run(
            body.customer ?? existing.customer,
            body.product ?? existing.product,
            body.qty ?? existing.qty,
            body.price ?? existing.price,
            body.status ?? existing.status,
            body.deadline ?? existing.deadline,
            body.tanggal ?? existing.tanggal,
            body.company ?? existing.company,
            body.email ?? existing.email,
            body.phone ?? existing.phone,
            body.address ?? existing.address,
            body.items ? JSON.stringify(body.items) : existing.items,
            body.subtotal ?? existing.subtotal,
            body.potongan ?? existing.potongan,
            body.dp ?? existing.dp,
            body.shipping_cost ?? existing.shipping_cost,
            body.shipping_term ?? existing.shipping_term,
            body.shipping_method ?? existing.shipping_method,
            body.shipping_date ?? existing.shipping_date,
            id
        );

        const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

        // Sync DP transaction
        const newDp = parseInt(body.dp ?? existing.dp) || 0;
        const existingDpTx = db.prepare("SELECT * FROM transactions WHERE order_id = ? AND type = 'dp'").get(id);

        if (newDp > 0) {
            if (existingDpTx) {
                // Update existing DP transaction
                db.prepare("UPDATE transactions SET amount_in = ?, description = ?, date = ? WHERE id = ?").run(
                    newDp,
                    `DP Pesanan ${id} - ${updated.customer}`,
                    updated.tanggal || existingDpTx.date,
                    existingDpTx.id
                );
            } else {
                // Create new DP transaction
                db.prepare(`
                    INSERT INTO transactions (date, description, category, amount_in, amount_out, order_id, type)
                    VALUES (?, ?, ?, ?, 0, ?, 'dp')
                `).run(
                    updated.tanggal || new Date().toISOString().split('T')[0],
                    `DP Pesanan ${id} - ${updated.customer}`,
                    'Penjualan',
                    newDp,
                    id
                );
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Delete linked transactions (DP & Pelunasan) first
        db.prepare('DELETE FROM transactions WHERE order_id = ?').run(id);

        db.prepare('DELETE FROM orders WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Order deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
