'use client';

import { useState } from 'react';
import { downloadInvoice } from '@/lib/generateInvoice';
import { getOrderPaymentStatus, formatCurrency } from '@/lib/paymentStatus';

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusLabel(status) {
    const labels = { baru: '● Baru', proses: '● Diproses', selesai: '● Selesai', dikirim: '● Dikirim', pending: '● Pending' };
    return labels[status] || status;
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

    // Parse items
    let items = [];
    try {
        items = typeof currentOrder.items === 'string' ? JSON.parse(currentOrder.items) : (currentOrder.items || []);
    } catch (e) {
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

    // Section 1: Data Pelanggan
    const customerDetails = [
        { label: 'ID Pesanan', value: currentOrder.id },
        { label: 'Tanggal', value: formatDate(currentOrder.tanggal || currentOrder.created_at) },
        { label: 'Status Pesanan', value: null, badge: true },
        { label: 'Pelanggan', value: currentOrder.customer },
        { label: 'Tim / Perusahaan', value: currentOrder.company },
        { label: 'Produk', value: currentOrder.product },
        { label: 'No. WhatsApp / Phone', value: currentOrder.phone },
        { label: 'Email', value: currentOrder.email },
        { label: 'Alamat', value: currentOrder.address },
    ];

    // Section 3: Pengiriman
    const shippingDetails = [
        { label: 'Tanggal Pengiriman', value: formatDate(currentOrder.shipping_date || currentOrder.deadline) },
        { label: 'Metode Pengiriman', value: currentOrder.shipping_method },
        { label: 'Catatan Pengiriman', value: currentOrder.shipping_term },
    ];

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

    return (
        <div className="page-content" style={{ paddingBottom: '3rem' }}>
            <div className="form-page-header">
                <button className="btn-back" onClick={onBack}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 className="form-page-title" style={{ margin: 0 }}>📋 Detail Pesanan #{currentOrder.id}</h2>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: paymentStatus.status === 'lunas' ? 'rgba(16, 185, 129, 0.12)'
                            : paymentStatus.status === 'diikhlaskan' ? 'rgba(59, 130, 246, 0.12)'
                            : paymentStatus.status === 'macet' ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(245, 158, 11, 0.12)',
                        color: paymentStatus.color,
                        border: `1px solid ${paymentStatus.color}40`
                    }}>
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>{paymentStatus.icon}</span>
                        Status Pembayaran: {paymentStatus.label}
                    </span>
                </div>
            </div>

            {/* Banner Khusus jika Piutang Diikhlaskan */}
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
                            gap: '0.35rem'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>restart_alt</span>
                        Buka Kembali Tagihan
                    </button>
                </div>
            )}

            {/* Banner Peringatan Piutang Macet */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {/* SECTION 1: DATA PELANGGAN */}
                <div className="form-page-card" style={{ maxWidth: '100%' }}>
                    <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 700 }}>
                        1. Data Pelanggan &amp; Proyek
                    </h3>
                    {customerDetails.map((d, i) => (
                        <div className="detail-row" key={i} style={i === customerDetails.length - 1 ? { borderBottom: 'none' } : {}}>
                            <span className="detail-label">{d.label}</span>
                            <span className="detail-value">
                                {d.badge ? (
                                    <span className={`status-badge ${currentOrder.status}`}>{getStatusLabel(currentOrder.status)}</span>
                                ) : (
                                    d.value || '-'
                                )}
                            </span>
                        </div>
                    ))}
                </div>

                {/* SECTION 2: ORDER PRODUK */}
                {computedItems.length > 0 && (
                    <div className="form-page-card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 700 }}>
                            2. Rincian Order Produk
                        </h3>
                        <table className="data-table" style={{ minWidth: '500px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>No</th>
                                    <th style={{ width: '40%' }}>Deskripsi Produk</th>
                                    <th style={{ width: '15%' }}>Qty (Pcs)</th>
                                    <th style={{ width: '20%' }}>Harga / Unit</th>
                                    <th style={{ width: '20%' }}>Harga Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {computedItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.qty || 0}</td>
                                        <td>{formatCurrency(item.unit_price)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="form-row" style={{ alignItems: 'flex-start' }}>
                    {/* SECTION 3: PENGIRIMAN */}
                    <div className="form-page-card" style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 700 }}>
                            3. Informasi Pengiriman
                        </h3>
                        {shippingDetails.map((d, i) => (
                            <div className="detail-row" key={i} style={i === shippingDetails.length - 1 ? { borderBottom: 'none' } : {}}>
                                <span className="detail-label">{d.label}</span>
                                <span className="detail-value">{d.value || '-'}</span>
                            </div>
                        ))}
                    </div>

                    {/* SECTION 4: RINGKASAN & TOTAL */}
                    <div className="form-page-card" style={{ width: '420px', flexShrink: 0 }}>
                        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 700 }}>
                            4. Ringkasan Finansial &amp; Tagihan
                        </h3>

                        <div className="detail-row">
                            <span className="detail-label">Subtotal</span>
                            <span className="detail-value">{formatCurrency(subtotal)}</span>
                        </div>

                        {potonganAmount > 0 && (
                            <div className="detail-row">
                                <span className="detail-label">Potongan Harga</span>
                                <span className="detail-value" style={{ color: 'var(--accent-red)' }}>-{formatCurrency(potonganAmount)}</span>
                            </div>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Biaya Pengiriman</span>
                            <span className="detail-value">{formatCurrency(shippingCost)}</span>
                        </div>

                        <div className="detail-row" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                            <span className="detail-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Nilai Pesanan</span>
                            <span className="detail-value" style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                                {formatCurrency(total)}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Down Payment (DP)</span>
                            <span className="detail-value">{formatCurrency(dp)}</span>
                        </div>

                        {pelunasan > 0 && (
                            <div className="detail-row">
                                <span className="detail-label">Pelunasan / Cicilan</span>
                                <span className="detail-value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(pelunasan)}</span>
                            </div>
                        )}

                        {diikhlaskan > 0 && (
                            <div className="detail-row" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                                <span className="detail-label" style={{ color: '#3b82f6', fontWeight: 700 }}>Piutang Diikhlaskan</span>
                                <span className="detail-value" style={{ color: '#3b82f6', fontWeight: 800 }}>-{formatCurrency(diikhlaskan)}</span>
                            </div>
                        )}

                        <div className="detail-row" style={{ borderTop: '2px dashed var(--border-color)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
                            <span className="detail-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Dana Masuk</span>
                            <span className="detail-value" style={{ fontSize: '1.1rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                                {formatCurrency(dp + pelunasan)}
                            </span>
                        </div>

                        <div className="detail-row" style={{ borderBottom: 'none', paddingTop: '0.5rem' }}>
                            <span className="detail-label" style={{ fontWeight: 700 }}>Sisa Tagihan</span>
                            <span className="detail-value" style={{
                                color: paymentStatus.sisa > 0 ? (paymentStatus.isMacet ? '#ef4444' : 'var(--accent-yellow)') : 'var(--accent-green)',
                                fontWeight: 800,
                                fontSize: '1.05rem'
                            }}>
                                {paymentStatus.sisa > 0
                                    ? formatCurrency(paymentStatus.sisa)
                                    : (paymentStatus.isDiikhlaskan ? '✅ LUNAS (DIIKHLASKAN)' : '✅ LUNAS PENUH')
                                }
                            </span>
                        </div>

                        {/* Tombol Tutup Tagihan jika masih ada sisa */}
                        {paymentStatus.sisa > 0 && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    type="button"
                                    onClick={handleOpenCloseModal}
                                    style={{
                                        width: '100%',
                                        background: '#ea580c',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.6rem 1rem',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
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
                                    💡 Gunakan jika customer hanya mampu melunasi semampunya dan Anda menganggap proyek telah selesai.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 5: RIWAYAT TUTUP / BUKA TAGIHAN (SETTLEMENT LOGS) */}
                {settlementLogs.length > 0 && (
                    <div className="form-page-card" style={{ maxWidth: '100%' }}>
                        <h3 style={{
                            marginBottom: '1rem',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span className="material-icons-round" style={{ color: 'var(--accent-primary)' }}>history</span>
                            Riwayat Penyesuaian Tagihan (Settlement Logs)
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {settlementLogs.slice().reverse().map((log, idx) => (
                                <div
                                    key={log.id || idx}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        padding: '0.85rem 1.15rem',
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

                {/* ACTION BUTTONS */}
                <div className="form-page-card" style={{ maxWidth: '100%' }}>
                    <div className="form-page-actions" style={{ marginTop: '0' }}>
                        <button className="btn-secondary" onClick={onBack}>Kembali</button>
                        <button className="btn-secondary" onClick={() => downloadInvoice(currentOrder)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>picture_as_pdf</span>
                            Download Nota
                        </button>
                        <button className="btn-primary" onClick={() => onEdit(currentOrder)}>
                            <span className="material-icons-round" style={{ fontSize: '1rem', marginRight: '0.3rem' }}>edit</span>
                            Edit Pesanan
                        </button>
                    </div>
                </div>

            </div>

            {/* MODAL 1: TUTUP TAGIHAN (IKHLASKAN SISA) */}
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

            {/* MODAL 2: BUKA KEMBALI TAGIHAN */}
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
