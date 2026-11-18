import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

        if (!order) {
            return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
        }

        const body = await request.json();
        const action = body.action || 'close';

        let logs = [];
        try {
            logs = JSON.parse(order.settlement_logs || '[]');
            if (!Array.isArray(logs)) logs = [];
        } catch {
            logs = [];
        }

        const todayStr = new Date().toISOString().split('T')[0];

        if (action === 'close') {
            const totalPaid = (parseInt(order.dp, 10) || 0) + (parseInt(order.pelunasan, 10) || 0);
            const totalPrice = parseInt(order.price, 10) || 0;
            const currentSisa = Math.max(0, totalPrice - totalPaid);

            if (currentSisa <= 0) {
                return NextResponse.json({ error: 'Pesanan ini sudah lunas penuh, tidak ada sisa tagihan untuk diikhlaskan.' }, { status: 400 });
            }

            const inputAmount = body.amount !== undefined && body.amount !== null && body.amount !== ''
                ? parseInt(body.amount, 10)
                : currentSisa;

            if (isNaN(inputAmount) || inputAmount <= 0) {
                return NextResponse.json({ error: 'Nominal piutang diikhlaskan harus lebih dari Rp 0.' }, { status: 400 });
            }

            if (inputAmount > currentSisa) {
                return NextResponse.json({ error: `Nominal tidak boleh melebihi sisa tagihan (Maksimal Rp ${currentSisa.toLocaleString('id-ID')}).` }, { status: 400 });
            }

            const reason = body.reason?.trim() || 'Customer hanya mampu melunasi sebagian (kesepakatan)';
            const date = body.date || todayStr;

            logs.push({
                id: Date.now(),
                action: 'tutup',
                label: 'Tutup Tagihan (Piutang Diikhlaskan)',
                amount: inputAmount,
                reason,
                date,
                timestamp: new Date().toISOString()
            });

            db.prepare('UPDATE orders SET piutang_diikhlaskan = ?, settlement_logs = ? WHERE id = ?').run(
                inputAmount,
                JSON.stringify(logs),
                id
            );
        } else if (action === 'reopen') {
            const previousDiikhlaskan = parseInt(order.piutang_diikhlaskan, 10) || 0;
            const reason = body.reason?.trim() || 'Tagihan dibuka kembali untuk penagihan lanjutan';
            const date = body.date || todayStr;

            logs.push({
                id: Date.now(),
                action: 'buka',
                label: 'Buka Kembali Tagihan',
                amount: previousDiikhlaskan,
                reason,
                date,
                timestamp: new Date().toISOString()
            });

            db.prepare('UPDATE orders SET piutang_diikhlaskan = 0, settlement_logs = ? WHERE id = ?').run(
                JSON.stringify(logs),
                id
            );
        } else {
            return NextResponse.json({ error: 'Aksi settlement tidak valid' }, { status: 400 });
        }

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        return NextResponse.json({
            ...updatedOrder,
            settlement_logs: JSON.parse(updatedOrder.settlement_logs || '[]')
        });
    } catch (error) {
        console.error('POST settlement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
