'use client';

import { useState } from 'react';

const stageInfo = {
    desain: { icon: '🎨', label: 'Desain' },
    cutting: { icon: '✂️', label: 'Cutting' },
    sewing: { icon: '🧵', label: 'Sewing' },
    sablon: { icon: '🖨️', label: 'Sablon' },
    qc: { icon: '✅', label: 'Quality Control' },
    packing: { icon: '📦', label: 'Packing' },
};

export default function ProductionFormPage({ editItem, onSave, onCancel }) {
    const isEdit = !!editItem;
    const [data, setData] = useState(
        isEdit
            ? { ...editItem }
            : { order_id: '', title: '', stage: 'desain', qty: '', deadline: '' }
    );
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            let res;
            if (isEdit) {
                res = await fetch('/api/production', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                res = await fetch('/api/production', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
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
                <h2 className="form-page-title">{isEdit ? '✏️ Edit Produksi' : '🏭 Tambah Produksi'}</h2>
            </div>

            <div className="form-page-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Order ID</label>
                            <input className="form-input" required value={data.order_id} onChange={e => setData({ ...data, order_id: e.target.value })} placeholder="ORD-0001" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tahap Produksi</label>
                            <select className="form-select" value={data.stage} onChange={e => setData({ ...data, stage: e.target.value })}>
                                {Object.keys(stageInfo).map(s => (
                                    <option key={s} value={s}>{stageInfo[s].icon} {stageInfo[s].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Judul / Nama Produk</label>
                        <input className="form-input" required value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="Nama produk" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Jumlah</label>
                            <input className="form-input" required value={data.qty} onChange={e => setData({ ...data, qty: e.target.value })} placeholder="500 pcs" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Deadline</label>
                            <input className="form-input" value={data.deadline} onChange={e => setData({ ...data, deadline: e.target.value })} placeholder="20 Feb" />
                        </div>
                    </div>
                    <div className="form-page-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
