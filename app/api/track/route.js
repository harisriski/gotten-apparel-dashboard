import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

const DEFAULT_TIMELINE_TASKS = [
    { id: 'beli_kain', tugas: 'Beli Kain', durasi: '1', pic: '', ci: '', isCustom: false },
    { id: 'cutting', tugas: 'Cutting', durasi: '0', pic: '', ci: '', isCustom: false },
    { id: 'printing', tugas: 'Printing/Sablon', durasi: '5', pic: '', ci: '', isCustom: false },
    { id: 'jahit', tugas: 'Jahit', durasi: '14', pic: '', ci: '', isCustom: false },
    { id: 'qc', tugas: 'QC', durasi: '1', pic: '', ci: '', isCustom: false },
    { id: 'packing_kirim', tugas: 'Packing + Kirim', durasi: '1', pic: '', ci: '', isCustom: false },
];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawId = searchParams.get('id') || '';
        const id = rawId.trim().toUpperCase();

        if (!id) {
            return NextResponse.json(
                { error: 'Silakan masukkan Nomor Pesanan (contoh: GTN-0001).' },
                { status: 400 }
            );
        }

        const db = getDb();

        // 1. Cari pesanan aktif (tidak berada di tempat sampah)
        const order = db.prepare(`
            SELECT id, customer, company, product, qty, status, deadline, tanggal,
                   shipping_date, shipping_method, created_at
            FROM orders
            WHERE UPPER(TRIM(id)) = ? AND deleted_at IS NULL
        `).get(id);

        if (!order) {
            return NextResponse.json(
                {
                    error: `Nomor pesanan ${id} tidak ditemukan. Silakan periksa kembali tanda terima pesanan Anda atau hubungi Admin Gotten.`,
                    searchId: id
                },
                { status: 404 }
            );
        }

        // 2. Ambil data Work Order terkait untuk mockup desain dan timeline kerja
        const wo = db.prepare(`
            SELECT team_name, designs, timeline_kerja, data_transaksi
            FROM work_orders
            WHERE order_id = ? AND deleted_at IS NULL
            LIMIT 1
        `).get(order.id);

        // Parse designs (Mockup Desain Jersey)
        let designs = [];
        if (wo && wo.designs) {
            try {
                const parsed = typeof wo.designs === 'string' ? JSON.parse(wo.designs) : wo.designs;
                if (Array.isArray(parsed)) {
                    designs = parsed.filter(d => d && (d.url || d.previewUrl || d.fileName));
                }
            } catch {
                designs = [];
            }
        }

        // Parse timeline kerja (Dinamis jika ada baris sisipan tambahan)
        let timelineKerja = DEFAULT_TIMELINE_TASKS;
        if (wo && wo.timeline_kerja) {
            try {
                const parsed = typeof wo.timeline_kerja === 'string' ? JSON.parse(wo.timeline_kerja) : wo.timeline_kerja;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    timelineKerja = parsed.map((item, idx) => ({
                        id: item.id || `task_${idx}`,
                        tugas: item.tugas || `Tahapan ${idx + 1}`,
                        durasi: item.durasi !== undefined ? String(item.durasi) : '1',
                        pic: item.pic || '',
                        ci: item.ci || '',
                        mulai: item.mulai || '',
                        selesai: item.selesai || '',
                        isCustom: !DEFAULT_TIMELINE_TASKS.some(d => d.tugas === item.tugas)
                    }));
                }
            } catch {
                timelineKerja = DEFAULT_TIMELINE_TASKS;
            }
        }

        const trackingPayload = {
            id: order.id,
            customer: order.customer,
            team_name: wo?.team_name || order.company || '',
            product: order.product,
            qty: order.qty,
            status: order.status, // 'baru' | 'proses' | 'selesai' | 'dikirim' | 'pending'
            order_date: order.tanggal || order.created_at,
            deadline: order.shipping_date || order.deadline,
            shipping_method: order.shipping_method || 'Ekspedisi / Ambil di Tempat',
            designs,
            timeline_kerja: timelineKerja,
        };

        return NextResponse.json(trackingPayload);
    } catch (error) {
        console.error('Tracking API error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan sistem saat melacak pesanan.' }, { status: 500 });
    }
}
