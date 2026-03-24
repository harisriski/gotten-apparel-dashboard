import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        const stages = ['desain', 'cutting', 'sewing', 'sablon', 'qc', 'packing'];
        const pipeline = {};

        let dateFilter = '';
        const dateParams = [];
        if (year || month) {
            dateFilter = ' AND p.order_id IN (SELECT id FROM orders WHERE 1=1';
            if (year) { dateFilter += " AND strftime('%Y', created_at) = ?"; dateParams.push(year); }
            if (month) { dateFilter += " AND strftime('%m', created_at) = ?"; dateParams.push(month); }
            dateFilter += ')';
        }

        for (const stage of stages) {
            pipeline[stage] = db.prepare(`SELECT p.* FROM production p WHERE p.stage = ?${dateFilter}`).all(stage, ...dateParams);
        }

        return NextResponse.json(pipeline);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        const stmt = db.prepare(`
            INSERT INTO production (order_id, title, stage, qty, deadline)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            body.order_id,
            body.title,
            body.stage || 'desain',
            body.qty,
            body.deadline || ''
        );

        const newItem = db.prepare('SELECT * FROM production WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id } = body;

        const existing = db.prepare('SELECT * FROM production WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Production item not found' }, { status: 404 });

        db.prepare(`
            UPDATE production SET order_id=?, title=?, stage=?, qty=?, deadline=?
            WHERE id=?
        `).run(
            body.order_id ?? existing.order_id,
            body.title ?? existing.title,
            body.stage ?? existing.stage,
            body.qty ?? existing.qty,
            body.deadline ?? existing.deadline,
            id
        );

        const updated = db.prepare('SELECT * FROM production WHERE id = ?').get(id);
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

        const existing = db.prepare('SELECT * FROM production WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Production item not found' }, { status: 404 });

        db.prepare('DELETE FROM production WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Production item deleted', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
