'use client';

import { useEffect, useState, useMemo } from 'react';
import { getOrderPaymentStatus, formatCurrency } from '@/lib/paymentStatus';

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusLabel(status) {
    const labels = { baru: 'Baru', proses: 'Diproses', selesai: 'Selesai', dikirim: 'Dikirim', pending: 'Pending' };
    return labels[status] || status;
}

const MONTH_NAMES = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

export default function OrdersPage({ onOrderClick, onAdd, onEdit, searchQuery }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [localSearch, setLocalSearch] = useState('');

    const currentYear = new Date().getFullYear();
    const [availableYears, setAvailableYears] = useState([String(currentYear)]);

    function fetchAvailableYears() {
        fetch('/api/orders/years')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setAvailableYears(data);
                }
            })
            .catch(err => console.error('Failed to fetch order years:', err));
    }

    useEffect(() => {
        fetchAvailableYears();
    }, []);

    const effectiveSearch = localSearch !== '' ? localSearch : (searchQuery || '');

    function fetchOrders() {
        setLoading(true);
        let url = '/api/orders?';
        if (filter && filter !== 'all') url += `status=${encodeURIComponent(filter)}&`;
        if (effectiveSearch) url += `search=${encodeURIComponent(effectiveSearch)}&`;
        if (filterYear) url += `year=${encodeURIComponent(filterYear)}&`;
        if (filterMonth) url += `month=${encodeURIComponent(filterMonth)}&`;

        fetch(url)
            .then(r => r.json())
            .then(d => {
                if (Array.isArray(d)) setOrders(d);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchOrders();
    }, [filter, effectiveSearch, filterYear, filterMonth]);

    function handleResetFilters() {
        setFilter('all');
        setLocalSearch('');
        setFilterYear('');
        setFilterMonth('');
        setFilterPayment('');
    }

    const hasActiveFilter = Boolean((filter && filter !== 'all') || localSearch || filterYear || filterMonth || filterPayment);

    const activePeriodLabel = useMemo(() => {
        const parts = [];
        if (filterMonth) {
            const m = MONTH_NAMES.find(x => x.value === filterMonth);
            if (m) parts.push(m.label);
        }
        if (filterYear) parts.push(filterYear);
        return parts.join(' ');
    }, [filterYear, filterMonth]);

    const displayedOrders = useMemo(() => {
        if (!filterPayment) return orders;
        return orders.filter(o => {
            const payStatus = getOrderPaymentStatus(o);
            return payStatus.status === filterPayment;
        });
    }, [orders, filterPayment]);

    const totalRevenue = useMemo(() => {
        return displayedOrders.reduce((sum, o) => sum + (parseInt(o.price) || 0), 0);
    }, [displayedOrders]);

    const totalQty = useMemo(() => {
        return displayedOrders.reduce((sum, o) => sum + (parseInt(o.qty) || 0), 0);
    }, [displayedOrders]);

    async function handleDelete(orderId) {
        if (!confirm(`Pindahkan pesanan "${orderId}" ke Tempat Sampah?\n\n(Catatan: Pesanan dapat dipulihkan kembali kapan saja di menu Tempat Sampah)`)) return;
        try {
            await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            fetchOrders();
            fetchAvailableYears();
        } catch (err) {
            console.error(err);
        }
    }

    const filterBtns = [
        { key: 'all', label: 'Semua Status' },
        { key: 'baru', label: 'Baru' },
        { key: 'proses', label: 'Diproses' },
        { key: 'selesai', label: 'Selesai' },
        { key: 'dikirim', label: 'Dikirim' },
    ];

    return (
        <div className="page-content">
            {/* Top Bar: Title & Primary CTA */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                        <span className="material-icons-round" style={{ color: '#3b82f6', fontSize: '1.6rem' }}>
                            shopping_cart
                        </span>
                        Daftar Pesanan
                    </h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Pantau pesanan pelanggan, status pengerjaan, pembayaran, invoice, dan tenggat waktu pengiriman.
                    </p>
                </div>

                <button className="btn-add" onClick={onAdd} style={{ padding: '0.55rem 1.15rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>add</span>
                    Pesanan Baru
                </button>
            </div>

            {/* Quick Status Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                {filterBtns.map(f => (
                    <button
                        key={f.key}
                        type="button"
                        className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                        style={{
                            height: '36px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0 0.85rem',
                            fontSize: '0.82rem',
                            fontWeight: filter === f.key ? 700 : 500,
                            borderRadius: '8px'
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Filter Bar Work Order Style (Search + Tahun + Bulan + Reset) */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
                {/* Search Input */}
                <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
                    <input
                        type="text"
                        className="form-input"
                        style={{
                            paddingLeft: '2.25rem',
                            height: '38px',
                            fontSize: '0.875rem',
                            width: '100%',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}
                        placeholder="Cari ID Pesanan, Pelanggan, Produk..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                    <span
                        className="material-icons-round"
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.15rem',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        search
                    </span>
                </div>

                {/* Filter Tahun */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                        calendar_today
                    </span>
                    <select
                        className="form-select"
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            minWidth: '130px',
                            fontWeight: filterYear ? 700 : 500
                        }}
                    >
                        <option value="">Semua Tahun</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>Tahun {y}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Bulan */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                        date_range
                    </span>
                    <select
                        className="form-select"
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            minWidth: '140px',
                            fontWeight: filterMonth ? 700 : 500
                        }}
                    >
                        <option value="">Semua Bulan</option>
                        {MONTH_NAMES.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Status Pembayaran */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                        payments
                    </span>
                    <select
                        className="form-select"
                        value={filterPayment}
                        onChange={e => setFilterPayment(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            minWidth: '170px',
                            fontWeight: filterPayment ? 700 : 500
                        }}
                    >
                        <option value="">Semua Pembayaran</option>
                        <option value="lunas">🟢 Lunas Penuh</option>
                        <option value="diikhlaskan">🔵 Lunas (Diikhlaskan)</option>
                        <option value="belum_lunas">🟡 Belum Lunas</option>
                        <option value="macet">🔴 Piutang Macet (&gt; 30 Hari)</option>
                    </select>
                </div>

                {/* Reset Filter Button */}
                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{
                            height: '38px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s ease'
                        }}
                        title="Bersihkan semua filter"
                    >
                        <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>restart_alt</span>
                        Reset
                    </button>
                )}
            </div>

            {/* Summary Metrics Bar */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                padding: '0.65rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.88rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="material-icons-round" style={{ color: '#3b82f6', fontSize: '1.2rem' }}>
                        analytics
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        Menampilkan <strong>{displayedOrders.length}</strong> Pesanan
                    </span>

                    {filter !== 'all' && (
                        <span style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            Status: {getStatusLabel(filter)}
                        </span>
                    )}

                    {filterPayment && (
                        <span style={{
                            background: filterPayment === 'lunas' ? 'rgba(16, 185, 129, 0.15)' : filterPayment === 'diikhlaskan' ? 'rgba(59, 130, 246, 0.15)' : filterPayment === 'macet' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: filterPayment === 'lunas' ? '#10b981' : filterPayment === 'diikhlaskan' ? '#3b82f6' : filterPayment === 'macet' ? '#ef4444' : '#f59e0b',
                            border: '1px solid currentColor',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            Bayar: {filterPayment === 'lunas' ? 'Lunas Penuh' : filterPayment === 'diikhlaskan' ? 'Diikhlaskan' : filterPayment === 'macet' ? 'Piutang Macet' : 'Belum Lunas'}
                        </span>
                    )}

                    {activePeriodLabel && (
                        <span style={{
                            background: '#3b82f6',
                            color: '#ffffff',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em'
                        }}>
                            📅 Periode: {activePeriodLabel}
                        </span>
                    )}

                    {effectiveSearch && (
                        <span style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                        }}>
                            🔍 "{effectiveSearch}"
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)'
                }}>
                    <span>
                        Total Qty: <strong style={{ color: '#38bdf8' }}>{totalQty} pcs</strong>
                    </span>
                    <span>•</span>
                    <span>
                        Total Tagihan: <strong style={{ color: '#10b981' }}>{formatCurrency(totalRevenue)}</strong>
                    </span>
                </div>
            </div>

            {/* Table Card */}
            <div className="content-card full-width">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Pelanggan</th>
                                <th>Produk</th>
                                <th>Qty</th>
                                <th>Total Tagihan</th>
                                <th>Pembayaran</th>
                                <th>Status</th>
                                <th>Deadline</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={9}><div className="skeleton skeleton-row" /></td></tr>
                                ))
                            ) : displayedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                                        <span className="material-icons-round" style={{ fontSize: '3rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>
                                            {hasActiveFilter ? 'filter_list_off' : 'inbox'}
                                        </span>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {hasActiveFilter ? 'Tidak ada pesanan pada filter yang dipilih' : 'Belum ada data pesanan'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {hasActiveFilter ? 'Silakan coba ubah pilihan status, pembayaran, tahun, bulan, atau tekan Reset.' : 'Klik tombol Pesanan Baru di atas untuk membuat pesanan.'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedOrders.map(o => {
                                    const totalPrice = parseInt(o.price, 10) || 0;
                                    const payStatus = getOrderPaymentStatus(o);

                                    return (
                                        <tr key={o.id}>
                                            <td><strong>{o.id}</strong></td>
                                            <td>{o.customer}</td>
                                            <td>{o.product}</td>
                                            <td>{o.qty} pcs</td>
                                            <td>
                                                <strong style={{ fontSize: '0.9rem' }}>{formatCurrency(totalPrice)}</strong>
                                            </td>
                                            <td>
                                                {payStatus.status === 'lunas' ? (
                                                    <span className="status-badge selesai" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>check_circle</span>
                                                        Lunas
                                                    </span>
                                                ) : payStatus.status === 'diikhlaskan' ? (
                                                    <div>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: '#3b82f6',
                                                            background: 'rgba(59, 130, 246, 0.12)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '6px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}>
                                                            <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>handshake</span>
                                                            Diikhlaskan
                                                        </span>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                            Terbayar: {formatCurrency(payStatus.totalPaid)}
                                                        </div>
                                                    </div>
                                                ) : payStatus.status === 'macet' ? (
                                                    <div>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: '#ef4444',
                                                            background: 'rgba(239, 68, 68, 0.12)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '6px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}>
                                                            <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>error_outline</span>
                                                            Macet ({payStatus.daysLate} hr)
                                                        </span>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', marginTop: '0.2rem' }}>
                                                            Sisa: {formatCurrency(payStatus.sisa)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#eab308' }}>
                                                            Sisa: {formatCurrency(payStatus.sisa)}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                            Terbayar: {formatCurrency(payStatus.totalPaid)}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td><span className={`status-badge ${o.status}`}>{getStatusLabel(o.status)}</span></td>
                                            <td>{formatDate(o.deadline)}</td>
                                            <td>
                                                <button className="action-btn" onClick={() => onOrderClick && onOrderClick(o)} title="Detail">
                                                    <span className="material-icons-round">visibility</span>
                                                </button>
                                                {' '}
                                                <button className="action-btn" onClick={() => onEdit(o)} title="Edit" style={{ marginLeft: '0.25rem' }}>
                                                    <span className="material-icons-round">edit</span>
                                                </button>
                                                {' '}
                                                <button className="action-btn" onClick={() => handleDelete(o.id)} title="Hapus" style={{ marginLeft: '0.25rem' }}>
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
