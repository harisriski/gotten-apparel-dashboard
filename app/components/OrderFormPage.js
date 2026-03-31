'use client';

import { useState, useEffect } from 'react';
import { downloadInvoice } from '@/lib/generateInvoice';

const emptyItem = { id: Date.now(), description: '', qty: 1, unit_price: 0 };
const emptyForm = {
    tanggal: '',
    customer: '',
    company: '',
    product: '',
    address: '',
    email: '',
    phone: '',
    items: [{ ...emptyItem }],
    potongan: 0, // Rp
    dp: 0,
    shipping_cost: 0,
    shipping_term: '',
    shipping_method: '',
    shipping_date: '',
    status: 'baru'
};

function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

export default function OrderFormPage({ editOrder, onSave, onCancel }) {
    const isEdit = !!editOrder;

    const [data, setData] = useState(() => {
        if (isEdit) {
            let parsedItems = [];
            try {
                parsedItems = typeof editOrder.items === 'string' ? JSON.parse(editOrder.items) : (editOrder.items || []);
            } catch (e) {
                console.error("Failed to parse existing items", e);
            }
            if (parsedItems.length === 0) parsedItems = [{ ...emptyItem }];

            return {
                ...emptyForm,
                ...editOrder,
                tanggal: editOrder.tanggal || (editOrder.created_at ? editOrder.created_at.split(' ')[0] : ''),
                shipping_date: editOrder.shipping_date || (editOrder.deadline ? editOrder.deadline.split('T')[0] : ''),
                items: parsedItems
            };
        }
        return { ...emptyForm, tanggal: new Date().toISOString().split('T')[0] };
    });

    const [saving, setSaving] = useState(false);
    const [savedOrder, setSavedOrder] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto calculate values
    const items = data.items.map(item => ({
        ...item,
        price: (parseInt(item.qty) || 0) * (parseInt(item.unit_price) || 0)
    }));

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const potonganAmount = parseInt(data.potongan) || 0;
    const total = subtotal - potonganAmount + (parseInt(data.shipping_cost) || 0);

    // Update items function
    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData({ ...data, items: newItems });
    };

    const addItem = () => {
        setData({ ...data, items: [...data.items, { id: Date.now(), description: '', qty: 1, unit_price: 0 }] });
    };

    const removeItem = (index) => {
        if (data.items.length <= 1) return; // keep at least 1
        const newItems = data.items.filter((_, i) => i !== index);
        setData({ ...data, items: newItems });
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);

            // Map the new fields to standard fields to maintain backward compatibility
            const payload = {
                ...data,
                items: items, // will be stringified in the API
                subtotal: subtotal,
                total: total,
                price: total, // Main total uses 'price' db column
                qty: totalQty, // Summed up qty
                deadline: data.shipping_date || ''
            };

            let res;
            if (isEdit) {
                res = await fetch(`/api/orders/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            if (res.ok) {
                const result = await res.json();
                // For new orders, show success modal with PDF download
                if (!isEdit) {
                    const orderForPdf = { ...payload, id: result.id };
                    setSavedOrder(orderForPdf);
                    setShowSuccess(true);
                } else {
                    onSave();
                }
            }
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    }

    return (
        <div className="page-content" style={{ paddingBottom: '5rem' }}>
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">{isEdit ? '✏️ Edit Pesanan' : '➕ Pesanan Baru'}</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* SECTION 1: CUSTOMER */}
                <div className="form-page-card" style={{ maxWidth: '100%' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>1. Data Pelanggan</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input className="form-input" type="date" required value={data.tanggal} onChange={e => setData({ ...data, tanggal: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status Pesanan</label>
                            <select className="form-select" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
                                <option value="baru">Baru</option>
                                <option value="proses">Diproses</option>
                                <option value="selesai">Selesai</option>
                                <option value="dikirim">Dikirim</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Pelanggan</label>
                            <input className="form-input" required value={data.customer} onChange={e => setData({ ...data, customer: e.target.value })} placeholder="Nama lengkap" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nama Tim / Perusahaan</label>
                            <input className="form-input" value={data.company} onChange={e => setData({ ...data, company: e.target.value })} placeholder="PT, CV, Sekolah, dll" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Produk (Judul Referensi)</label>
                            <input className="form-input" required value={data.product} onChange={e => setData({ ...data, product: e.target.value })} placeholder="Cth: Kaos Oblong Angkatan" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nomor WhatsApp / Phone</label>
                            <input className="form-input" required value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="08xx xxxx xxxx" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="email@domain.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alamat Lengkap</label>
                        <textarea className="form-input" rows="3" value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="Jalan, RT/RW, Kecamatan, Kota, dsb." />
                    </div>
                </div>

                {/* SECTION 2: ORDER PRODUK */}
                <div className="form-page-card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>2. Order Produk</h3>
                    <table className="data-table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Deskripsi Produk</th>
                                <th style={{ width: '15%' }}>Qty (Pcs)</th>
                                <th style={{ width: '20%' }}>Harga / Unit (Rp)</th>
                                <th style={{ width: '20%' }}>Harga Total (Rp)</th>
                                <th style={{ width: '5%' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td>
                                        <input className="form-input" required placeholder="Nama item / Ukuran" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                                    </td>
                                    <td>
                                        <input className="form-input" type="number" min="1" required value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} />
                                    </td>
                                    <td>
                                        <input className="form-input" type="number" min="0" required value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {formatCurrency(item.price)}
                                    </td>
                                    <td>
                                        <button type="button" className="action-btn" onClick={() => removeItem(index)} disabled={items.length <= 1} title="Hapus Baris" style={{ opacity: items.length <= 1 ? 0.3 : 1 }}>
                                            <span className="material-icons-round">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: '1rem', borderStyle: 'dashed' }}>
                        <span className="material-icons-round">add</span>
                        Tambah Produk
                    </button>
                </div>

                <div className="form-row" style={{ alignItems: 'flex-start' }}>
                    {/* SECTION 4: PENGIRIMAN (Left side) */}
                    <div className="form-page-card" style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>3. Pengiriman</h3>
                        <div className="form-group">
                            <label className="form-label">Tanggal Pengiriman (Deadline)</label>
                            <input className="form-input" type="date" required value={data.shipping_date} onChange={e => setData({ ...data, shipping_date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Metode Pengiriman</label>
                            <input className="form-input" value={data.shipping_method} onChange={e => setData({ ...data, shipping_method: e.target.value })} placeholder="JNE, SiCepat, Cargo, Ambil Sendiri" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ketentuan Pengiriman / Catatan</label>
                            <textarea className="form-input" rows="3" value={data.shipping_term} onChange={e => setData({ ...data, shipping_term: e.target.value })} placeholder="Catatan tambahan untuk kurir/pengiriman" />
                        </div>
                    </div>

                    {/* SECTION 3: TOTAL (Right side) */}
                    <div className="form-page-card" style={{ width: '400px', flexShrink: 0, position: 'sticky', top: '90px' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>4. Ringkasan & Total</h3>

                        <div className="detail-row">
                            <span className="detail-label">Subtotal</span>
                            <span className="detail-value">{formatCurrency(subtotal)}</span>
                        </div>

                        <div className="detail-row" style={{ alignItems: 'center' }}>
                            <span className="detail-label">Potongan (Rp)</span>
                            <div style={{ width: '50%' }}>
                                <input className="form-input" type="number" min="0" value={data.potongan} onChange={e => setData({ ...data, potongan: e.target.value })} placeholder="0" style={{ textAlign: 'right' }} />
                            </div>
                        </div>
                        {potonganAmount > 0 && (
                            <div className="detail-row" style={{ borderBottom: 'none', paddingTop: 0, marginTop: '-0.5rem' }}>
                                <span className="detail-label" style={{ fontSize: '0.75rem' }}>Nilai Potongan</span>
                                <span className="detail-value" style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>-{formatCurrency(potonganAmount)}</span>
                            </div>
                        )}

                        <div className="detail-row" style={{ alignItems: 'center' }}>
                            <span className="detail-label">Biaya Pengiriman</span>
                            <div style={{ width: '50%' }}>
                                <input className="form-input" type="number" min="0" value={data.shipping_cost} onChange={e => setData({ ...data, shipping_cost: e.target.value })} placeholder="0" style={{ textAlign: 'right' }} />
                            </div>
                        </div>

                        <div className="detail-row" style={{ alignItems: 'center' }}>
                            <span className="detail-label">Down Payment (DP)</span>
                            <div style={{ width: '50%' }}>
                                <input className="form-input" type="number" min="0" value={data.dp} onChange={e => setData({ ...data, dp: e.target.value })} placeholder="0" style={{ textAlign: 'right' }} />
                            </div>
                        </div>

                        <div className="detail-row" style={{ borderTop: '2px dashed var(--border-color)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                            <span className="detail-label" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Total Bayar</span>
                            <span className="detail-value" style={{ fontSize: '1.4rem', color: 'var(--accent-green)' }}>{formatCurrency(total)}</span>
                        </div>

                        <div className="detail-row" style={{ borderBottom: 'none' }}>
                            <span className="detail-label">Sisa Tagihan</span>
                            <span className="detail-value" style={{ color: (total - (parseInt(data.dp) || 0)) > 0 ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>
                                {formatCurrency(Math.max(0, total - (parseInt(data.dp) || 0)))}
                            </span>
                        </div>

                        <div className="form-page-actions" style={{ flexDirection: 'column', marginTop: '2rem' }}>
                            <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                                {saving ? 'Menyimpan...' : (isEdit ? 'Update Pesanan' : 'Simpan Pesanan')}
                            </button>
                            <button type="button" className="btn-secondary" onClick={onCancel} style={{ width: '100%', justifyContent: 'center' }}>Batal</button>
                        </div>
                    </div>
                </div>

            </form>

            {/* Success Modal with PDF Download */}
            {showSuccess && savedOrder && (
                <div className="modal-overlay active" onClick={() => { setShowSuccess(false); onSave(); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pesanan Berhasil Disimpan!</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Pesanan <strong>{savedOrder.id}</strong> untuk <strong>{savedOrder.customer}</strong> telah berhasil dibuat.
                        </p>

                        <div style={{ background: 'rgba(148,163,184,0.06)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Produk</span>
                                <span style={{ fontWeight: 600 }}>{savedOrder.product}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Item</span>
                                <span style={{ fontWeight: 600 }}>{savedOrder.items?.length || 0} item</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Bayar</span>
                                <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(savedOrder.price)}</span>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => downloadInvoice(savedOrder)}
                            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.2rem' }}>picture_as_pdf</span>
                            Download Nota PDF
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => { setShowSuccess(false); onSave(); }}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Tutup & Kembali ke Daftar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
