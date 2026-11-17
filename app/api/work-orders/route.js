import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const orderId = searchParams.get('order_id');

        let query = 'SELECT * FROM work_orders';
        const conditions = [];
        const params = [];

        if (orderId) {
            conditions.push('order_id = ?');
            params.push(orderId);
        }
        if (search) {
            conditions.push('(wo_number LIKE ? OR order_id LIKE ? OR customer LIKE ? OR team_name LIKE ?)');
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY id DESC';

        const rows = db.prepare(query).all(...params);

        // Parse JSON fields
        const workOrders = rows.map(r => ({
            ...r,
            designs: (() => {
                try { return JSON.parse(r.designs || '[]'); } catch { return []; }
            })(),
            data_transaksi: (() => {
                try { return JSON.parse(r.data_transaksi || '{}'); } catch { return {}; }
            })(),
            spesifikasi_atasan: (() => {
                try { return JSON.parse(r.spesifikasi_atasan || '{}'); } catch { return {}; }
            })(),
            spesifikasi_celana: (() => {
                try { return JSON.parse(r.spesifikasi_celana || '{}'); } catch { return {}; }
            })(),
            timeline_kerja: (() => {
                try { return JSON.parse(r.timeline_kerja || '[]'); } catch { return []; }
            })(),
            data_ukuran: (() => {
                try { return JSON.parse(r.data_ukuran || '{}'); } catch { return {}; }
            })(),
            finishing_kemungkinan: (() => {
                try { return JSON.parse(r.finishing_kemungkinan || '{}'); } catch { return {}; }
            })(),
            notes_produksi: (() => {
                try { return JSON.parse(r.notes_produksi || '[]'); } catch { return []; }
            })(),
            bahan_dibeli: (() => {
                try { return JSON.parse(r.bahan_dibeli || '[]'); } catch { return []; }
            })()
        }));

        return NextResponse.json(workOrders);
    } catch (error) {
        console.error('GET work_orders error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        // Generate WO Number if not provided, e.g., WO-202611-0001
        let woNumber = body.wo_number;
        if (!woNumber) {
            const countRow = db.prepare('SELECT COUNT(*) as count FROM work_orders').get();
            const seq = String((countRow ? countRow.count : 0) + 1).padStart(4, '0');
            const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
            woNumber = `WO-${dateStr}-${seq}`;
        }

        const designsJson = typeof body.designs === 'string' ? body.designs : JSON.stringify(body.designs || []);
        const dataTransaksiJson = typeof body.data_transaksi === 'string' ? body.data_transaksi : JSON.stringify(body.data_transaksi || {});
        const spesifikasiAtasanJson = typeof body.spesifikasi_atasan === 'string' ? body.spesifikasi_atasan : JSON.stringify(body.spesifikasi_atasan || {});
        const spesifikasiCelanaJson = typeof body.spesifikasi_celana === 'string' ? body.spesifikasi_celana : JSON.stringify(body.spesifikasi_celana || {});
        const timelineKerjaJson = typeof body.timeline_kerja === 'string' ? body.timeline_kerja : JSON.stringify(body.timeline_kerja || []);
        const dataUkuranJson = typeof body.data_ukuran === 'string' ? body.data_ukuran : JSON.stringify(body.data_ukuran || {});
        const finishingKemungkinanJson = typeof body.finishing_kemungkinan === 'string' ? body.finishing_kemungkinan : JSON.stringify(body.finishing_kemungkinan || {});
        const notesProduksiJson = typeof body.notes_produksi === 'string' ? body.notes_produksi : JSON.stringify(body.notes_produksi || []);
        const bahanDibeliJson = typeof body.bahan_dibeli === 'string' ? body.bahan_dibeli : JSON.stringify(body.bahan_dibeli || []);

        const stmt = db.prepare(`
            INSERT INTO work_orders (wo_number, order_id, customer, team_name, status, designs, data_transaksi, spesifikasi_atasan, spesifikasi_celana, timeline_kerja, data_ukuran, finishing_kemungkinan, notes_produksi, bahan_dibeli, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            woNumber,
            body.order_id || '',
            body.customer || '',
            body.team_name || '',
            body.status || 'pending',
            designsJson,
            dataTransaksiJson,
            spesifikasiAtasanJson,
            spesifikasiCelanaJson,
            timelineKerjaJson,
            dataUkuranJson,
            finishingKemungkinanJson,
            notesProduksiJson,
            bahanDibeliJson,
            body.notes || ''
        );

        const created = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json({
            ...created,
            designs: JSON.parse(created.designs || '[]'),
            data_transaksi: JSON.parse(created.data_transaksi || '{}'),
            spesifikasi_atasan: JSON.parse(created.spesifikasi_atasan || '{}'),
            spesifikasi_celana: JSON.parse(created.spesifikasi_celana || '{}'),
            timeline_kerja: JSON.parse(created.timeline_kerja || '[]'),
            data_ukuran: JSON.parse(created.data_ukuran || '{}'),
            finishing_kemungkinan: JSON.parse(created.finishing_kemungkinan || '{}'),
            notes_produksi: JSON.parse(created.notes_produksi || '[]'),
            bahan_dibeli: JSON.parse(created.bahan_dibeli || '[]')
        }, { status: 201 });
    } catch (error) {
        console.error('POST work_orders error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const existing = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

        const designsJson = body.designs !== undefined
            ? (typeof body.designs === 'string' ? body.designs : JSON.stringify(body.designs))
            : existing.designs;
        const dataTransaksiJson = body.data_transaksi !== undefined
            ? (typeof body.data_transaksi === 'string' ? body.data_transaksi : JSON.stringify(body.data_transaksi))
            : existing.data_transaksi;
        const spesifikasiAtasanJson = body.spesifikasi_atasan !== undefined
            ? (typeof body.spesifikasi_atasan === 'string' ? body.spesifikasi_atasan : JSON.stringify(body.spesifikasi_atasan))
            : existing.spesifikasi_atasan;
        const spesifikasiCelanaJson = body.spesifikasi_celana !== undefined
            ? (typeof body.spesifikasi_celana === 'string' ? body.spesifikasi_celana : JSON.stringify(body.spesifikasi_celana))
            : existing.spesifikasi_celana;
        const timelineKerjaJson = body.timeline_kerja !== undefined
            ? (typeof body.timeline_kerja === 'string' ? body.timeline_kerja : JSON.stringify(body.timeline_kerja))
            : existing.timeline_kerja;
        const dataUkuranJson = body.data_ukuran !== undefined
            ? (typeof body.data_ukuran === 'string' ? body.data_ukuran : JSON.stringify(body.data_ukuran))
            : existing.data_ukuran;
        const finishingKemungkinanJson = body.finishing_kemungkinan !== undefined
            ? (typeof body.finishing_kemungkinan === 'string' ? body.finishing_kemungkinan : JSON.stringify(body.finishing_kemungkinan))
            : existing.finishing_kemungkinan;
        const notesProduksiJson = body.notes_produksi !== undefined
            ? (typeof body.notes_produksi === 'string' ? body.notes_produksi : JSON.stringify(body.notes_produksi))
            : existing.notes_produksi;
        const bahanDibeliJson = body.bahan_dibeli !== undefined
            ? (typeof body.bahan_dibeli === 'string' ? body.bahan_dibeli : JSON.stringify(body.bahan_dibeli))
            : existing.bahan_dibeli;

        db.prepare(`
            UPDATE work_orders 
            SET order_id = ?, customer = ?, team_name = ?, status = ?, designs = ?, data_transaksi = ?, spesifikasi_atasan = ?, spesifikasi_celana = ?, timeline_kerja = ?, data_ukuran = ?, finishing_kemungkinan = ?, notes_produksi = ?, bahan_dibeli = ?, notes = ?
            WHERE id = ?
        `).run(
            body.order_id ?? existing.order_id,
            body.customer ?? existing.customer,
            body.team_name ?? existing.team_name,
            body.status ?? existing.status,
            designsJson,
            dataTransaksiJson,
            spesifikasiAtasanJson,
            spesifikasiCelanaJson,
            timelineKerjaJson,
            dataUkuranJson,
            finishingKemungkinanJson,
            notesProduksiJson,
            bahanDibeliJson,
            body.notes ?? existing.notes,
            id
        );

        const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
        return NextResponse.json({
            ...updated,
            designs: JSON.parse(updated.designs || '[]'),
            data_transaksi: JSON.parse(updated.data_transaksi || '{}'),
            spesifikasi_atasan: JSON.parse(updated.spesifikasi_atasan || '{}'),
            spesifikasi_celana: JSON.parse(updated.spesifikasi_celana || '{}'),
            timeline_kerja: JSON.parse(updated.timeline_kerja || '[]'),
            data_ukuran: JSON.parse(updated.data_ukuran || '{}'),
            finishing_kemungkinan: JSON.parse(updated.finishing_kemungkinan || '{}'),
            notes_produksi: JSON.parse(updated.notes_produksi || '[]'),
            bahan_dibeli: JSON.parse(updated.bahan_dibeli || '[]')
        });
    } catch (error) {
        console.error('PUT work_orders error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const existing = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

        db.prepare('DELETE FROM work_orders WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Work order deleted', id });
    } catch (error) {
        console.error('DELETE work_orders error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
