'use client';

import { downloadInvoice } from '@/lib/generateInvoice';

function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusLabel(status) {
    const labels = { baru: '● Baru', proses: '● Diproses', selesai: '● Selesai', dikirim: '● Dikirim', pending: '● Pending' };
    return labels[status] || status;
}

export default function OrderDetailPage({ order, onBack, onEdit }) {
    if (!order) return null;

    // Parse items
    let items = [];
    try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch (e) {
        items = [];
    }

    // Calculate values
    const computedItems = items.map(item => ({
        ...item,
        price: (parseInt(item.qty) || 0) * (parseInt(item.unit_price) || 0)
    }));
    const subtotal = order.subtotal || computedItems.reduce((sum, item) => sum + item.price, 0);
    const potonganPersen = parseFloat(order.potongan) || 0;
    const potonganAmount = Math.round(subtotal * (potonganPersen / 100));
    const shippingCost = parseInt(order.shipping_cost) || 0;
    const total = order.price || (subtotal - potonganAmount + shippingCost);
    const dp = parseInt(order.dp) || 0;
    const sisaTagihan = Math.max(0, total - dp);

    // Section 1: Data Pelanggan
    const customerDetails = [
        { label: 'ID Pesanan', value: order.id },
        { label: 'Tanggal', value: formatDate(order.tanggal || order.created_at) },
        { label: 'Status', value: null, badge: true },
        { label: 'Pelanggan', value: order.customer },
        { label: 'Tim / Perusahaan', value: order.company },
        { label: 'Produk', value: order.product },
        { label: 'No. WhatsApp / Phone', value: order.phone },
        { label: 'Email', value: order.email },
        { label: 'Alamat', value: order.address },
    ];

    // Section 3: Pengiriman
    const shippingDetails = [
        { label: 'Tanggal Pengiriman', value: formatDate(order.shipping_date || order.deadline) },
        { label: 'Metode Pengiriman', value: order.shipping_method },
        { label: 'Catatan Pengiriman', value: order.shipping_term },
    ];

    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onBack}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title">📋 Detail Pesanan</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* SECTION 1: DATA PELANGGAN */}
                <div className="form-page-card" style={{ maxWidth: '100%' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>1. Data Pelanggan</h3>
                    {customerDetails.map((d, i) => (
                        <div className="detail-row" key={i} style={i === customerDetails.length - 1 ? { borderBottom: 'none' } : {}}>
                            <span className="detail-label">{d.label}</span>
                            <span className="detail-value">
                                {d.badge ? (
                                    <span className={`status-badge ${order.status}`}>{getStatusLabel(order.status)}</span>
                                ) : (
                                    d.value || '-'
                                )}
                            </span>
                        </div>
                    ))}
                </div>

                {/* SECTION 2: ORDER PRODUK */}
                {computedItems.length > 0 && (
                    <div className="form-page-card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>2. Order Produk</h3>
                        <table className="data-table" style={{ minWidth: '500px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>No</th>
                                    <th style={{ width: '40%' }}>Deskripsi Produk</th>
                                    <th style={{ width: '15%' }}>Qty (Pcs)</th>
                                    <th style={{ width: '20%' }}>Harga / Unit</th>
                                    <th style={{ width: '20%' }}>Harga Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {computedItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.qty || 0}</td>
                                        <td>{formatCurrency(item.unit_price)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="form-row" style={{ alignItems: 'flex-start' }}>
                    {/* SECTION 3: PENGIRIMAN */}
                    <div className="form-page-card" style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>3. Pengiriman</h3>
                        {shippingDetails.map((d, i) => (
                            <div className="detail-row" key={i} style={i === shippingDetails.length - 1 ? { borderBottom: 'none' } : {}}>
                                <span className="detail-label">{d.label}</span>
                                <span className="detail-value">{d.value || '-'}</span>
                            </div>
                        ))}
                    </div>

                    {/* SECTION 4: RINGKASAN & TOTAL */}
                    <div className="form-page-card" style={{ width: '400px', flexShrink: 0 }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600 }}>4. Ringkasan & Total</h3>

                        <div className="detail-row">
                            <span className="detail-label">Subtotal</span>
                            <span className="detail-value">{formatCurrency(subtotal)}</span>
                        </div>

                        {potonganPersen > 0 && (
                            <>
                                <div className="detail-row">
                                    <span className="detail-label">Potongan ({potonganPersen}%)</span>
                                    <span className="detail-value" style={{ color: 'var(--accent-red)' }}>-{formatCurrency(potonganAmount)}</span>
                                </div>
                            </>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Biaya Pengiriman</span>
                            <span className="detail-value">{formatCurrency(shippingCost)}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Down Payment (DP)</span>
                            <span className="detail-value">{formatCurrency(dp)}</span>
                        </div>

                        <div className="detail-row" style={{ borderTop: '2px dashed var(--border-color)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                            <span className="detail-label" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Total Bayar</span>
                            <span className="detail-value" style={{ fontSize: '1.4rem', color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(total)}</span>
                        </div>

                        <div className="detail-row" style={{ borderBottom: 'none' }}>
                            <span className="detail-label">Sisa Tagihan</span>
                            <span className="detail-value" style={{ color: sisaTagihan > 0 ? 'var(--accent-yellow)' : 'var(--text-muted)', fontWeight: 600 }}>
                                {formatCurrency(sisaTagihan)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="form-page-card" style={{ maxWidth: '100%' }}>
                    <div className="form-page-actions" style={{ marginTop: '0' }}>
                        <button className="btn-secondary" onClick={onBack}>Kembali</button>
                        <button className="btn-secondary" onClick={() => downloadInvoice(order)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>picture_as_pdf</span>
                            Download Nota
                        </button>
                        <button className="btn-primary" onClick={() => onEdit(order)}>
                            <span className="material-icons-round" style={{ fontSize: '1rem', marginRight: '0.3rem' }}>edit</span>
                            Edit Pesanan
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
