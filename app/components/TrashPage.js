'use client';

import { useEffect, useState } from 'react';

function formatCurrency(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function formatIndoDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

export default function TrashPage() {
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [detailModal, setDetailModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    function fetchTrash() {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);

        fetch(`/api/trash?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                if (data && data.items) {
                    setTrashItems(data.items);
                } else if (Array.isArray(data)) {
                    setTrashItems(data);
                } else {
                    setTrashItems([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch trash error:', err);
                setTrashItems([]);
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchTrash();
    }, [search]);

    async function handleRestore(id, customerName) {
        if (!confirm(`Pulihkan pesanan "${id}" (${customerName}) kembali ke daftar pesanan aktif?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore', id })
            });
            if (res.ok) {
                if (detailModal?.id === id) setDetailModal(null);
                fetchTrash();
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal memulihkan pesanan');
            }
        } catch (err) {
            console.error('Restore error:', err);
            alert('Terjadi kesalahan saat memulihkan pesanan');
        }
        setActionLoading(false);
    }

    async function handleRestoreAll() {
        if (trashItems.length === 0) return;
        if (!confirm(`Pulihkan SEMUA (${trashItems.length}) pesanan di tempat sampah kembali ke daftar pesanan aktif?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore_all' })
            });
            if (res.ok) {
                setDetailModal(null);
                fetchTrash();
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal memulihkan semua pesanan');
            }
        } catch (err) {
            console.error('Restore all error:', err);
            alert('Terjadi kesalahan saat memulihkan semua pesanan');
        }
        setActionLoading(false);
    }

    async function handleDestroy(id, customerName) {
        if (!confirm(`Hapus PERMANEN pesanan "${id}" (${customerName})?\n\nPERINGATAN: Tindakan ini TIDAK DAPAT DIBATALKAN. Data pesanan, Work Order, dan transaksi terkait akan dihapus seutuhnya dari database.`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'destroy', id })
            });
            if (res.ok) {
                if (detailModal?.id === id) setDetailModal(null);
                fetchTrash();
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal menghapus permanen');
            }
        } catch (err) {
            console.error('Destroy error:', err);
            alert('Terjadi kesalahan saat menghapus permanen');
        }
        setActionLoading(false);
    }

    async function handleDestroyAll() {
        if (trashItems.length === 0) return;
        if (!confirm(`KOSONGKAN TEMPAT SAMPAH?\n\nPERINGATAN KERAS: Seluruh (${trashItems.length}) pesanan di tempat sampah akan DIHAPUS PERMANEN dari database dan tidak dapat dipulihkan lagi!`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'destroy_all' })
            });
            if (res.ok) {
                setDetailModal(null);
                fetchTrash();
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal mengosongkan tempat sampah');
            }
        } catch (err) {
            console.error('Destroy all error:', err);
            alert('Terjadi kesalahan saat mengosongkan tempat sampah');
        }
        setActionLoading(false);
    }

    // Totals
    const totalPotentialValue = trashItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const totalQty = trashItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    return (
        <div className="page-content" style={{ paddingBottom: '3rem' }}>
            {/* ── HEADER HALAMAN ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: 0
                    }}>
                        <span className="material-icons-round" style={{ fontSize: '1.65rem', color: '#ef4444' }}>
                            auto_delete
                        </span>
                        Tempat Sampah (Recycle Bin)
                    </h1>
                    <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                    }}>
                        Kelola pesanan yang telah dihapus sementara. Anda dapat memulihkan (*restore*) ke antrean aktif atau menghapus permanen.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {trashItems.length > 0 && (
                        <>
                            <button
                                onClick={handleRestoreAll}
                                disabled={actionLoading}
                                className="btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.55rem 0.95rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    color: 'var(--accent-primary)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)'
                                }}
                                title="Pulihkan semua pesanan di tempat sampah"
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>restore</span>
                                Pulihkan Semua
                            </button>

                            <button
                                onClick={handleDestroyAll}
                                disabled={actionLoading}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.55rem 0.95rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    cursor: 'pointer'
                                }}
                                title="Hapus permanen seluruh pesanan di tempat sampah"
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_forever</span>
                                Kosongkan Sampah
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── SEARCH BAR ── */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: '1rem'
            }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                    <span className="material-icons-round" style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1.15rem',
                        color: 'var(--text-muted)'
                    }}>
                        search
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari ID pesanan, nama pemesan, tim, atau produk..."
                        className="form-input"
                        style={{
                            height: '38px',
                            paddingLeft: '2.35rem',
                            paddingRight: '0.75rem',
                            fontSize: '0.85rem',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* ── TABEL PESANAN TERHAPUS ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <span className="material-icons-round" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Memuat data tempat sampah...</p>
                </div>
            ) : trashItems.length === 0 ? (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '3.5rem', color: '#10b981', opacity: 0.85 }}>
                        delete_sweep
                    </span>
                    <h3 style={{ margin: '0.75rem 0 0.35rem', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Tempat Sampah Bersih!
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {search ? `Tidak ada pesanan terhapus yang cocok dengan pencarian "${search}".` : 'Tidak ada data pesanan yang dihapus saat ini.'}
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '13%' }}>ID Pesanan</th>
                                    <th style={{ width: '22%' }}>Pelanggan &amp; Tim</th>
                                    <th style={{ width: '20%' }}>Produk &amp; Qty</th>
                                    <th style={{ width: '16%' }}>Nilai Pesanan</th>
                                    <th style={{ width: '14%' }}>Waktu Dihapus</th>
                                    <th style={{ width: '15%', textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trashItems.map(item => (
                                    <tr key={item.id} style={{ opacity: 0.95 }}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                {item.id}
                                            </div>
                                            {item.wo_number && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {item.wo_number}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {item.customer || '-'}
                                            </div>
                                            {item.company && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {item.company}
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    📞 {item.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                                {item.product || '-'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                {Number(item.qty || 0).toLocaleString('id-ID')} pcs
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                {formatCurrency(item.price)}
                                            </div>
                                            {Number(item.dp) > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    DP: {formatCurrency(item.dp)}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                                                {formatIndoDateTime(item.deleted_at)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                                {/* Intip Detail */}
                                                <button
                                                    className="action-btn"
                                                    onClick={() => setDetailModal(item)}
                                                    title="Intip detail pesanan ini"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>visibility</span>
                                                </button>

                                                {/* Pulihkan */}
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleRestore(item.id, item.customer)}
                                                    title="Pulihkan pesanan ini ke antrean aktif"
                                                    style={{ color: '#10b981' }}
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>restore</span>
                                                </button>

                                                {/* Hapus Permanen */}
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleDestroy(item.id, item.customer)}
                                                    title="Hapus permanen dari database"
                                                    style={{ color: '#dc2626' }}
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_forever</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── MODAL PRATINJAU DETAIL PESANAN SAMPAH ── */}
            {detailModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '680px',
                        maxHeight: '88vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                    }}>
                        {/* Header Modal */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-card)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span className="material-icons-round" style={{ color: '#ef4444', fontSize: '1.5rem' }}>
                                    auto_delete
                                </span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                        Detail Pesanan: {detailModal.id}
                                    </h3>
                                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                                        Dihapus pada: {formatIndoDateTime(detailModal.deleted_at)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    padding: '4px'
                                }}
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            {/* Ringkasan Profil */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                background: 'var(--bg-secondary)',
                                padding: '1rem',
                                borderRadius: '10px',
                                marginBottom: '1.25rem',
                                fontSize: '0.85rem'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                        Pemesan / Tim
                                    </span>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        {detailModal.customer}
                                    </strong>
                                    {detailModal.company && (
                                        <div style={{ color: 'var(--text-secondary)' }}>{detailModal.company}</div>
                                    )}
                                </div>

                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                        Kontak
                                    </span>
                                    <div style={{ color: 'var(--text-primary)' }}>📞 {detailModal.phone || '-'}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>✉️ {detailModal.email || '-'}</div>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                        Produk Utama
                                    </span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{detailModal.product}</strong>
                                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                        Total: {Number(detailModal.qty || 0).toLocaleString('id-ID')} pcs
                                    </div>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                        Status Keuangan
                                    </span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        Total: {formatCurrency(detailModal.price)}
                                    </strong>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        DP: {formatCurrency(detailModal.dp)}
                                    </div>
                                </div>
                            </div>

                            {/* Alamat Pengiriman */}
                            {detailModal.address && (
                                <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                                        Alamat Pengiriman
                                    </span>
                                    <div style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                                        {detailModal.address}
                                    </div>
                                </div>
                            )}

                            {/* Daftar Item / Rincian Pesanan */}
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Rincian Item Produk ({detailModal.items?.length || 0} item)
                                </span>
                                {detailModal.items && detailModal.items.length > 0 ? (
                                    <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.5rem 0' }}>Deskripsi</th>
                                                <th style={{ padding: '0.5rem 0', width: '70px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '0.5rem 0', width: '110px', textAlign: 'right' }}>Harga Satuan</th>
                                                <th style={{ padding: '0.5rem 0', width: '120px', textAlign: 'right' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.items.map((it, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                                                        {it.description || 'Item'}
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                        {it.qty}
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                        {formatCurrency(it.unit_price)}
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {formatCurrency(Number(it.qty || 0) * Number(it.unit_price || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Tidak ada rincian item spesifik.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer Modal Actions */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-secondary)'
                        }}>
                            <button
                                onClick={() => handleDestroy(detailModal.id, detailModal.customer)}
                                disabled={actionLoading}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.5rem 0.85rem',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    cursor: 'pointer'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>delete_forever</span>
                                Hapus Permanen
                            </button>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setDetailModal(null)}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={() => handleRestore(detailModal.id, detailModal.customer)}
                                    disabled={actionLoading}
                                    className="btn-primary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.5rem 1.15rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600
                                    }}
                                >
                                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>restore</span>
                                    Pulihkan Pesanan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
