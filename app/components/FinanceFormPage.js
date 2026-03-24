'use client';

import { useState } from 'react';

const categoryOptions = ['Penjualan', 'Bahan Baku', 'Operasional', 'Pengiriman', 'Gaji', 'Lain-lain'];

export default function FinanceFormPage({ editTx, onSave, onCancel }) {
    const isEdit = !!editTx;
    const [data, setData] = useState(
        isEdit
            ? { ...editTx, txType: editTx.amount_in > 0 ? 'in' : 'out' }
            : { date: '', description: '', category: 'Penjualan', amount_in: '', amount_out: '', txType: 'in' }
    );
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

    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">{isEdit ? '✏️ Edit Transaksi' : '💰 Tambah Transaksi'}</h2>
            </div>

            <div className="form-page-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input className="form-input" type="date" required value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tipe Transaksi</label>
                            <select className="form-select" value={data.txType} onChange={e => setData({ ...data, txType: e.target.value })}>
                                <option value="in">Pemasukan</option>
                                <option value="out">Pengeluaran</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deskripsi</label>
                        <input className="form-input" required value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Deskripsi transaksi" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select className="form-select" value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
                                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jumlah (Rp)</label>
                            <input
                                className="form-input"
                                type="number"
                                required
                                placeholder="0"
                                value={data.txType === 'in' ? data.amount_in : data.amount_out}
                                onChange={e => {
                                    if (data.txType === 'in') {
                                        setData({ ...data, amount_in: e.target.value });
                                    } else {
                                        setData({ ...data, amount_out: e.target.value });
                                    }
                                }}
                            />
                        </div>
                    </div>
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
