'use client';

import { useState, useEffect } from 'react';

// ── Hierarchical Category Structure (3 Levels) ──────────────────────────────
const CATEGORY_TREE = {
    'Aset Lancar': {
        'Kas Bank': [],
        'Petty Cash': [],
        'Piutang': ['Piutang Penjualan', 'Piutang Non Penjualan'],
    },
    'Kewajiban Lancar': {
        'Utang': [],
    },
    "Owner's Equity": {
        'Prive': [],
        'Capital': [],
    },
    'Pendapatan': {
        'Penjualan': [],
        'Penjualan Lain-lain': [],
    },
    'HPP': {
        'Kain': [],
        'Print': [],
        'Kaos': [],
        'Sablon': [],
        'Jahit': [],
        'Kain Celana': [],
        'Jahit Celana': [],
        'Packing': [],
        'Kirim': [],
        'Persediaan': [],
        'Lain-lain': [],
    },
    'Biaya': {
        'Biaya Transfer & Admin Bank': [],
        'Biaya Iklan': [],
        'Biaya Listrik & Wifi': [],
        'Biaya Sosial Media': [],
        'Biaya R&D': [],
        'Biaya Gaji': [],
        'Zakat, Shodaqah & Sponsorship': [],
        'Biaya Lain-lain': [],
    },
};

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
                category_group: editTx.category_group || '',
                category: editTx.category || '',
                category_sub: editTx.category_sub || '',
                linked_order: editTx.order_id || '',
            };
        }
        return {
            date: '',
            description: '',
            customer: '',
            category_group: '',
            category: '',
            category_sub: '',
            amount_in: '',
            amount_out: '',
            txType: 'debit',
            linked_order: '',
        };
    });

    // For DP edits: load existing pelunasan from the order
    const [pelunasan, setPelunasan] = useState(0);
    const [orderInfo, setOrderInfo] = useState(null);

    // ── Active orders for dropdown (status: baru, proses) ──
    const [activeOrders, setActiveOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);

    useEffect(() => {
        if (isDpEdit && editTx.order_id) {
            fetch(`/api/orders/${editTx.order_id}`)
                .then(r => r.json())
                .then(order => {
                    setOrderInfo(order);
                    setPelunasan(order.pelunasan || 0);
                })
                .catch(err => console.error(err));
        }
    }, [isDpEdit, editTx?.order_id]);

    // Fetch active orders for dropdown
    useEffect(() => {
        if (isOrderTx) return; // Don't load for DP/pelunasan edits
        setLoadingOrders(true);
        fetch('/api/orders')
            .then(r => r.json())
            .then(orders => {
                // Filter: only baru & proses
                const filtered = orders.filter(o =>
                    o.status === 'baru' || o.status === 'proses'
                );
                setActiveOrders(filtered);
                setLoadingOrders(false);
            })
            .catch(err => { console.error(err); setLoadingOrders(false); });
    }, [isOrderTx]);

    // When linked_order changes, compute sisa tagihan
    useEffect(() => {
        if (!data.linked_order) {
            setSelectedOrderInfo(null);
            return;
        }
        const order = activeOrders.find(o => o.id === data.linked_order);
        if (order) {
            // Calculate total paid from transactions for this order
            fetch(`/api/finance`)
                .then(r => r.json())
                .then(finData => {
                    const txs = finData.transactions || [];
                    const paid = txs
                        .filter(t => t.order_id === order.id)
                        .reduce((sum, t) => sum + (t.amount_in || 0), 0);
                    const totalOrder = order.price || 0;
                    const sisaTagihan = Math.max(0, totalOrder - paid);
                    setSelectedOrderInfo({
                        ...order,
                        totalPaid: paid,
                        sisaTagihan,
                    });
                    setData(prev => ({ ...prev, customer: order.customer || '' }));
                })
                .catch(() => {
                    // Fallback: use dp + pelunasan from order table
                    const totalOrder = order.price || 0;
                    const dpPaid = order.dp || 0;
                    const pelPaid = order.pelunasan || 0;
                    setSelectedOrderInfo({
                        ...order,
                        totalPaid: dpPaid + pelPaid,
                        sisaTagihan: Math.max(0, totalOrder - dpPaid - pelPaid),
                    });
                    setData(prev => ({ ...prev, customer: order.customer || '' }));
                });
        }
    }, [data.linked_order, activeOrders]);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Derived dropdown options ──
    const groupOptions = Object.keys(CATEGORY_TREE);
    const categoryOptions = data.category_group ? Object.keys(CATEGORY_TREE[data.category_group] || {}) : [];
    const subOptions = (data.category_group && data.category)
        ? (CATEGORY_TREE[data.category_group]?.[data.category] || [])
        : [];

    function handleGroupChange(value) {
        setData({ ...data, category_group: value, category: '', category_sub: '' });
        setErrors(prev => ({ ...prev, category_group: '', category: '', category_sub: '' }));
    }

    function handleCategoryChange(value) {
        setData({ ...data, category: value, category_sub: '' });
        setErrors(prev => ({ ...prev, category: '', category_sub: '' }));
    }

    function handleSubChange(value) {
        setData({ ...data, category_sub: value });
        setErrors(prev => ({ ...prev, category_sub: '' }));
    }

    function validate() {
        const errs = {};
        if (!data.date) errs.date = 'Tanggal wajib diisi';
        if (!data.description?.trim()) errs.description = 'Deskripsi wajib diisi';
        if (!isOrderTx) {
            if (!data.category_group) errs.category_group = 'Grup kategori wajib dipilih';
            if (!data.category) errs.category = 'Kategori wajib dipilih';
            if (subOptions.length > 0 && !data.category_sub) errs.category_sub = 'Sub-kategori wajib dipilih';
        }

        const amount = data.txType === 'debit'
            ? parseInt(data.amount_in) || 0
            : parseInt(data.amount_out) || 0;
        if (!isDpEdit && amount <= 0) errs.amount = 'Jumlah harus lebih dari 0';

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
                category_group: data.category_group,
                category: data.category,
                category_sub: data.category_sub || '',
                tx_type: data.txType,
                amount_in: data.txType === 'debit' ? parseInt(data.amount_in) || 0 : 0,
                amount_out: data.txType === 'kredit' ? parseInt(data.amount_out) || 0 : 0,
                linked_order: data.linked_order || '',
            };

            // For DP edit: include pelunasan amount
            if (isDpEdit) {
                payload.amount_in = parseInt(data.amount_in) || 0;
                payload.pelunasan = parseInt(pelunasan) || 0;
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
            console.error(err);
        }
        setSaving(false);
    }

    // Calculate sisa tagihan for DP edit
    const totalOrder = orderInfo?.price || 0;
    const dpAmount = parseInt(data.amount_in) || 0;
    const pelunasanAmount = parseInt(pelunasan) || 0;
    const sisaTagihan = Math.max(0, totalOrder - dpAmount - pelunasanAmount);

    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">
                    {isDpEdit ? '✏️ Edit Transaksi DP' : isEdit ? '✏️ Edit Transaksi' : '💰 Tambah Transaksi'}
                </h2>
            </div>

            <div className="form-page-card">
                <form onSubmit={handleSubmit}>

                    {/* DP Info Banner */}
                    {isDpEdit && orderInfo && (
                        <div style={{
                            background: 'rgba(167, 139, 250, 0.08)',
                            border: '1px solid rgba(167, 139, 250, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem 1.25rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                                <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>link</span>
                                Terkait Pesanan: {editTx.order_id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                <span>Pelanggan: <strong>{orderInfo.customer}</strong></span>
                                <span>Produk: <strong>{orderInfo.product}</strong></span>
                                <span>Total Order: <strong>{formatCurrency(totalOrder)}</strong></span>
                            </div>
                        </div>
                    )}

                    {/* Row 1: Date + Transaction Type */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input className="form-input" type="date" required value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                            {errors.date && <span className="form-error">{errors.date}</span>}
                        </div>
                        {!isDpEdit && (
                            <div className="form-group">
                                <label className="form-label">Tipe Transaksi</label>
                                <select className="form-select" value={data.txType} onChange={e => setData({ ...data, txType: e.target.value })}>
                                    <option value="debit">Debit</option>
                                    <option value="kredit">Kredit</option>
                                </select>
                                <span className="form-hint">
                                    {data.txType === 'debit' ? '↗ Menambah saldo aset' : '↙ Mengurangi saldo aset'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Description & Customer */}
                    <div className="form-group">
                        <label className="form-label">Deskripsi</label>
                        <input className="form-input" required value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Deskripsi transaksi" readOnly={isDpEdit} style={isDpEdit ? { opacity: 0.7 } : {}} />
                        {errors.description && <span className="form-error">{errors.description}</span>}
                    </div>

                    {/* ── Pesanan Dropdown ── */}
                    {!isOrderTx && (
                        <div className="form-group">
                            <label className="form-label">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1rem', color: 'var(--accent-purple)' }}>receipt_long</span>
                                    Pesanan (Opsional)
                                </span>
                            </label>
                            <select
                                className="form-select"
                                value={data.linked_order}
                                onChange={e => setData({ ...data, linked_order: e.target.value })}
                                disabled={loadingOrders}
                                style={loadingOrders ? { opacity: 0.6 } : {}}
                            >
                                <option value="">— Tidak terkait pesanan —</option>
                                {activeOrders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.customer} — #{o.id} — {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                                    </option>
                                ))}
                            </select>
                            {/* Helper text: sisa tagihan */}
                            {selectedOrderInfo && (
                                <div className="order-sisa-tagihan">
                                    <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>info_outline</span>
                                    Sisa Tagihan: <strong>{formatCurrency(selectedOrderInfo.sisaTagihan)}</strong>
                                    <span className="order-sisa-detail">
                                        (Total: {formatCurrency(selectedOrderInfo.price)} — Terbayar: {formatCurrency(selectedOrderInfo.totalPaid)})
                                    </span>
                                </div>
                            )}
                            {!data.linked_order && (
                                <span className="form-hint">Pilih pesanan jika transaksi ini terkait dengan pesanan tertentu</span>
                            )}
                        </div>
                    )}

                    {/* Row 3: Hierarchical Category (3-Level) */}
                    <div className="form-section-title">
                        <span className="material-icons-round" style={{ fontSize: '1.1rem', color: 'var(--accent-purple)' }}>account_tree</span>
                        Kategori Akun
                    </div>
                    <div className="form-row form-row-3">
                        <div className="form-group">
                            <label className="form-label">Grup</label>
                            <select
                                className={`form-select ${errors.category_group ? 'form-select-error' : ''}`}
                                value={data.category_group}
                                onChange={e => handleGroupChange(e.target.value)}
                                disabled={isOrderTx}
                                style={isOrderTx ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                            >
                                <option value="">— Pilih Grup —</option>
                                {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {errors.category_group && <span className="form-error">{errors.category_group}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select
                                className={`form-select ${errors.category ? 'form-select-error' : ''}`}
                                value={data.category}
                                onChange={e => handleCategoryChange(e.target.value)}
                                disabled={isOrderTx || !data.category_group}
                                style={(isOrderTx || !data.category_group) ? { opacity: 0.7, cursor: isOrderTx ? 'not-allowed' : undefined } : {}}
                            >
                                <option value="">— Pilih Kategori —</option>
                                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.category && <span className="form-error">{errors.category}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sub-Kategori</label>
                            <select
                                className={`form-select ${errors.category_sub ? 'form-select-error' : ''}`}
                                value={data.category_sub}
                                onChange={e => handleSubChange(e.target.value)}
                                disabled={isOrderTx || subOptions.length === 0}
                                style={(isOrderTx || subOptions.length === 0) ? { opacity: 0.7, cursor: isOrderTx ? 'not-allowed' : undefined } : {}}
                            >
                                <option value="">{subOptions.length === 0 ? '— Tidak ada —' : '— Pilih Sub —'}</option>
                                {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.category_sub && <span className="form-error">{errors.category_sub}</span>}
                        </div>
                    </div>

                    {/* Category Preview Breadcrumb */}
                    {data.category_group && data.category && (
                        <div className="category-breadcrumb">
                            <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>chevron_right</span>
                            <span className="breadcrumb-item">{data.category_group}</span>
                            <span className="breadcrumb-sep">›</span>
                            <span className="breadcrumb-item">{data.category}</span>
                            {data.category_sub && (
                                <>
                                    <span className="breadcrumb-sep">›</span>
                                    <span className="breadcrumb-item active">{data.category_sub}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Row 4: Amount */}
                    <div className="form-group">
                        <label className="form-label">{isDpEdit ? 'Nominal DP (Rp)' : `Jumlah ${data.txType === 'debit' ? 'Debit' : 'Kredit'} (Rp)`}</label>
                        <input
                            className="form-input"
                            type="number"
                            required
                            placeholder="0"
                            value={isDpEdit ? data.amount_in : (data.txType === 'debit' ? data.amount_in : data.amount_out)}
                            onChange={e => {
                                if (isDpEdit) {
                                    setData({ ...data, amount_in: e.target.value });
                                } else if (data.txType === 'debit') {
                                    setData({ ...data, amount_in: e.target.value });
                                } else {
                                    setData({ ...data, amount_out: e.target.value });
                                }
                            }}
                        />
                        {errors.amount && <span className="form-error">{errors.amount}</span>}
                    </div>

                    {/* Pelunasan Field (only for DP edit) */}
                    {isDpEdit && (
                        <>
                            <div style={{ borderTop: '2px dashed var(--border-color)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.1rem', color: 'var(--accent-green)' }}>payments</span>
                                    Pelunasan Pembayaran
                                </h4>
                                <div className="form-group">
                                    <label className="form-label">Nominal Pelunasan (Rp)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={pelunasan}
                                        onChange={e => setPelunasan(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div style={{
                                background: 'rgba(148, 163, 184, 0.06)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem 1.25rem',
                                marginTop: '0.5rem',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Order</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(totalOrder)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Down Payment (DP)</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{formatCurrency(dpAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Pelunasan</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatCurrency(pelunasanAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sisa Tagihan</span>
                                    <span style={{ fontWeight: 700, color: sisaTagihan > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)', fontSize: '1rem' }}>
                                        {sisaTagihan > 0 ? formatCurrency(sisaTagihan) : '✅ LUNAS'}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-page-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : (isEdit ? 'Update Transaksi' : 'Simpan Transaksi')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
