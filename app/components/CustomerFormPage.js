'use client';

import { useState } from 'react';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

export default function CustomerFormPage({ editCustomer, detailCustomer, onSave, onCancel, onEdit }) {
    const isDetail = !!detailCustomer && !editCustomer;
    const isEdit = !!editCustomer;
    const customer = editCustomer || detailCustomer;

    const [data, setData] = useState(
        isEdit
            ? { ...customer }
            : { name: '', company: '', phone: '', email: '', address: '' }
    );
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            let res;
            if (isEdit) {
                res = await fetch('/api/customers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                res = await fetch('/api/customers', {
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

    // Detail view
    if (isDetail) {
        return (
            <div className="page-content">
                <div className="form-page-header">
                    <button className="btn-back" onClick={onCancel}>
                        <span className="material-icons-round">arrow_back</span>
                        Kembali
                    </button>
                    <h2 className="form-page-title">📋 Detail Pelanggan</h2>
                </div>

                <div className="form-page-card">
                    {[
                        { label: 'Nama', value: customer.name },
                        { label: 'Perusahaan', value: customer.company },
                        { label: 'Telepon', value: customer.phone },
                        { label: 'Email', value: customer.email },
                        { label: 'Alamat', value: customer.address },
                        { label: 'Total Pesanan', value: customer.orderCount },
                        { label: 'Total Belanja', value: formatCurrency(customer.totalSpent) },
                    ].map((d, i) => (
                        <div className="detail-row" key={i}>
                            <span className="detail-label">{d.label}</span>
                            <span className="detail-value">{d.value || '-'}</span>
                        </div>
                    ))}
                    <div className="form-page-actions" style={{ marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={onCancel}>Kembali</button>
                        <button className="btn-primary" onClick={() => onEdit(customer)}>
                            <span className="material-icons-round" style={{ fontSize: '1rem', marginRight: '0.3rem' }}>edit</span>
                            Edit Pelanggan
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Add / Edit form
    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">{isEdit ? '✏️ Edit Pelanggan' : '👤 Tambah Pelanggan'}</h2>
            </div>

            <div className="form-page-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Pelanggan</label>
                        <input className="form-input" required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="Nama lengkap" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Perusahaan / Tipe</label>
                        <input className="form-input" value={data.company} onChange={e => setData({ ...data, company: e.target.value })} placeholder="PT / CV / Komunitas" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Telepon</label>
                            <input className="form-input" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="08xx-xxxx-xxxx" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="email@domain.com" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alamat</label>
                        <input className="form-input" value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="Alamat lengkap" />
                    </div>
                    <div className="form-page-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : (isEdit ? 'Update Pelanggan' : 'Simpan Pelanggan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
