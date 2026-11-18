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

    const todayStr = new Date().toISOString().split('T')[0];

    // Days difference calculation
    const daysAgo = data.tanggal && data.tanggal < todayStr
        ? Math.round((new Date(todayStr) - new Date(data.tanggal)) / (1000 * 60 * 60 * 24))
        : 0;

    const daysProduction = data.shipping_date && data.tanggal
        ? Math.round((new Date(data.shipping_date) - new Date(data.tanggal)) / (1000 * 60 * 60 * 24))
        : null;

    const isDeadlineInvalid = Boolean(data.shipping_date && data.tanggal && data.shipping_date < data.tanggal);

    const MAX_QTY = 1000000; // 1 Juta pcs
    const MAX_PRICE = 999999999999999; // 15 Digit (Rp 999 Triliun)

    // Helper untuk memblokir tanda minus (-), plus (+), dan eksponen (e, E)
    const blockNegativeAndExponent = (e) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    // Auto calculate values
    const items = data.items.map(item => {
        const q = Number(item.qty) || 0;
        const p = Number(item.unit_price) || 0;
        return {
            ...item,
            price: q * p
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const potonganAmount = Number(data.potongan) || 0;
    const total = Math.max(0, subtotal - potonganAmount + (Number(data.shipping_cost) || 0));

    // Validasi pengecekan Qty & Harga
    const hasInvalidQty = data.items.some(item => {
        if (item.qty === '' || item.qty === undefined) return true;
        const q = Number(item.qty);
        return isNaN(q) || q < 1 || q > MAX_QTY;
    });

    const hasInvalidPrice = data.items.some(item => {
        if (item.unit_price === '' || item.unit_price === undefined) return false;
        const p = Number(item.unit_price);
        return isNaN(p) || p < 0 || p > MAX_PRICE;
    });

    // Update items function dengan proteksi anti-minus & batas maksimal
    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        let sanitizedVal = value;

        if (field === 'qty') {
            if (value !== '') {
                const cleaned = String(value).replace(/[^0-9]/g, '');
                sanitizedVal = cleaned === '' ? '' : Math.min(MAX_QTY, Number(cleaned));
            }
        } else if (field === 'unit_price') {
            if (value !== '') {
                const cleaned = String(value).replace(/[^0-9]/g, '');
                // Potong maksimal 15 digit angka
                const truncated = cleaned.slice(0, 15);
                sanitizedVal = truncated === '' ? '' : Number(truncated);
            }
        }

        newItems[index] = { ...newItems[index], [field]: sanitizedVal };
        setData({ ...data, items: newItems });
    };

    // Update nominal field (Potongan, Ongkir, DP) anti-minus & max 15 digit
    const updateNonNegativeField = (field, value) => {
        if (value === '') {
            setData({ ...data, [field]: '' });
            return;
        }
        const cleaned = String(value).replace(/[^0-9]/g, '');
        const truncated = cleaned.slice(0, 15);
        setData({ ...data, [field]: truncated === '' ? '' : Number(truncated) });
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
        if (isDeadlineInvalid) {
            alert(`Tanggal pengiriman (deadline) tidak boleh sebelum tanggal pesanan (${data.tanggal})!`);
            return;
        }
        if (hasInvalidQty) {
            alert('Qty pada setiap produk harus minimal 1 dan maksimal 1.000.000 pcs (tidak boleh minus atau 0).');
            return;
        }
        if (hasInvalidPrice) {
            alert('Harga satuan tidak boleh minus dan maksimal 15 digit (Rp 999 Triliun).');
            return;
        }
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
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Tanggal</span>
                                {daysAgo > 0 && (
                                    <span style={{
                                        fontSize: '0.72rem',
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        color: '#f59e0b',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                    }}>
                                        ⏳ Pesanan Susulan ({daysAgo} hari lalu)
                                    </span>
                                )}
                            </label>
                            <input
                                className="form-input"
                                type="date"
                                required
                                value={data.tanggal}
                                onChange={e => {
                                    const val = e.target.value;
                                    const update = { tanggal: val };
                                    if (data.shipping_date && val && data.shipping_date < val) {
                                        update.shipping_date = val;
                                    }
                                    setData({ ...data, ...update });
                                }}
                            />
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
                            {items.map((item, index) => {
                                const isQtyInvalid = item.qty !== '' && item.qty !== undefined && (Number(item.qty) < 1 || Number(item.qty) > MAX_QTY);
                                const isPriceInvalid = item.unit_price !== '' && item.unit_price !== undefined && (Number(item.unit_price) < 0 || Number(item.unit_price) > MAX_PRICE);

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                className="form-input"
                                                required
                                                placeholder="Nama item / Ukuran"
                                                value={item.description}
                                                onChange={e => updateItem(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min="1"
                                                    max={MAX_QTY}
                                                    required
                                                    value={item.qty}
                                                    onKeyDown={blockNegativeAndExponent}
                                                    onChange={e => updateItem(index, 'qty', e.target.value)}
                                                    placeholder="1"
                                                    title="Minimal 1 pcs, maksimal 1.000.000 pcs (tidak boleh minus)"
                                                    style={{
                                                        textAlign: 'center',
                                                        borderColor: isQtyInvalid ? '#ef4444' : undefined,
                                                        background: isQtyInvalid ? 'rgba(239, 68, 68, 0.05)' : undefined
                                                    }}
                                                />
                                                {isQtyInvalid && (
                                                    <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>
                                                        {Number(item.qty) < 1 ? 'Min 1 pcs' : 'Maks 1 Juta pcs'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min="0"
                                                    max={MAX_PRICE}
                                                    required
                                                    value={item.unit_price}
                                                    onKeyDown={blockNegativeAndExponent}
                                                    onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                                    placeholder="0"
                                                    title="Maksimal 15 digit (Rp 999 Triliun)"
                                                    style={{
                                                        textAlign: 'right',
                                                        borderColor: isPriceInvalid ? '#ef4444' : undefined,
                                                        background: isPriceInvalid ? 'rgba(239, 68, 68, 0.05)' : undefined
                                                    }}
                                                />
                                                {isPriceInvalid && (
                                                    <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600, textAlign: 'right' }}>
                                                        Maks 15 digit
                                                    </span>
                                                )}
                                            </div>
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
                                );
                            })}
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
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Tanggal Pengiriman (Deadline)</span>
                                {daysProduction !== null && !isDeadlineInvalid && (
                                    <span style={{
                                        fontSize: '0.72rem',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                    }}>
                                        ⏱️ {daysProduction} hari pengerjaan
                                    </span>
                                )}
                            </label>
                            <input
                                className="form-input"
                                type="date"
                                required
                                min={data.tanggal || todayStr}
                                value={data.shipping_date}
                                onChange={e => setData({ ...data, shipping_date: e.target.value })}
                                style={isDeadlineInvalid ? { borderColor: '#ef4444' } : {}}
                            />
                            {isDeadlineInvalid && (
                                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>error_outline</span>
                                    Deadline tidak boleh sebelum tanggal pesanan ({data.tanggal})
                                </div>
                            )}
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
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    max={MAX_PRICE}
                                    value={data.potongan}
                                    onKeyDown={blockNegativeAndExponent}
                                    onChange={e => updateNonNegativeField('potongan', e.target.value)}
                                    placeholder="0"
                                    title="Maksimal 15 digit"
                                    style={{ textAlign: 'right' }}
                                />
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
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    max={MAX_PRICE}
                                    value={data.shipping_cost}
                                    onKeyDown={blockNegativeAndExponent}
                                    onChange={e => updateNonNegativeField('shipping_cost', e.target.value)}
                                    placeholder="0"
                                    title="Maksimal 15 digit"
                                    style={{ textAlign: 'right' }}
                                />
                            </div>
                        </div>

                        <div className="detail-row" style={{ alignItems: 'center' }}>
                            <span className="detail-label">Down Payment (DP)</span>
                            <div style={{ width: '50%' }}>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    max={MAX_PRICE}
                                    value={data.dp}
                                    onKeyDown={blockNegativeAndExponent}
                                    onChange={e => updateNonNegativeField('dp', e.target.value)}
                                    placeholder="0"
                                    title="Maksimal 15 digit"
                                    style={{ textAlign: 'right' }}
                                />
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
