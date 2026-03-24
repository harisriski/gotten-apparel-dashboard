import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let rawMaterials;
        if (category) {
            rawMaterials = db.prepare('SELECT * FROM inventory WHERE category = ?').all(category);
        } else {
            rawMaterials = db.prepare('SELECT * FROM inventory ORDER BY category').all();
        }

        const finishedStock = db.prepare('SELECT * FROM finished_stock').all();

        const grouped = {};
        rawMaterials.forEach(item => {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        });

        return NextResponse.json({ rawMaterials: grouped, finishedStock });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        if (body.type === 'finished_stock') {
            const stmt = db.prepare(`
                INSERT INTO finished_stock (product, color, s, m, l, xl, xxl, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                body.product, body.color,
                body.s || 0, body.m || 0, body.l || 0, body.xl || 0, body.xxl || 0,
                body.status || 'ok'
            );
            const newItem = db.prepare('SELECT * FROM finished_stock WHERE id = ?').get(result.lastInsertRowid);
            return NextResponse.json(newItem, { status: 201 });
        } else {
            const stmt = db.prepare(`
                INSERT INTO inventory (category, name, qty, unit, status, min_stock)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                body.category, body.name, body.qty, body.unit || '',
                body.status || 'ok', body.min_stock || '0'
            );
            const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
            return NextResponse.json(newItem, { status: 201 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();

        if (body.type === 'finished_stock') {
            const existing = db.prepare('SELECT * FROM finished_stock WHERE id = ?').get(body.id);
            if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

            db.prepare(`
                UPDATE finished_stock SET product=?, color=?, s=?, m=?, l=?, xl=?, xxl=?, status=?
                WHERE id=?
            `).run(
                body.product ?? existing.product,
                body.color ?? existing.color,
                body.s ?? existing.s,
                body.m ?? existing.m,
                body.l ?? existing.l,
                body.xl ?? existing.xl,
                body.xxl ?? existing.xxl,
                body.status ?? existing.status,
                body.id
            );
            const updated = db.prepare('SELECT * FROM finished_stock WHERE id = ?').get(body.id);
            return NextResponse.json(updated);
        } else {
            const { id, qty, status, name, category, unit, min_stock } = body;
            const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
            if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

            db.prepare(`
                UPDATE inventory SET name=?, category=?, qty=?, unit=?, status=?, min_stock=?
                WHERE id=?
            `).run(
                name ?? existing.name,
                category ?? existing.category,
                qty ?? existing.qty,
                unit ?? existing.unit,
                status ?? existing.status,
                min_stock ?? existing.min_stock,
                id
            );
            const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
            return NextResponse.json(updated);
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const idStr = searchParams.get('id');
        const type = searchParams.get('type');

        if (!idStr) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        const id = Number(idStr);

        if (type === 'finished_stock') {
            const existing = db.prepare('SELECT * FROM finished_stock WHERE id = ?').get(id);
            if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            db.prepare('DELETE FROM finished_stock WHERE id = ?').run(id);
        } else {
            const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
            if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
        }

        return NextResponse.json({ message: 'Item deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
