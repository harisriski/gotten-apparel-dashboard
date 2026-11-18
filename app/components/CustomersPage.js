'use client';

import { useEffect, useState } from 'react';

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

const colors = [
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
];

const monthOptions = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function CustomersPage({ onAdd, onEdit, onDetail }) {
    const [customers, setCustomers] = useState([]);
    const [summary, setSummary] = useState({
        totalCustomers: 0,
        totalRevenue: 0,
        totalQty: 0,
        totalOrders: 0,
        topCustomer: null,
    });
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [sortBy, setSortBy] = useState('spent'); // 'spent' | 'qty' | 'orders'

    // Modal Riwayat Cepat
    const [quickHistoryModal, setQuickHistoryModal] = useState(null); // customer object

    // Ambil tahun dinamis dari API
    useEffect(() => {
        fetch('/api/customers/years')
            .then(r => r.json())
            .then(years => {
                if (Array.isArray(years) && years.length > 0) {
                    setAvailableYears(years);
                } else {
                    const curY = String(new Date().getFullYear());
                    setAvailableYears([curY]);
                }
            })
            .catch(() => {
                const curY = String(new Date().getFullYear());
                setAvailableYears([curY]);
            });
    }, []);

    // Ambil data pelanggan & peringkat
    function fetchCustomers() {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterYear) params.set('year', filterYear);
        if (filterMonth) params.set('month', filterMonth);
        if (search) params.set('search', search);
        if (sortBy) params.set('sort', sortBy);

        fetch(`/api/customers?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                if (data && data.customers) {
                    setCustomers(data.customers);
                    setSummary(data.summary || {});
                } else if (Array.isArray(data)) {
                    setCustomers(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch customers error:', err);
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchCustomers();
    }, [filterYear, filterMonth, search, sortBy]);

    function handleResetFilters() {
        setSearch('');
        setFilterYear('');
        setFilterMonth('');
        setSortBy('spent');
    }

    async function handleDelete(customer) {
        if (!confirm(`Hapus data kontak pelanggan "${customer.name}"? (Data riwayat pesanan tetap tersimpan di database)`)) return;
        try {
            await fetch(`/api/customers?id=${customer.id}`, { method: 'DELETE' });
            fetchCustomers();
        } catch (err) {
            console.error('Delete customer error:', err);
        }
    }

    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function getWaLink(phone, customerName) {
        if (!phone) return null;
        let clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) clean = '62' + clean.slice(1);
        if (!clean.startsWith('62') && clean.length > 5) clean = '62' + clean;
        const msg = encodeURIComponent(`Halo Kak ${customerName}, terima kasih banyak telah menjadi pelanggan setia Gotten Apparel!`);
        return `https://wa.me/${clean}?text=${msg}`;
    }

    // Top 3 Podium
    const topThree = customers.slice(0, 3);
    const remainingCustomers = customers.slice(3);

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
                        <span style={{ fontSize: '1.75rem' }}>👑</span> Peringkat Pelanggan &amp; Loyalitas
                    </h1>
                    <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                    }}>
                        Pantau pelanggan dengan order terbanyak, omzet belanja tertinggi, dan tentukan reward bulanan atau tahunan.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={onAdd}
                        className="btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem 1rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>person_add</span>
                        Tambah Pelanggan Manual
                    </button>
                </div>
            </div>

            {/* ── FILTER & SORT BAR (SERAGAM 38PX) ── */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '0.85rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.65rem'
                }}>
                    {/* Pencarian */}
                    <div style={{
                        flex: '1 1 240px',
                        minWidth: '220px',
                        position: 'relative'
                    }}>
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
                            placeholder="Cari nama pelanggan, instansi/tim, no. HP..."
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

                    {/* Filter Tahun */}
                    <div style={{ minWidth: '135px' }}>
                        <select
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            className="form-input"
                            style={{
                                height: '38px',
                                padding: '0 0.75rem',
                                fontSize: '0.85rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                background: 'var(--bg-card)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Semua Tahun</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>Tahun {y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Bulan */}
                    <div style={{ minWidth: '145px' }}>
                        <select
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                            className="form-input"
                            style={{
                                height: '38px',
                                padding: '0 0.75rem',
                                fontSize: '0.85rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                background: 'var(--bg-card)',
                                cursor: 'pointer'
                            }}
                        >
                            {monthOptions.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kriteria Peringkat (Sort By) */}
                    <div style={{ minWidth: '190px' }}>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="form-input"
                            style={{
                                height: '38px',
                                padding: '0 0.75rem',
                                fontSize: '0.85rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                background: 'var(--bg-card)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'var(--accent-primary)'
                            }}
                            title="Pilih tolok ukur urutan peringkat pelanggan"
                        >
                            <option value="spent">💰 Urut: Total Belanja (Rp)</option>
                            <option value="qty">👕 Urut: Total Qty (Pcs)</option>
                            <option value="orders">🔄 Urut: Frekuensi Order</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    {(search || filterYear || filterMonth || sortBy !== 'spent') && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="btn-secondary"
                            style={{
                                height: '38px',
                                padding: '0 0.85rem',
                                fontSize: '0.82rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                borderRadius: '8px',
                                whiteSpace: 'nowrap'
                            }}
                            title="Reset semua filter ke default"
                        >
                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>restart_alt</span>
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {/* ── SUMMARY METRICS BANNER ── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px'
                    }}>
                        📅 Periode: {filterMonth ? monthOptions.find(m => m.value === filterMonth)?.label : 'Semua Bulan'} {filterYear || 'Semua Tahun'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Menampilkan <strong>{customers.length}</strong> Pelanggan Aktif
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                        Total Jersey: <strong style={{ color: 'var(--text-primary)' }}>{summary.totalQty ? summary.totalQty.toLocaleString('id-ID') : 0} pcs</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        Total Omzet Belanja: <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{formatCurrency(summary.totalRevenue)}</strong>
                    </div>
                    {summary.topCustomer && (
                        <div style={{
                            fontSize: '0.82rem',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            fontWeight: 700,
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            👑 Top 1: {summary.topCustomer.name}
                        </div>
                    )}
                </div>
            </div>

            {/* ── LOADING / SKELETON ── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />
                    ))}
                </div>
            ) : customers.length === 0 ? (
                /* ── EMPTY STATE ── */
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '3.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                        emoji_events
                    </span>
                    <h3 style={{ margin: '0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                        Belum Ada Data Pelanggan pada Periode Ini
                    </h3>
                    <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.85rem' }}>
                        {search || filterYear || filterMonth ? 'Coba ubah atau reset filter untuk melihat pelanggan lainnya.' : 'Pesanan baru yang dibuat akan otomatis tercatat ke dalam peringkat ini.'}
                    </p>
                    {(search || filterYear || filterMonth) && (
                        <button onClick={handleResetFilters} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            Reset Filter
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* ── PODIUM TOP 3 (KANDIDAT UTAMA REWARD) ── */}
                    {topThree.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0.85rem'
                            }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    margin: 0,
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}>
                                    <span>🏆</span> Podium Peringkat Teratas (Kandidat Reward)
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Urutan berdasarkan: {sortBy === 'qty' ? 'Total Jersey (Pcs)' : sortBy === 'orders' ? 'Frekuensi Pesanan' : 'Total Belanja (Rp)'}
                                </span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                                gap: '1rem',
                                alignItems: 'stretch'
                            }}>
                                {topThree.map((c, idx) => {
                                    const isGold = idx === 0;
                                    const isSilver = idx === 1;
                                    const isBronze = idx === 2;

                                    const borderColor = isGold ? '#f59e0b' : isSilver ? '#94a3b8' : '#f97316';
                                    const ribbonBg = isGold
                                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                        : isSilver
                                        ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                                        : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
                                    const titleBadge = isGold ? '🥇 JUARA 1' : isSilver ? '🥈 JUARA 2' : '🥉 JUARA 3';
                                    const rewardTag = isGold ? '👑 Calon Reward Utama' : isSilver ? '🎁 Calon Reward ke-2' : '🎖️ Calon Reward ke-3';

                                    const waLink = getWaLink(c.phone, c.name);

                                    return (
                                        <div
                                            key={c.id || c.name}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: `2px solid ${borderColor}`,
                                                borderRadius: '14px',
                                                boxShadow: isGold ? '0 6px 18px rgba(245, 158, 11, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Top Banner Ribbon */}
                                            <div style={{
                                                background: ribbonBg,
                                                color: '#ffffff',
                                                padding: '0.45rem 1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.03em'
                                            }}>
                                                <span>{titleBadge}</span>
                                                <span style={{ fontSize: '0.72rem', opacity: 0.95 }}>{rewardTag}</span>
                                            </div>

                                            {/* Body */}
                                            <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                {/* Avatar & Customer Details */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '50%',
                                                        background: colors[idx % colors.length],
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.15rem',
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                                    }}>
                                                        {getInitials(c.name)}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h4 style={{
                                                            margin: 0,
                                                            fontSize: '1.05rem',
                                                            fontWeight: 800,
                                                            color: 'var(--text-primary)',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {c.name}
                                                        </h4>
                                                        <div style={{
                                                            fontSize: '0.82rem',
                                                            color: 'var(--text-secondary)',
                                                            fontWeight: 500,
                                                            marginTop: '0.1rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            🏢 {c.company || 'Pelanggan Umum'}
                                                        </div>
                                                        {c.phone && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                                📞 {c.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Highlight Box Metric */}
                                                <div style={{
                                                    background: isGold ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                                                    border: `1px solid ${isGold ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-color)'}`,
                                                    borderRadius: '10px',
                                                    padding: '0.75rem 0.85rem',
                                                    marginBottom: '1rem',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '0.5rem',
                                                    textAlign: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                                            Total Belanja
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.9rem',
                                                            fontWeight: 800,
                                                            color: isGold ? '#b45309' : '#059669',
                                                            marginTop: '0.15rem'
                                                        }}>
                                                            {formatCurrency(c.totalSpent)}
                                                        </div>
                                                    </div>

                                                    <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                                            Total Jersey
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                                                            {c.totalQty.toLocaleString('id-ID')} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>pcs</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                                            Frekuensi
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                                                            {c.orderCount} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>order</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Info & Actions */}
                                                <div style={{
                                                    marginTop: 'auto',
                                                    paddingTop: '0.75rem',
                                                    borderTop: '1px solid var(--border-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.5rem'
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        Terakhir: <strong>{formatIndoDisplayDate(c.latestOrder)}</strong>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        {waLink && (
                                                            <a
                                                                href={waLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-secondary"
                                                                style={{
                                                                    padding: '0.3rem 0.55rem',
                                                                    fontSize: '0.75rem',
                                                                    textDecoration: 'none',
                                                                    borderRadius: '6px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.2rem',
                                                                    color: '#16a34a'
                                                                }}
                                                                title="Hubungi via WhatsApp untuk kirim reward / ucapan"
                                                            >
                                                                <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>chat</span>
                                                                WA
                                                            </a>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickHistoryModal(c)}
                                                            className="btn-secondary"
                                                            style={{
                                                                padding: '0.3rem 0.55rem',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '6px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.2rem'
                                                            }}
                                                            title="Lihat riwayat pesanan pelanggan ini"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>receipt_long</span>
                                                            Riwayat
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── TABEL LEADERBOARD LENGKAP ── */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            padding: '0.85rem 1.15rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            background: 'var(--bg-secondary)'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--accent-primary)' }}>leaderboard</span>
                                Tabel Peringkat Semua Pelanggan
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Total {customers.length} pelanggan terdata
                            </span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        <th style={{ padding: '0.75rem 1rem', width: '60px', textAlign: 'center' }}>Rank</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Pelanggan &amp; Instansi</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Kontak &amp; Alamat</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Jersey</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Frekuensi</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Belanja (Rp)</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Order Terakhir</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '130px' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((c, i) => {
                                        const isTop3 = c.rank <= 3;
                                        const rankBadgeColor = c.rank === 1 ? '#f59e0b' : c.rank === 2 ? '#64748b' : c.rank === 3 ? '#ea580c' : 'var(--text-secondary)';
                                        const rankBadgeBg = c.rank === 1 ? '#fef3c7' : c.rank === 2 ? '#f1f5f9' : c.rank === 3 ? '#ffedd5' : 'var(--bg-secondary)';
                                        const waLink = getWaLink(c.phone, c.name);

                                        return (
                                            <tr
                                                key={c.id || c.name}
                                                style={{
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: isTop3 ? 'rgba(245, 158, 11, 0.02)' : 'transparent',
                                                    transition: 'background 0.15s'
                                                }}
                                            >
                                                {/* Rank */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: rankBadgeBg,
                                                        color: rankBadgeColor,
                                                        fontWeight: 800,
                                                        fontSize: '0.82rem',
                                                        border: `1px solid ${isTop3 ? rankBadgeColor : 'var(--border-color)'}`
                                                    }}>
                                                        {c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : c.rank === 3 ? '🥉' : `#${c.rank}`}
                                                    </span>
                                                </td>

                                                {/* Pelanggan */}
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: colors[i % colors.length],
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            flexShrink: 0
                                                        }}>
                                                            {getInitials(c.name)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {c.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {c.company || 'Pelanggan Umum'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Kontak */}
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                                        {c.phone || '-'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                                        {c.address || c.email || '-'}
                                                    </div>
                                                </td>

                                                {/* Total Jersey */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {c.totalQty.toLocaleString('id-ID')} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>pcs</span>
                                                </td>

                                                {/* Frekuensi Order */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                                    <span style={{
                                                        background: 'var(--bg-secondary)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-primary)'
                                                    }}>
                                                        {c.orderCount}x order
                                                    </span>
                                                </td>

                                                {/* Total Belanja (Tanpa Substring!) */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: isTop3 ? '#b45309' : '#059669', fontSize: '0.92rem' }}>
                                                    {formatCurrency(c.totalSpent)}
                                                </td>

                                                {/* Order Terakhir */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {formatIndoDisplayDate(c.latestOrder)}
                                                </td>

                                                {/* Aksi */}
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                        {waLink && (
                                                            <a
                                                                href={waLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="action-btn"
                                                                title="Kirim pesan WhatsApp"
                                                                style={{ color: '#16a34a' }}
                                                            >
                                                                <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>chat</span>
                                                            </a>
                                                        )}

                                                        <button
                                                            className="action-btn"
                                                            onClick={() => setQuickHistoryModal(c)}
                                                            title="Lihat riwayat pesanan"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>receipt_long</span>
                                                        </button>

                                                        <button
                                                            className="action-btn"
                                                            onClick={() => onEdit(c)}
                                                            title="Edit data kontak"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>edit</span>
                                                        </button>

                                                        <button
                                                            className="action-btn"
                                                            onClick={() => handleDelete(c)}
                                                            title="Hapus kontak pelanggan"
                                                            style={{ color: '#dc2626' }}
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── MODAL QUICK ORDER HISTORY ── */}
            {quickHistoryModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '680px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden'
                    }}>
                        {/* Header Modal */}
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'var(--accent-primary)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.9rem'
                                }}>
                                    {getInitials(quickHistoryModal.name)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        Riwayat Pesanan: {quickHistoryModal.name}
                                    </h3>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {quickHistoryModal.company || 'Pelanggan Umum'} {quickHistoryModal.phone ? `• ${quickHistoryModal.phone}` : ''}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setQuickHistoryModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.25rem'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.4rem' }}>close</span>
                            </button>
                        </div>

                        {/* Ringkasan Singkat Pelanggan */}
                        <div style={{
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(99, 102, 241, 0.05)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            fontSize: '0.82rem'
                        }}>
                            <div>
                                Peringkat Saat Ini: <strong style={{ color: 'var(--accent-primary)' }}>#{quickHistoryModal.rank}</strong>
                            </div>
                            <div>
                                Total Jersey: <strong>{quickHistoryModal.totalQty} pcs</strong>
                            </div>
                            <div>
                                Total Akumulasi: <strong style={{ color: '#059669' }}>{formatCurrency(quickHistoryModal.totalSpent)}</strong>
                            </div>
                        </div>

                        {/* List Pesanan */}
                        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                            {quickHistoryModal.orders && quickHistoryModal.orders.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {quickHistoryModal.orders.map((ord, oIdx) => (
                                        <div
                                            key={ord.id || oIdx}
                                            style={{
                                                padding: '0.85rem 1rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'var(--bg-card)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                        {ord.id}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.15rem 0.45rem',
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                        background: ord.status === 'Selesai' ? '#dcfce7' : '#eff6ff',
                                                        color: ord.status === 'Selesai' ? '#15803d' : '#2563eb'
                                                    }}>
                                                        {ord.status || 'Diproses'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                    {ord.product || 'Jersey Custom'} • {ord.qty} pcs
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                    📅 Tanggal: {formatIndoDisplayDate(ord.tanggal)} {ord.deadline ? `• Deadline: ${formatIndoDisplayDate(ord.deadline)}` : ''}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                                                    {formatCurrency(ord.price)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                    Tidak ada rincian pesanan untuk periode ini.
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div style={{
                            padding: '0.85rem 1.25rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.5rem',
                            background: 'var(--bg-secondary)'
                        }}>
                            {getWaLink(quickHistoryModal.phone, quickHistoryModal.name) && (
                                <a
                                    href={getWaLink(quickHistoryModal.phone, quickHistoryModal.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{
                                        textDecoration: 'none',
                                        padding: '0.45rem 0.85rem',
                                        fontSize: '0.82rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        background: '#16a34a',
                                        color: '#ffffff'
                                    }}
                                >
                                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>chat</span>
                                    Kirim Reward / Pesan WhatsApp
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => setQuickHistoryModal(null)}
                                className="btn-secondary"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
