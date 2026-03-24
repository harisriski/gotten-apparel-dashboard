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

        const customers = db.prepare(`SELECT * FROM customers WHERE 1=1${dateFilter} ORDER BY name`).all(...dateParams);

        // Enrich with order data
        const enriched = customers.map(c => {
            const orderData = db.prepare(`
                SELECT COUNT(*) as orderCount, COALESCE(SUM(price), 0) as totalSpent
                FROM orders WHERE customer = ?
            `).get(c.name);

            return {
                ...c,
                orderCount: orderData.orderCount,
                totalSpent: orderData.totalSpent,
            };
        });

        return NextResponse.json(enriched);
    } catch (error) {
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
