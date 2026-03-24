'use client';

import { useState } from 'react';

const categoryIcons = {
    kain: { icon: 'texture', label: '🧶 Kain & Bahan' },
    tinta: { icon: 'palette', label: '🎨 Tinta & Cat' },
    benang: { icon: 'straighten', label: '🧵 Benang & Aksesoris' },
    label: { icon: 'label', label: '🏷️ Label & Packaging' },
};

export default function InventoryFormPage({ editItem, formType, onSave, onCancel }) {
    const isEdit = !!editItem;
    const isStock = formType === 'stock';

    const [data, setData] = useState(
        isEdit
            ? { ...editItem }
            : isStock
                ? { product: '', color: '', s: 0, m: 0, l: 0, xl: 0, xxl: 0, status: 'ok' }
                : { category: 'kain', name: '', qty: '', unit: '', status: 'ok', min_stock: '' }
    );
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = isStock ? { ...data, type: 'finished_stock' } : { ...data };
            let res;
            if (isEdit) {
                res = await fetch('/api/inventory', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/inventory', {
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

    const title = isEdit
        ? (isStock ? '✏️ Edit Stok Jadi' : '✏️ Edit Bahan Baku')
        : (isStock ? '👕 Tambah Stok Jadi' : '📦 Tambah Bahan Baku');

    const submitLabel = isEdit ? 'Update' : 'Simpan';

    // Finished Stock form
    if (isStock) {
        return (
            <div className="page-content">
                <div className="form-page-header">
                    <button className="btn-back" onClick={onCancel}>
                        <span className="material-icons-round">arrow_back</span>
                        Kembali
                    </button>
                    <h2 className="form-page-title">{title}</h2>
                </div>

                <div className="form-page-card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Produk</label>
                                <input className="form-input" required value={data.product} onChange={e => setData({ ...data, product: e.target.value })} placeholder="Nama produk" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warna</label>
                                <input className="form-input" required value={data.color} onChange={e => setData({ ...data, color: e.target.value })} placeholder="Warna" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                            {['s', 'm', 'l', 'xl', 'xxl'].map(size => (
                                <div className="form-group" key={size}>
                                    <label className="form-label">{size.toUpperCase()}</label>
                                    <input className="form-input" type="number" min="0" value={data[size]} onChange={e => setData({ ...data, [size]: parseInt(e.target.value) || 0 })} />
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
                                <option value="ok">Aman</option>
                                <option value="low">Menipis</option>
                                <option value="critical">Kritis</option>
                            </select>
                        </div>
                        <div className="form-page-actions">
                            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Menyimpan...' : submitLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Raw Material form
    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">{title}</h2>
            </div>

            <div className="form-page-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select className="form-select" value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
                                {Object.keys(categoryIcons).map(k => (
                                    <option key={k} value={k}>{categoryIcons[k].label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
                                <option value="ok">Aman</option>
                                <option value="low">Menipis</option>
                                <option value="critical">Kritis</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nama Item</label>
                        <input className="form-input" required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="Nama bahan baku" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Jumlah</label>
                            <input className="form-input" required value={data.qty} onChange={e => setData({ ...data, qty: e.target.value })} placeholder="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Satuan</label>
                            <input className="form-input" value={data.unit} onChange={e => setData({ ...data, unit: e.target.value })} placeholder="yard/kg/pcs/set" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min. Stok</label>
                        <input className="form-input" value={data.min_stock} onChange={e => setData({ ...data, min_stock: e.target.value })} placeholder="Minimum stok" />
                    </div>
                    <div className="form-page-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
