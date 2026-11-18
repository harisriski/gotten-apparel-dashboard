'use client';

import { useState, useEffect } from 'react';

function formatCurrency(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function formatIndoDisplayDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getWaLink(phone, customerName) {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62') && clean.length > 5) clean = '62' + clean;
    const msg = encodeURIComponent(`Halo Kak ${customerName}, terima kasih banyak telah menjadi pelanggan setia Gotten Apparel!`);
    return `https://wa.me/${clean}?text=${msg}`;
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
    const [orders, setOrders] = useState(customer?.orders || []);
    const [saving, setSaving] = useState(false);

    // Jika masuk ke detail tapi customer.orders belum ada, fetch otomatis dari API orders
    useEffect(() => {
        if (isDetail && (!customer?.orders || customer.orders.length === 0) && customer?.name) {
            fetch(`/api/orders?search=${encodeURIComponent(customer.name)}`)
                .then(r => r.json())
                .then(d => {
                    if (Array.isArray(d)) setOrders(d);
                    else if (d?.orders) setOrders(d.orders);
                })
                .catch(console.error);
        } else if (customer?.orders) {
            setOrders(customer.orders);
        }
    }, [isDetail, customer]);

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
            console.error('Submit customer error:', err);
        }
        setSaving(false);
    }

    // ── DETAIL VIEW ──
    if (isDetail) {
        const waLink = getWaLink(customer.phone, customer.name);

        return (
            <div className="page-content" style={{ paddingBottom: '3rem' }}>
                <div className="form-page-header" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button className="btn-back" onClick={onCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="material-icons-round">arrow_back</span>
                            Kembali ke Leaderboard
                        </button>
                        <h2 className="form-page-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                            👤 Profil &amp; Riwayat Pelanggan
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {waLink && (
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: '#16a34a',
                                    padding: '0.5rem 0.85rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>chat</span>
                                Hubungi via WhatsApp
                            </a>
                        )}
                        <button className="btn-secondary" onClick={() => onEdit(customer)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>edit</span>
                            Edit Profil
                        </button>
                    </div>
                </div>

                {/* ── METRIC CARDS ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Peringkat Leaderboard
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                            {customer.rank ? `#${customer.rank}` : '-'}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Total Akumulasi Belanja
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                            {formatCurrency(customer.totalSpent)}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Total Jersey Dipesan
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {customer.totalQty ? customer.totalQty.toLocaleString('id-ID') : 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>pcs</span>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Frekuensi Order
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {customer.orderCount || 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>kali transaksi</span>
                        </div>
                    </div>
                </div>

                {/* ── DETAIL BIODATA ── */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Informasi Kontak &amp; Instansi
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nama Pelanggan</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{customer.name}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Perusahaan / Tim / Instansi</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{customer.company || '-'}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>No. Telepon / WhatsApp</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{customer.phone || '-'}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Email</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{customer.email || '-'}</span>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Alamat Lengkap</span>
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{customer.address || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* ── RIWAYAT PESANAN ── */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                    <div style={{
                        padding: '0.85rem 1.25rem',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--accent-primary)' }}>receipt_long</span>
                            Riwayat Pesanan Pelanggan Ini
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {orders.length} pesanan terdata
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>No. Pesanan</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Produk</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Qty</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Tagihan</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tanggal Order</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Deadline / Kirim</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((ord, idx) => (
                                        <tr key={ord.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {ord.id}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                {ord.product || 'Jersey Custom'}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                {ord.qty} pcs
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                {formatCurrency(ord.price)}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                {formatIndoDisplayDate(ord.tanggal)}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                {formatIndoDisplayDate(ord.deadline || ord.shipping_date)}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontWeight: 600,
                                                    background: ord.status === 'Selesai' ? '#dcfce7' : '#eff6ff',
                                                    color: ord.status === 'Selesai' ? '#15803d' : '#2563eb'
                                                }}>
                                                    {ord.status || 'Diproses'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                                            Belum ada data pesanan yang tercatat untuk pelanggan ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ── ADD / EDIT FORM ──
    return (
        <div className="page-content" style={{ paddingBottom: '3rem' }}>
            <div className="form-page-header" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button className="btn-back" onClick={onCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                    {isEdit ? '✏️ Edit Biodata Pelanggan' : '👤 Tambah Pelanggan Baru'}
                </h2>
            </div>

            <div className="form-page-card" style={{ maxWidth: '640px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                            Nama Pelanggan <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            className="form-input"
                            required
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                            placeholder="Contoh: Haris / Gudis"
                            style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                            Perusahaan / Tim / Instansi
                        </label>
                        <input
                            className="form-input"
                            value={data.company}
                            onChange={e => setData({ ...data, company: e.target.value })}
                            placeholder="Contoh: SMADA FC / PT Maju Sejahtera"
                            style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                                No. Telepon / WhatsApp
                            </label>
                            <input
                                className="form-input"
                                value={data.phone}
                                onChange={e => setData({ ...data, phone: e.target.value })}
                                placeholder="08xxxxxxxxxx"
                                style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                                Email
                            </label>
                            <input
                                className="form-input"
                                type="email"
                                value={data.email}
                                onChange={e => setData({ ...data, email: e.target.value })}
                                placeholder="nama@email.com"
                                style={{ height: '38px', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                            Alamat Lengkap
                        </label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={data.address}
                            onChange={e => setData({ ...data, address: e.target.value })}
                            placeholder="Alamat pengiriman / domisili"
                            style={{ width: '100%', padding: '0.6rem 0.75rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="form-page-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
                        <button type="button" className="btn-secondary" onClick={onCancel} style={{ padding: '0.55rem 1rem' }}>
                            Batal
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.55rem 1.25rem' }}>
                            {saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
