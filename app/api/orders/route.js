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
        const conditions = [];
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
            conditions.push("strftime('%Y', created_at) = ?");
            params.push(year);
        }
        if (month) {
            conditions.push("strftime('%m', created_at) = ?");
            params.push(month);
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

        const lastOrder = db.prepare(`
            SELECT id FROM orders 
            ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC 
            LIMIT 1
        `).get();
        let nextNum = 149;
        if (lastOrder) {
            const num = parseInt(lastOrder.id.replace('ORD-', ''));
            nextNum = num + 1;
        }
        const newId = `ORD-${String(nextNum).padStart(4, '0')}`;

        const stmt = db.prepare(`
            INSERT INTO orders (
                id, customer, product, qty, price, status, deadline,
                tanggal, company, email, phone, address, items, subtotal, potongan, dp, shipping_cost,
                shipping_term, shipping_method, shipping_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            newId,
            body.customer,
            body.product,
            body.qty,
            body.price,
            body.status || 'baru',
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
            body.shipping_date || ''
        );

        const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newId);
        return NextResponse.json(newOrder, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
