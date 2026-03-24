'use client';

import { useEffect, useState } from 'react';

const categoryIcons = {
    kain: { icon: 'texture', label: '🧶 Kain & Bahan' },
    tinta: { icon: 'palette', label: '🎨 Tinta & Cat' },
    benang: { icon: 'straighten', label: '🧵 Benang & Aksesoris' },
    label: { icon: 'label', label: '🏷️ Label & Packaging' },
};

export default function InventoryPage({ onAddRaw, onEditRaw, onAddStock, onEditStock }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    function fetchData() {
        setLoading(true);
        fetch('/api/inventory')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }

    useEffect(() => { fetchData(); }, []);

    async function handleDeleteRaw(item) {
        if (!confirm(`Hapus "${item.name}"?`)) return;
        try {
            await fetch(`/api/inventory?id=${item.id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    }

    async function handleDeleteStock(item) {
        if (!confirm(`Hapus stok "${item.product} - ${item.color}"?`)) return;
        try {
            await fetch(`/api/inventory?id=${item.id}&type=finished_stock`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    }

    if (loading) return (
        <div className="page-content">
            <div className="inv-grid">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
            </div>
        </div>
    );

    if (!data) return <div className="page-content"><p>Gagal memuat data inventaris.</p></div>;

    return (
        <div className="page-content">
            {/* Raw Materials Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📦 Bahan Baku</h3>
                <button className="btn-add" onClick={onAddRaw}>
                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>add</span>
                    Tambah Bahan
                </button>
            </div>

            <div className="inv-grid">
                {Object.keys(categoryIcons).map(cat => {
                    const info = categoryIcons[cat];
                    const items = data.rawMaterials[cat] || [];

                    return (
                        <div className="inv-category" key={cat}>
                            <h3>
                                <span className="material-icons-round">{info.icon}</span>
                                {info.label}
                            </h3>
                            {items.map(item => (
                                <div className="inv-item" key={item.id}>
                                    <span className="inv-item-name">{item.name}</span>
                                    <div className="inv-item-stock">
                                        <span className="inv-item-qty">{item.qty} {item.unit}</span>
                                        <span className={`inv-item-status ${item.status}`}>
                                            {item.status === 'ok' ? 'Aman' : item.status === 'low' ? 'Menipis' : 'Kritis!'}
                                        </span>
                                        <button className="action-btn" onClick={() => onEditRaw(item)} title="Edit" style={{ padding: '0.15rem' }}>
                                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>edit</span>
                                        </button>
                                        <button className="action-btn" onClick={() => handleDeleteRaw(item)} title="Hapus" style={{ padding: '0.15rem' }}>
                                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    Tidak ada item
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Finished Stock Table */}
            <div className="content-card full-width" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3>👕 Stok Kaos Jadi</h3>
                    <button className="btn-add" onClick={onAddStock}>
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>add</span>
                        Tambah Stok
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produk</th><th>Warna</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>XXL</th><th>Total</th><th>Status</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.finishedStock.length === 0 ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada stok</td></tr>
                            ) : (
                                data.finishedStock.map(item => {
                                    const total = item.s + item.m + item.l + item.xl + item.xxl;
                                    return (
                                        <tr key={item.id}>
                                            <td><strong>{item.product}</strong></td>
                                            <td>{item.color}</td>
                                            <td>{item.s}</td><td>{item.m}</td><td>{item.l}</td>
                                            <td>{item.xl}</td><td>{item.xxl}</td>
                                            <td><strong>{total}</strong></td>
                                            <td>
                                                <span className={`inv-item-status ${item.status}`}>
                                                    {item.status === 'ok' ? 'Aman' : item.status === 'low' ? 'Menipis' : 'Kritis!'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="action-btn" onClick={() => onEditStock(item)} title="Edit">
                                                    <span className="material-icons-round">edit</span>
                                                </button>
                                                {' '}
                                                <button className="action-btn" onClick={() => handleDeleteStock(item)} title="Hapus" style={{ marginLeft: '0.25rem' }}>
                                                    <span className="material-icons-round">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
