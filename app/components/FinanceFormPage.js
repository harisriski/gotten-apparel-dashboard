'use client';

import { useState, useEffect } from 'react';

// ── Kategori HPP Khusus Industri Apparel / Konveksi ──────────────────────────
const HPP_CATEGORIES = [
    { value: 'Kain', label: 'Kain (Dryfit Milano, Serena, Brazil, dll)' },
    { value: 'Print', label: 'Print Sublim & Kertas Transfer' },
    { value: 'Sablon', label: 'Sablon Manual / DTF' },
    { value: 'Jahit', label: 'Ongkos Jahit & Obras Jersey' },
    { value: 'Kain Celana', label: 'Kain Celana' },
    { value: 'Jahit Celana', label: 'Jahit Celana' },
    { value: 'Bordir', label: 'Bordir Komputer' },
    { value: 'Packing', label: 'Packing, Label & Hangtag' },
    { value: 'Kirim', label: 'Ongkos Kirim Bahan / Cargo' },
    { value: 'Persediaan', label: 'Persediaan Bahan Baku' },
    { value: 'Lain-lain', label: 'Biaya HPP Lain-lain' },
];

function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

export default function FinanceFormPage({ editTx, onSave, onCancel }) {
    const isEdit = !!editTx;
    const isDpEdit = isEdit && editTx.type === 'dp';
    const isOrderTx = isEdit && (editTx.type === 'dp' || editTx.type === 'pelunasan');

    const [data, setData] = useState(() => {
        if (isEdit) {
            return {
                ...editTx,
                txType: editTx.tx_type || (editTx.amount_in > 0 ? 'debit' : 'kredit'),
                customer: editTx.customer || '',
                category_group: editTx.category_group || 'HPP',
                category: editTx.category || '',
                category_sub: editTx.category_sub || '',
                linked_order: editTx.order_id || '',
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            description: '',
            customer: '',
            category_group: 'HPP',
            category: '',
            category_sub: '',
            amount_in: '',
            amount_out: '',
            txType: 'kredit',
            linked_order: '',
        };
    });

    // For DP edits: load existing payments from the order
    const [newPayment, setNewPayment] = useState('');
    const [orderInfo, setOrderInfo] = useState(null);

    // Active orders for dropdown (status: baru & proses)
    const [activeOrders, setActiveOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);

    useEffect(() => {
        if (isDpEdit && editTx.order_id) {
            fetch(`/api/orders/${editTx.order_id}`)
                .then(r => r.json())
                .then(order => {
                    setOrderInfo(order);
                    setData(prev => ({ ...prev, amount_in: order.dp || editTx.amount_in }));
                })
                .catch(err => console.error(err));
        }
    }, [isDpEdit, editTx?.order_id, editTx?.amount_in]);

    // Fetch active orders for dropdown
    useEffect(() => {
        if (isOrderTx) return;
        setLoadingOrders(true);
        fetch('/api/orders')
            .then(r => r.json())
            .then(orders => {
                const filtered = orders.filter(o =>
                    o.status === 'baru' || o.status === 'proses'
                );
                setActiveOrders(filtered);
                setLoadingOrders(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingOrders(false);
            });
    }, [isOrderTx]);

    // When linked_order changes, compute HPP ceiling and project financials
    useEffect(() => {
        if (!data.linked_order) {
            setSelectedOrderInfo(null);
            return;
        }
        const order = activeOrders.find(o => o.id === data.linked_order);
        if (order) {
            fetch(`/api/finance`)
                .then(r => r.json())
                .then(finData => {
                    const txs = finData.transactions || [];
                    // HPP yang sudah pernah tercatat untuk order ini, exclude transaksi yang sedang diedit jika mode edit
                    const existingHpp = txs
                        .filter(t => t.order_id === order.id && t.category_group === 'HPP' && (!isEdit || t.id !== editTx?.id))
                        .reduce((sum, t) => sum + (t.amount_out || 0), 0);

                    const orderPrice = Number(order.price) || 0;
                    const sisaPlafon = Math.max(0, orderPrice - existingHpp);
                    const estimasiLaba = orderPrice - existingHpp;

                    setSelectedOrderInfo({
                        ...order,
                        orderPrice,
                        existingHpp,
                        sisaPlafon,
                        estimasiLaba,
                    });
                    setData(prev => ({ ...prev, customer: order.customer || '' }));
                })
                .catch(() => {
                    const orderPrice = Number(order.price) || 0;
                    setSelectedOrderInfo({
                        ...order,
                        orderPrice,
                        existingHpp: 0,
                        sisaPlafon: orderPrice,
                        estimasiLaba: orderPrice,
                    });
                    setData(prev => ({ ...prev, customer: order.customer || '' }));
                });
        }
    }, [data.linked_order, activeOrders, isEdit, editTx?.id]);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Validasi plafon HPP
    const amountOutNum = Number(data.amount_out) || 0;
    const isExceedingPlafon = Boolean(selectedOrderInfo && amountOutNum > selectedOrderInfo.sisaPlafon);

    const blockNegativeAndExponent = (e) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    function validate() {
        const errs = {};
        if (!data.date) errs.date = 'Tanggal wajib diisi';
        if (!data.description?.trim()) errs.description = 'Keterangan pengeluaran wajib diisi';
        if (!isOrderTx) {
            if (!data.linked_order) {
                errs.linked_order = 'Pilih pesanan / project (wajib untuk mencatat HPP)';
            }
            if (!data.category) {
                errs.category = 'Kategori HPP wajib dipilih';
            }
        }

        const amount = data.txType === 'debit'
            ? parseInt(data.amount_in, 10) || 0
            : parseInt(data.amount_out, 10) || 0;
        if (!isDpEdit && amount <= 0) errs.amount = 'Jumlah harus lebih dari 0 (tidak boleh minus atau 0)';

        if (!isDpEdit && isExceedingPlafon) {
            errs.amount = `Nominal melebihi sisa plafon anggaran proyek (Maksimal ${formatCurrency(selectedOrderInfo.sisaPlafon)}).`;
        }

        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                date: data.date,
                description: data.description,
                customer: data.customer,
                category_group: 'HPP',
                category: data.category,
                category_sub: '',
                tx_type: 'kredit',
                amount_in: 0,
                amount_out: parseInt(data.amount_out, 10) || 0,
                linked_order: data.linked_order || '',
            };

            // For DP edit: include additional payment
            if (isDpEdit) {
                payload.amount_in = parseInt(data.amount_in, 10) || 0;
                payload.amount_out = 0;
                payload.tx_type = 'debit';
                payload.category_group = data.category_group || 'Pendapatan';
                payload.category = data.category || 'Penjualan';
                payload.additional_payment = parseInt(newPayment, 10) || 0;
            }

            let res;
            if (isEdit) {
                payload.id = data.id;
                res = await fetch('/api/finance', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/finance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            if (res.ok) onSave();
        } catch (err) {
            console.error('Submit transaction error:', err);
        }
        setSaving(false);
    }

    // ── PERHITUNGAN LIVE UNTUK KOLOM KANAN ──
    const orderPrice = selectedOrderInfo?.orderPrice || 0;
    const existingHpp = selectedOrderInfo?.existingHpp || 0;
    const sisaPlafon = selectedOrderInfo?.sisaPlafon || 0;
    const inputAmount = Number(data.amount_out) || 0;

    const usedPctBefore = orderPrice > 0 ? Math.min(100, Math.round((existingHpp / orderPrice) * 100)) : 0;
    const newTotalHpp = existingHpp + inputAmount;
    const newUsedPct = orderPrice > 0 ? Math.min(100, Math.round((newTotalHpp / orderPrice) * 100)) : 0;
    const newSisaPlafon = orderPrice - newTotalHpp;
    const newNetProfit = orderPrice - newTotalHpp;
    const newMargin = orderPrice > 0 ? ((newNetProfit / orderPrice) * 100) : 0;

    // ── DP EDIT VIEW (Pertahankan fungsionalitas cicilan/pelunasan DP) ──
    if (isDpEdit) {
        const totalOrder = orderInfo?.price || 0;
        const dpAmount = parseInt(orderInfo?.dp ?? data.amount_in, 10) || 0;
        const previousPelunasan = parseInt(orderInfo?.pelunasan, 10) || 0;
        const totalPaidBeforeNow = dpAmount + previousPelunasan;
        const currentSisa = Math.max(0, totalOrder - totalPaidBeforeNow);
        const inputPayment = parseInt(newPayment, 10) || 0;
        const remainingAfterThis = Math.max(0, currentSisa - inputPayment);

        return (
            <div className="page-content" style={{ paddingBottom: '3rem' }}>
                <div className="form-page-header">
                    <button className="btn-back" onClick={onCancel}>
                        <span className="material-icons-round">arrow_back</span>
                        Kembali
                    </button>
                    <h2 className="form-page-title">✏️ Edit Transaksi DP &amp; Pelunasan</h2>
                </div>

                <div className="form-page-card" style={{ maxWidth: '640px' }}>
                    <form onSubmit={handleSubmit}>
                        {orderInfo && (
                            <div style={{
                                background: 'rgba(167, 139, 250, 0.08)',
                                border: '1px solid rgba(167, 139, 250, 0.2)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.35rem' }}>
                                    🔗 Terkait Pesanan: #{editTx.order_id}
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    Pelanggan: <strong>{orderInfo.customer}</strong> • Total Tagihan: <strong>{formatCurrency(totalOrder)}</strong>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Tanggal Transaksi</label>
                            <input className="form-input" type="date" required value={data.date} onChange={e => setData({ ...data, date: e.target.value })} style={{ height: '38px' }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nominal DP Awal (Rp)</label>
                            <input className="form-input" type="number" readOnly value={data.amount_in} style={{ height: '38px', background: 'rgba(148, 163, 184, 0.1)', cursor: 'not-allowed', fontWeight: 700 }} />
                            <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                🔒 Nominal DP awal terkunci sesuai invoice awal.
                            </span>
                        </div>

                        <div style={{ borderTop: '2px dashed var(--border-color)', margin: '1.5rem 0', paddingTop: '1.25rem' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-green)', margin: '0 0 0.5rem 0' }}>
                                Input Pembayaran Lanjutan (Cicilan / Pelunasan)
                            </h4>
                            <div className="form-group">
                                <label className="form-label">Nominal yang Dibayarkan Hari Ini (Rp)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    max={currentSisa}
                                    placeholder="0"
                                    value={newPayment}
                                    onKeyDown={blockNegativeAndExponent}
                                    onChange={e => setNewPayment(e.target.value.replace(/[^0-9]/g, ''))}
                                    style={{ height: '42px', fontSize: '1.05rem', fontWeight: 700 }}
                                />
                            </div>

                            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Sisa Tagihan Saat Ini:</span>
                                    <strong style={{ color: '#f59e0b' }}>{formatCurrency(currentSisa)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                                    <span>Sisa Tagihan Setelah Ini:</span>
                                    <strong style={{ color: remainingAfterThis === 0 ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
                                        {remainingAfterThis === 0 ? '✅ LUNAS' : formatCurrency(remainingAfterThis)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="form-page-actions" style={{ marginTop: '1.25rem' }}>
                            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ── LAYOUT 2-KOLOM MODERN UNTUK HPP PROJECT ──
    return (
        <div className="page-content" style={{ paddingBottom: '4rem' }}>
            {/* Header Form */}
            <div className="form-page-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn-back" onClick={onCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-icons-round">arrow_back</span>
                        Kembali ke Arus Kas
                    </button>
                    <h2 className="form-page-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                        {isEdit ? '✏️ Edit Pengeluaran HPP Project' : 'Catat HPP Project Baru'}
                    </h2>
                </div>
            </div>

            {/* Kontainer 2-Kolom */}
            <form onSubmit={handleSubmit}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                }}>

                    {/* ══════════════════════════════════════════════════════
                        👈 KOLOM KIRI: FORM INPUT HPP (FLEX 1)
                        ══════════════════════════════════════════════════════ */}
                    <div style={{
                        flex: '1 1 480px',
                        minWidth: '320px',
                        background: 'var(--bg-card)',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>

                        {/* SECTION 1: PROYEK PESANAN */}
                        <div>
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.5rem'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--accent-primary)' }}>receipt_long</span>
                                1. Pilih Proyek Pesanan Terkait <span style={{ color: '#ef4444' }}>*</span>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Nomor Pesanan / SPK &amp; Pelanggan
                                </label>
                                <select
                                    className={`form-select ${errors.linked_order ? 'form-select-error' : ''}`}
                                    value={data.linked_order}
                                    onChange={e => {
                                        setData({ ...data, linked_order: e.target.value });
                                        setErrors(prev => ({ ...prev, linked_order: '' }));
                                    }}
                                    disabled={loadingOrders}
                                    style={{
                                        height: '40px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        borderColor: errors.linked_order ? '#ef4444' : undefined,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">— Pilih Project Pesanan (Baru / Diproses) —</option>
                                    {activeOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.id} — {o.customer} ({o.company || 'Umum'}) • {o.product || 'Jersey'} — Rp {Number(o.price || 0).toLocaleString('id-ID')}
                                        </option>
                                    ))}
                                </select>
                                {errors.linked_order && (
                                    <span className="form-error" style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                                        {errors.linked_order}
                                    </span>
                                )}
                                {!data.linked_order && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                                        💡 Hanya menampilkan pesanan berstatus aktif (Baru &amp; Diproses).
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* SECTION 2: KATEGORI & KETERANGAN PENGELUARAN */}
                        <div>
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.5rem'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--accent-purple)' }}>category</span>
                                2. Kategori &amp; Rincian HPP
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Dropdown Kategori HPP Langsung Bersih */}
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        Kategori Biaya HPP <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        className={`form-select ${errors.category ? 'form-select-error' : ''}`}
                                        value={data.category}
                                        onChange={e => {
                                            setData({ ...data, category: e.target.value });
                                            setErrors(prev => ({ ...prev, category: '' }));
                                        }}
                                        style={{
                                            height: '40px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            borderColor: errors.category ? '#ef4444' : undefined,
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="">— Pilih Jenis Pengeluaran HPP —</option>
                                        {HPP_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <span className="form-error" style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                                            {errors.category}
                                        </span>
                                    )}
                                </div>

                                {/* Tanggal Transaksi & Nama Pelanggan Auto-filled */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                            Tanggal Pengeluaran <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            className="form-input"
                                            type="date"
                                            required
                                            value={data.date}
                                            onChange={e => setData({ ...data, date: e.target.value })}
                                            style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        {errors.date && <span className="form-error" style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.date}</span>}
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                            Customer / Rekanan Terkait
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={data.customer || (selectedOrderInfo?.customer ? `${selectedOrderInfo.customer} (${selectedOrderInfo.company || 'Umum'})` : '')}
                                            readOnly
                                            placeholder="Otomatis dari pesanan terpilih"
                                            style={{ height: '38px', background: 'var(--bg-secondary)', cursor: 'default', width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                {/* Keterangan / Deskripsi Pengeluaran */}
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        Keterangan Pengeluaran / Nama Toko / Vendor <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        className="form-input"
                                        required
                                        value={data.description}
                                        onChange={e => {
                                            setData({ ...data, description: e.target.value });
                                            setErrors(prev => ({ ...prev, description: '' }));
                                        }}
                                        placeholder="Contoh: Beli bahan kain dryfit milano 2 roll di Toko Jaya Textile"
                                        style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    {errors.description && (
                                        <span className="form-error" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                                            {errors.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: NOMINAL PENGELUARAN (KREDIT RP) */}
                        <div>
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.5rem'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '1.15rem', color: '#059669' }}>payments</span>
                                3. Nominal Pengeluaran (Kredit) <span style={{ color: '#ef4444' }}>*</span>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    Jumlah Biaya HPP (Rp)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        max={selectedOrderInfo ? selectedOrderInfo.sisaPlafon : undefined}
                                        required
                                        placeholder="0"
                                        value={data.amount_out}
                                        onKeyDown={blockNegativeAndExponent}
                                        onChange={e => {
                                            const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                            setData({ ...data, amount_out: cleaned });
                                            setErrors(prev => ({ ...prev, amount: '' }));
                                        }}
                                        style={{
                                            height: '44px',
                                            fontSize: '1.15rem',
                                            fontWeight: 800,
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            borderColor: isExceedingPlafon ? '#ef4444' : (amountOutNum > 0 ? '#059669' : undefined),
                                            background: isExceedingPlafon ? 'rgba(239, 68, 68, 0.05)' : undefined
                                        }}
                                    />
                                </div>

                                {/* Alert Peringatan Melebihi Plafon */}
                                {isExceedingPlafon && (
                                    <div style={{
                                        color: '#ef4444',
                                        fontSize: '0.8rem',
                                        marginTop: '0.5rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        borderRadius: '6px',
                                        padding: '0.45rem 0.75rem'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>error_outline</span>
                                        Nominal melebihi sisa plafon anggaran proyek (Maksimal: {formatCurrency(selectedOrderInfo.sisaPlafon)}).
                                    </div>
                                )}
                                {errors.amount && !isExceedingPlafon && (
                                    <span className="form-error" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                                        {errors.amount}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onCancel}
                                style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={saving || isExceedingPlafon || !data.linked_order}
                                title={isExceedingPlafon ? 'Perbaiki nominal yang melebihi plafon sebelum menyimpan' : undefined}
                                style={{
                                    padding: '0.55rem 1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    opacity: (saving || isExceedingPlafon || !data.linked_order) ? 0.6 : 1,
                                    cursor: (saving || isExceedingPlafon || !data.linked_order) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {saving ? 'Menyimpan...' : (isEdit ? 'Update Transaksi HPP' : 'Simpan Transaksi HPP')}
                            </button>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        👉 KOLOM KANAN: KARTU LIVE STATUS FINANSIAL & SIMULASI
                        ══════════════════════════════════════════════════════ */}
                    <div style={{
                        width: '380px',
                        flexShrink: 0,
                        position: 'sticky',
                        top: '90px'
                    }}>
                        {!selectedOrderInfo ? (
                            /* State Kosong / Belum Memilih Pesanan */
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '14px',
                                padding: '2.5rem 1.5rem',
                                textAlign: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>
                                    account_balance_wallet
                                </span>
                                <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>
                                    Status Finansial Proyek
                                </h4>
                                <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                                    Pilih proyek pesanan di sebelah kiri untuk melihat ringkasan nilai kontrak, HPP terpakai, dan sisa plafon laba proyek secara live.
                                </p>
                            </div>
                        ) : (
                            /* Card Live Finansial Proyek */
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '14px',
                                border: '1px solid var(--border-color)',
                                padding: '1.25rem',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                {/* Header Ringkasan Proyek */}
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            color: 'var(--accent-primary)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '6px'
                                        }}>
                                            #{selectedOrderInfo.id}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                            Status: <strong>{selectedOrderInfo.status}</strong>
                                        </span>
                                    </div>
                                    <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {selectedOrderInfo.customer}
                                    </h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        🏢 {selectedOrderInfo.company || 'Pelanggan Umum'} • {selectedOrderInfo.product || 'Jersey Custom'}
                                    </div>
                                </div>

                                {/* Metrik Utama Anggaran */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Nilai Pesanan:</span>
                                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                            {formatCurrency(orderPrice)}
                                        </strong>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>HPP Terpakai Sebelumnya:</span>
                                        <strong style={{ color: '#f59e0b' }}>
                                            {formatCurrency(existingHpp)} ({usedPctBefore}%)
                                        </strong>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderTop: '1px dashed var(--border-color)',
                                        paddingTop: '0.5rem'
                                    }}>
                                        <span style={{ color: '#059669', fontWeight: 700 }}>Sisa Plafon Anggaran:</span>
                                        <strong style={{ fontSize: '1.05rem', color: sisaPlafon > 0 ? '#059669' : '#ef4444' }}>
                                            {formatCurrency(sisaPlafon)}
                                        </strong>
                                    </div>
                                </div>

                                {/* Progress Bar HPP Terpakai */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                                        <span>Persentase HPP Terpakai</span>
                                        <strong>{inputAmount > 0 ? `${newUsedPct}%` : `${usedPctBefore}%`}</strong>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${Math.min(100, inputAmount > 0 ? newUsedPct : usedPctBefore)}%`,
                                            height: '100%',
                                            background: (inputAmount > 0 ? newUsedPct : usedPctBefore) > 80 ? '#ef4444' : ((inputAmount > 0 ? newUsedPct : usedPctBefore) > 60 ? '#f59e0b' : '#10b981'),
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>

                                {/* ⚡ Simulasi Real-Time Setelah Transaksi Ini */}
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    border: `1px solid ${isExceedingPlafon ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                                    borderRadius: '10px',
                                    padding: '0.85rem 1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    fontSize: '0.82rem'
                                }}>
                                    <div style={{
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        color: isExceedingPlafon ? '#ef4444' : 'var(--accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        borderBottom: '1px dashed var(--border-color)',
                                        paddingBottom: '0.4rem'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>analytics</span>
                                        Simulasi Finansial Proyek
                                    </div>

                                    {inputAmount > 0 ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>+ Biaya Transaksi Ini:</span>
                                                <strong style={{ color: '#ef4444' }}>+{formatCurrency(inputAmount)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Total HPP Menjadi:</span>
                                                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(newTotalHpp)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                                                <span>Sisa Plafon Anggaran:</span>
                                                <strong style={{ color: newSisaPlafon >= 0 ? '#059669' : '#ef4444' }}>
                                                    {newSisaPlafon >= 0 ? formatCurrency(newSisaPlafon) : `Defisit ${formatCurrency(Math.abs(newSisaPlafon))}`}
                                                </strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                                                <span style={{ fontWeight: 700 }}>Estimasi Laba Bersih Proyek:</span>
                                                <strong style={{ color: newNetProfit >= 0 ? '#059669' : '#ef4444', fontSize: '0.95rem' }}>
                                                    {formatCurrency(newNetProfit)} ({newMargin.toFixed(1)}%)
                                                </strong>
                                            </div>
                                            <div style={{
                                                marginTop: '0.2rem',
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                background: newNetProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                color: newNetProfit >= 0 ? '#059669' : '#ef4444'
                                            }}>
                                                {isExceedingPlafon ? '⚠️ Plafon Anggaran Jebol!' : (newMargin >= 40 ? '🌟 Margin Proyek Sangat Sehat' : '✅ Proyek Masih Profit')}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0', fontSize: '0.78rem' }}>
                                            Ketik nominal pengeluaran di sebelah kiri untuk melihat simulasi sisa laba bersih proyek.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </form>
        </div>
    );
}
