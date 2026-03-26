'use client';

import { useState, useEffect } from 'react';

const categoryOptions = ['Penjualan', 'Bahan Baku', 'Operasional', 'Pengiriman', 'Gaji', 'Lain-lain'];

function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

export default function FinanceFormPage({ editTx, onSave, onCancel }) {
    const isEdit = !!editTx;
    const isDpEdit = isEdit && editTx.type === 'dp';

    const [data, setData] = useState(
        isEdit
            ? { ...editTx, txType: editTx.amount_in > 0 ? 'in' : 'out' }
            : { date: '', description: '', category: 'Penjualan', amount_in: '', amount_out: '', txType: 'in' }
    );

    // For DP edits: load existing pelunasan from the order
    const [pelunasan, setPelunasan] = useState(0);
    const [orderInfo, setOrderInfo] = useState(null);

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

    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                date: data.date,
                description: data.description,
                category: data.category,
                amount_in: data.txType === 'in' ? parseInt(data.amount_in) || 0 : 0,
                amount_out: data.txType === 'out' ? parseInt(data.amount_out) || 0 : 0,
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

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input className="form-input" type="date" required value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                        </div>
                        {!isDpEdit && (
                            <div className="form-group">
                                <label className="form-label">Tipe Transaksi</label>
                                <select className="form-select" value={data.txType} onChange={e => setData({ ...data, txType: e.target.value })}>
                                    <option value="in">Pemasukan</option>
                                    <option value="out">Pengeluaran</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deskripsi</label>
                        <input className="form-input" required value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Deskripsi transaksi" readOnly={isDpEdit} style={isDpEdit ? { opacity: 0.7 } : {}} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select className="form-select" value={data.category} onChange={e => setData({ ...data, category: e.target.value })} disabled={isDpEdit} style={isDpEdit ? { opacity: 0.7 } : {}}>
                                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{isDpEdit ? 'Nominal DP (Rp)' : 'Jumlah (Rp)'}</label>
                            <input
                                className="form-input"
                                type="number"
                                required
                                placeholder="0"
                                value={isDpEdit ? data.amount_in : (data.txType === 'in' ? data.amount_in : data.amount_out)}
                                onChange={e => {
                                    if (isDpEdit) {
                                        setData({ ...data, amount_in: e.target.value });
                                    } else if (data.txType === 'in') {
                                        setData({ ...data, amount_in: e.target.value });
                                    } else {
                                        setData({ ...data, amount_out: e.target.value });
                                    }
                                }}
                            />
                        </div>
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
