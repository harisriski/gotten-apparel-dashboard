'use client';

import { useState } from 'react';
import { downloadInvoice } from '@/lib/generateInvoice';
import { getOrderPaymentStatus, formatCurrency } from '@/lib/paymentStatus';

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

function getStatusLabel(status) {
    const labels = {
        baru: 'Baru',
        proses: 'Diproses',
        selesai: 'Selesai',
        dikirim: 'Dikirim',
        pending: 'Pending'
    };
    return labels[status] || status;
}

function getStatusColor(status) {
    switch (status) {
        case 'baru': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' };
        case 'proses': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)' };
        case 'selesai': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)' };
        case 'dikirim': return { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', border: 'rgba(99, 102, 241, 0.25)' };
        default: return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.25)' };
    }
}

export default function OrderDetailPage({ order, onBack, onEdit }) {
    if (!order) return null;

    const [currentOrder, setCurrentOrder] = useState(order);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleReason, setSettleReason] = useState('Customer hanya mampu melunasi sebagian (kesepakatan)');
    const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [reopenReason, setReopenReason] = useState('Tagihan dibuka kembali untuk penagihan lanjutan');
    const [loadingAction, setLoadingAction] = useState(false);
    const [actionError, setActionError] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);

    function getTrackingWaUrl(ord) {
        const rawPhone = (ord.phone || '').replace(/[^0-9]/g, '');
        let targetPhone = rawPhone;
        if (targetPhone.startsWith('0')) targetPhone = '62' + targetPhone.slice(1);

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const trackUrl = `${origin}/lacak?id=${ord.id}`;

        const text = `Halo Kak ${ord.customer || ''}, terima kasih telah mempercayakan pembuatan jersey di Gotten Apparel! ✨

Berikut kami lampirkan Nomor Pesanan Anda:
Nomor Pesanan: *${ord.id}*
Pesanan: ${ord.product || ''} (${ord.qty || 1} pcs)
${ord.company ? `Tim/Instansi: ${ord.company}\n` : ''}
Anda dapat memantau progres pengerjaan, mockup desain jersey, dan visualisasi timeline kerja secara real-time melalui link berikut:
${trackUrl}

Jika ada pertanyaan atau konfirmasi, silakan hubungi kami ya. Salam hangat dari tim Gotten Apparel! 🙏`;

        return targetPhone
            ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    // Parse items
    let items = [];
    try {
        items = typeof currentOrder.items === 'string' ? JSON.parse(currentOrder.items) : (currentOrder.items || []);
    } catch {
        items = [];
    }

    // Calculate items
    const computedItems = items.map(item => ({
        ...item,
        price: (parseInt(item.qty, 10) || 0) * (parseInt(item.unit_price, 10) || 0)
    }));
    const subtotal = currentOrder.subtotal || computedItems.reduce((sum, item) => sum + item.price, 0);
    const potonganAmount = parseInt(currentOrder.potongan, 10) || 0;
    const shippingCost = parseInt(currentOrder.shipping_cost, 10) || 0;
    const total = currentOrder.price || (subtotal - potonganAmount + shippingCost);
    const dp = parseInt(currentOrder.dp, 10) || 0;
    const pelunasan = parseInt(currentOrder.pelunasan, 10) || 0;
    const diikhlaskan = parseInt(currentOrder.piutang_diikhlaskan, 10) || 0;

    // Status Pembayaran Terpusat
    const paymentStatus = getOrderPaymentStatus(currentOrder);
    const orderStatusColor = getStatusColor(currentOrder.status);

    // Parse settlement logs
    let settlementLogs = [];
    try {
        settlementLogs = typeof currentOrder.settlement_logs === 'string'
            ? JSON.parse(currentOrder.settlement_logs || '[]')
            : (currentOrder.settlement_logs || []);
        if (!Array.isArray(settlementLogs)) settlementLogs = [];
    } catch {
        settlementLogs = [];
    }

    function handleOpenCloseModal() {
        setSettleAmount(String(paymentStatus.sisa));
        setSettleReason('Customer hanya mampu melunasi sebagian (kesepakatan)');
        setSettleDate(new Date().toISOString().split('T')[0]);
        setActionError('');
        setShowCloseModal(true);
    }

    async function handleConfirmClose(e) {
        e.preventDefault();
        const amt = parseInt(settleAmount, 10);
        if (isNaN(amt) || amt <= 0) {
            setActionError('Nominal piutang yang diikhlaskan harus lebih dari 0.');
            return;
        }
        if (amt > paymentStatus.sisa) {
            setActionError(`Nominal tidak boleh melebihi sisa tagihan (${formatCurrency(paymentStatus.sisa)}).`);
            return;
        }

        setLoadingAction(true);
        setActionError('');
        try {
            const res = await fetch(`/api/orders/${currentOrder.id}/settlement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'close',
                    amount: amt,
                    reason: settleReason,
                    date: settleDate,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setActionError(data.error || 'Gagal menutup tagihan.');
            } else {
                setCurrentOrder(data);
                setShowCloseModal(false);
            }
        } catch (err) {
            console.error(err);
            setActionError('Terjadi kesalahan jaringan.');
        }
        setLoadingAction(false);
    }

    async function handleConfirmReopen(e) {
        e.preventDefault();
        setLoadingAction(true);
        setActionError('');
        try {
            const res = await fetch(`/api/orders/${currentOrder.id}/settlement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reopen',
                    reason: reopenReason,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setActionError(data.error || 'Gagal membuka kembali tagihan.');
            } else {
                setCurrentOrder(data);
                setShowReopenModal(false);
            }
        } catch (err) {
            console.error(err);
            setActionError('Terjadi kesalahan jaringan.');
        }
        setLoadingAction(false);
    }

    const cleanPhone = (currentOrder.phone || '').replace(/[^0-9]/g, '');
    const waChatUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
        : null;

    return (
        <div className="page-content" style={{ paddingBottom: '3.5rem' }}>
            {/* ── HEADER HALAMAN DENGAN AKSI CEPAT (COMPACT SINGLE-LINE TOOLBAR) ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
                marginBottom: '1.25rem'
            }}>
                {/* Sisi Kiri: Tombol Kembali + Judul + Badges Menyamping */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn-back"
                        onClick={onBack}
                        style={{
                            margin: 0,
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            height: '34px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>arrow_back</span>
                        Kembali
                    </button>

                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em'
                    }}>
                        Pesanan #{currentOrder.id}
                    </h2>

                    {/* Badge Status Produksi */}
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: orderStatusColor.bg,
                        color: orderStatusColor.color,
                        border: `1px solid ${orderStatusColor.border}`
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: orderStatusColor.color
                        }} />
                        {getStatusLabel(currentOrder.status)}
                    </span>

                    {/* Badge Status Pembayaran */}
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: paymentStatus.status === 'lunas' ? 'rgba(16, 185, 129, 0.12)'
                            : paymentStatus.status === 'diikhlaskan' ? 'rgba(59, 130, 246, 0.12)'
                            : paymentStatus.status === 'macet' ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(245, 158, 11, 0.12)',
                        color: paymentStatus.color,
                        border: `1px solid ${paymentStatus.color}40`
                    }}>
                        <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>{paymentStatus.icon}</span>
                        {paymentStatus.label}
                    </span>

                    {currentOrder.company && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            • <strong>{currentOrder.company}</strong>
                        </span>
                    )}
                </div>

                {/* Sisi Kanan: Aksi Cepat Menyamping Terkunci 1 Baris (Single Row, No-Wrap) */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexWrap: 'nowrap',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginLeft: 'auto'
                }}>
                    <button
                        type="button"
                        onClick={() => downloadInvoice(currentOrder)}
                        className="btn-secondary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            height: '34px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                        title="Download Nota Invoice Pesanan (PDF)"
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem', color: '#ef4444' }}>picture_as_pdf</span>
                        Download Nota
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit(currentOrder)}
                        className="btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            height: '34px',
                            width: 'auto',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                        title="Ubah data pesanan ini"
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>edit</span>
                        Edit Pesanan
                    </button>

                    <a
                        href={getTrackingWaUrl(currentOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.85rem',
                            background: '#25D366',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            height: '34px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(37, 211, 102, 0.25)'
                        }}
                        title="Kirim nomor pesanan & link pelacakan langsung ke WhatsApp pemesan"
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>chat</span>
                        Kirim Lacak ke WA
                    </a>
                </div>
            </div>

            {/* ── BANNER KHUSUS: PIUTANG DIIKHLASKAN ── */}
            {paymentStatus.isDiikhlaskan && (
                <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-icons-round" style={{ fontSize: '2rem', color: '#3b82f6' }}>handshake</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                Tagihan Ditutup dengan Piutang Diikhlaskan ({formatCurrency(diikhlaskan)})
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                Proyek telah disepakati selesai. Customer membayar semampunya ({formatCurrency(dp + pelunasan)}), dan sisa piutang diikhlaskan.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowReopenModal(true); setActionError(''); }}
                        className="btn-secondary"
                        style={{
                            fontSize: '0.82rem',
                            padding: '0.45rem 1rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            borderRadius: '8px'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>restart_alt</span>
                        Buka Kembali Tagihan
                    </button>
                </div>
            )}

            {/* ── BANNER KHUSUS: PERINGATAN PIUTANG MACET ── */}
            {paymentStatus.isMacet && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-icons-round" style={{ fontSize: '2rem', color: '#ef4444' }}>error_outline</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ef4444' }}>
                                Peringatan: Piutang Macet ({paymentStatus.daysLate} Hari Melebihi Batas Waktu)
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                Sisa tagihan aktif sebesar <strong>{formatCurrency(paymentStatus.sisa)}</strong> belum diselesaikan setelah 30 hari.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCloseModal}
                        style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>handshake</span>
                        Tutup Tagihan (Ikhlaskan Sisa)
                    </button>
                </div>
            )}

            {/* ── TATA LETAK 2 KOLOM (KIRI: DATA & RINCIAN, KANAN: FINANSIAL & LACAK) ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 380px',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* ════════ KOLOM KIRI (KONTEN UTAMA) ════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* KARTU 1: DATA PELANGGAN & PENGIRIMAN (GRID 2 SUB-KOLOM RAPI) */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.85rem',
                            marginBottom: '1.25rem'
                        }}>
                            <span className="material-icons-round" style={{ color: 'var(--accent-primary)', fontSize: '1.35rem' }}>
                                badge
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Data Pelanggan &amp; Pengiriman
                            </h3>
                        </div>

                        {/* Grid Informasi 2 Bagian */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {/* Sub-kolom A: Data Pemesan */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px dashed var(--border-color)',
                                    paddingBottom: '0.35rem'
                                }}>
                                    Kontak &amp; Identitas Pemesan
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nama Pemesan:</span>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                                        {currentOrder.customer || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tim / Instansi / Komunitas:</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                                        {currentOrder.company || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nomor WhatsApp / Telp:</span>
                                    <div style={{ marginTop: '0.15rem' }}>
                                        {currentOrder.phone ? (
                                            <a
                                                href={waChatUrl || `tel:${currentOrder.phone}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 700,
                                                    color: '#25D366',
                                                    textDecoration: 'none'
                                                }}
                                                title="Buka obrolan WhatsApp"
                                            >
                                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>chat</span>
                                                {currentOrder.phone}
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>-</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email:</span>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                        {currentOrder.email || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alamat Pengiriman:</span>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.5 }}>
                                        {currentOrder.address || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Sub-kolom B: Detail Pesanan & Pengiriman */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px dashed var(--border-color)',
                                    paddingBottom: '0.35rem'
                                }}>
                                    Jadwal &amp; Ekspedisi
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kategori Produk Utama:</span>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                                        {currentOrder.product || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Jumlah (Qty):</span>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.1rem' }}>
                                        {currentOrder.qty ? `${currentOrder.qty} pcs` : '-'}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tanggal Pesanan Masuk:</span>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                                        {formatDate(currentOrder.tanggal || currentOrder.created_at)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deadline / Jadwal Pengiriman:</span>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ea580c', marginTop: '0.1rem' }}>
                                        {formatDate(currentOrder.shipping_date || currentOrder.deadline)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Metode Pengiriman:</span>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                                        {currentOrder.shipping_method || 'Diambil di Workshop / Ekspedisi'}
                                    </div>
                                </div>

                                {currentOrder.shipping_term && (
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Catatan Pengiriman:</span>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontStyle: 'italic' }}>
                                            "{currentOrder.shipping_term}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KARTU 2: RINCIAN ORDER PRODUK (TABEL ITEM) */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons-round" style={{ color: 'var(--accent-primary)', fontSize: '1.35rem' }}>
                                    inventory_2
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Rincian Produk Pesanan
                                </h3>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {computedItems.length} item terdaftar
                            </span>
                        </div>

                        {computedItems.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', minWidth: '480px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                                            <th>Deskripsi Item Produk</th>
                                            <th style={{ width: '90px', textAlign: 'center' }}>Qty (Pcs)</th>
                                            <th style={{ width: '130px', textAlign: 'right' }}>Harga Satuan</th>
                                            <th style={{ width: '140px', textAlign: 'right' }}>Total Harga</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {computedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {item.description || '-'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {item.qty || 0}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(item.price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                            <td colSpan="2" style={{ textAlign: 'right', paddingRight: '1rem', color: 'var(--text-secondary)' }}>
                                                Total Qty Produk:
                                            </td>
                                            <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                                                {computedItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)} pcs
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                Subtotal:
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                                {formatCurrency(subtotal)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                                <span className="material-icons-round" style={{ fontSize: '2.5rem' }}>inventory</span>
                                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Belum ada rincian item produk yang dimasukkan.</div>
                            </div>
                        )}
                    </div>

                    {/* KARTU 3: RIWAYAT PENYESUAIAN TAGIHAN (SETTLEMENT LOGS) */}
                    {settlementLogs.length > 0 && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.85rem',
                                marginBottom: '1rem'
                            }}>
                                <span className="material-icons-round" style={{ color: 'var(--accent-primary)', fontSize: '1.35rem' }}>
                                    history
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Riwayat Penyesuaian Tagihan (Settlement Logs)
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {settlementLogs.slice().reverse().map((log, idx) => (
                                    <div
                                        key={log.id || idx}
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '10px',
                                            padding: '0.85rem 1rem',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span
                                                className="material-icons-round"
                                                style={{
                                                    fontSize: '1.5rem',
                                                    color: log.action === 'tutup' ? '#3b82f6' : log.action === 'pembayaran_susulan' ? '#10b981' : '#f59e0b'
                                                }}
                                            >
                                                {log.action === 'tutup' ? 'handshake' : log.action === 'pembayaran_susulan' ? 'payments' : 'restart_alt'}
                                            </span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    {log.label || (log.action === 'tutup' ? 'Tutup Tagihan' : log.action === 'pembayaran_susulan' ? 'Pembayaran Susulan' : 'Buka Kembali')}
                                                    {log.amount > 0 && (
                                                        <span style={{ marginLeft: '0.5rem', color: log.action === 'pembayaran_susulan' ? '#10b981' : '#3b82f6' }}>
                                                            ({formatCurrency(log.amount)})
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                                    Alasan: <em>"{log.reason}"</em>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                            {formatDate(log.date)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ════════ KOLOM KANAN (SIDEBAR FINANSIAL & PELACAKAN) ════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* SIDEBAR KARTU 1: RINGKASAN FINANSIAL & TAGIHAN */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            <span className="material-icons-round" style={{ color: 'var(--accent-primary)', fontSize: '1.35rem' }}>
                                receipt_long
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Ringkasan Finansial
                            </h3>
                        </div>

                        {/* Rincian Angka */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal Produk:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
                            </div>

                            {potonganAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Potongan Harga:</span>
                                    <span style={{ fontWeight: 600, color: '#ef4444' }}>-{formatCurrency(potonganAmount)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Biaya Pengiriman:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(shippingCost)}</span>
                            </div>

                            <div style={{
                                borderTop: '1px dashed var(--border-color)',
                                paddingTop: '0.65rem',
                                marginTop: '0.2rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Total Nilai Pesanan:</span>
                                <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Down Payment (DP):</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(dp)}</span>
                                </div>

                                {pelunasan > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Pelunasan / Cicilan:</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(pelunasan)}</span>
                                    </div>
                                )}

                                {diikhlaskan > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.85rem',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        padding: '0.35rem 0.5rem',
                                        borderRadius: '6px',
                                        marginBottom: '0.45rem'
                                    }}>
                                        <span style={{ color: '#2563eb', fontWeight: 600 }}>Piutang Diikhlaskan:</span>
                                        <span style={{ fontWeight: 700, color: '#2563eb' }}>-{formatCurrency(diikhlaskan)}</span>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.85rem',
                                    borderTop: '1px dashed var(--border-color)',
                                    paddingTop: '0.45rem',
                                    marginTop: '0.2rem'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Total Dana Masuk:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(dp + pelunasan)}</span>
                                </div>
                            </div>

                            {/* Kotak Highlight Sisa Tagihan */}
                            <div style={{
                                marginTop: '0.5rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                background: paymentStatus.sisa > 0
                                    ? (paymentStatus.isMacet ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)')
                                    : 'rgba(16, 185, 129, 0.08)',
                                border: `1.5px solid ${paymentStatus.sisa > 0
                                    ? (paymentStatus.isMacet ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')
                                    : 'rgba(16, 185, 129, 0.3)'
                                    }`
                            }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: paymentStatus.sisa > 0 ? (paymentStatus.isMacet ? '#dc2626' : '#d97706') : '#059669',
                                    display: 'block'
                                }}>
                                    Sisa Tagihan
                                </span>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 900,
                                    color: paymentStatus.sisa > 0 ? (paymentStatus.isMacet ? '#dc2626' : '#d97706') : '#059669',
                                    marginTop: '0.15rem'
                                }}>
                                    {paymentStatus.sisa > 0
                                        ? formatCurrency(paymentStatus.sisa)
                                        : (paymentStatus.isDiikhlaskan ? 'Lunas (Diikhlaskan)' : 'Lunas Penuh')
                                    }
                                </div>
                            </div>

                            {/* Tombol Tutup Tagihan jika masih ada sisa */}
                            {paymentStatus.sisa > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleOpenCloseModal}
                                        style={{
                                            width: '100%',
                                            background: '#ea580c',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '0.65rem 1rem',
                                            fontWeight: 700,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.45rem',
                                            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>handshake</span>
                                        Tutup Tagihan (Ikhlaskan Sisa)
                                    </button>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem', textAlign: 'center', lineHeight: 1.4 }}>
                                        💡 Gunakan jika customer hanya mampu melunasi semampunya.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR KARTU 2: HUB PELACAKAN PESANAN CUSTOMER */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            <span className="material-icons-round" style={{ color: 'var(--accent-primary)', fontSize: '1.35rem' }}>
                                travel_explore
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Pelacakan Pesanan
                            </h3>
                        </div>

                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Pelanggan dapat memantau progres pesanan ini secara mandiri di landing page menggunakan Nomor Pesanan:
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                                #{currentOrder.id}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                    navigator.clipboard.writeText(`${origin}/lacak?id=${currentOrder.id}`);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.6rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    color: copiedLink ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>
                                    {copiedLink ? 'check' : 'content_copy'}
                                </span>
                                {copiedLink ? 'Tersalin' : 'Salin Link'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <a
                                href={`/lacak?id=${currentOrder.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem',
                                    padding: '0.55rem 0.85rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    textDecoration: 'none'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>open_in_new</span>
                                Buka Tampilan Customer
                            </a>

                            <a
                                href={getTrackingWaUrl(currentOrder)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.45rem',
                                    padding: '0.55rem 0.85rem',
                                    background: '#25D366',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    textDecoration: 'none',
                                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>chat</span>
                                Bagikan ke WhatsApp
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── MODAL 1: TUTUP TAGIHAN (IKHLASKAN SISA) ── */}
            {showCloseModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '520px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(234, 88, 12, 0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons-round" style={{ color: '#ea580c', fontSize: '1.5rem' }}>handshake</span>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Tutup Tagihan (Ikhlaskan Sisa)</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCloseModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleConfirmClose} style={{ padding: '1.5rem' }}>
                            <div style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                padding: '0.85rem 1rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.82rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem'
                            }}>
                                <div>Pesanan: <strong>#{currentOrder.id}</strong> — {currentOrder.customer}</div>
                                <div>Total Nilai Pesanan: <strong>{formatCurrency(total)}</strong></div>
                                <div>Total Sudah Dibayar: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(dp + pelunasan)}</strong></div>
                                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                                    Sisa Tagihan Belum Lunas: <strong style={{ color: '#ea580c', fontSize: '0.95rem' }}>{formatCurrency(paymentStatus.sisa)}</strong>
                                </div>
                            </div>

                            {actionError && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    fontSize: '0.82rem'
                                }}>
                                    {actionError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Nominal Piutang yang Diikhlaskan (Rp) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    required
                                    min="1"
                                    max={paymentStatus.sisa}
                                    value={settleAmount}
                                    onChange={e => setSettleAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                    style={{ height: '42px', fontSize: '1.1rem', fontWeight: 800 }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                    Default terisi seluruh sisa tagihan ({formatCurrency(paymentStatus.sisa)}).
                                </span>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Tanggal Kesepakatan Selesai <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    required
                                    value={settleDate}
                                    onChange={e => setSettleDate(e.target.value)}
                                    style={{ height: '38px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Alasan / Catatan Penutupan Tagihan <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    required
                                    value={settleReason}
                                    onChange={e => setSettleReason(e.target.value)}
                                    placeholder="Contoh: Customer hanya mampu melunasi semampunya, proyek disepakati selesai."
                                    style={{ fontSize: '0.85rem', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCloseModal(false)}
                                    disabled={loadingAction}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingAction}
                                    style={{
                                        background: '#ea580c',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.6rem 1.25rem',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        cursor: loadingAction ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}
                                >
                                    {loadingAction ? 'Memproses...' : 'Konfirmasi Tutup Tagihan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: BUKA KEMBALI TAGIHAN ── */}
            {showReopenModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '480px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(59, 130, 246, 0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons-round" style={{ color: '#3b82f6', fontSize: '1.5rem' }}>restart_alt</span>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Buka Kembali Tagihan</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReopenModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReopen} style={{ padding: '1.5rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                                Anda akan mengembalikan piutang sebesar <strong>{formatCurrency(diikhlaskan)}</strong> menjadi status tagihan aktif kembali.
                            </p>

                            {actionError && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    fontSize: '0.82rem'
                                }}>
                                    {actionError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Alasan Membuka Kembali Tagihan <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    required
                                    value={reopenReason}
                                    onChange={e => setReopenReason(e.target.value)}
                                    placeholder="Contoh: Customer sepakat melunasi sisa tagihan kembali."
                                    style={{ fontSize: '0.85rem', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowReopenModal(false)}
                                    disabled={loadingAction}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? 'Memproses...' : 'Ya, Buka Kembali Tagihan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
