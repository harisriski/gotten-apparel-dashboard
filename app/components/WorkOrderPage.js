'use client';

import { useEffect, useMemo, useState } from 'react';
import WorkOrderPrintModal from './WorkOrderPrintModal';

const MONTH_NAMES = [
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

export default function WorkOrderPage({ onAdd, onEdit, onView }) {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedModalImage, setSelectedModalImage] = useState(null);
    const [selectedPrintWorkOrder, setSelectedPrintWorkOrder] = useState(null);

    // Dynamic list of available years from database + current year
    const currentYear = new Date().getFullYear();
    const [availableYears, setAvailableYears] = useState([String(currentYear)]);

    function fetchAvailableYears() {
        fetch('/api/work-orders/years')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setAvailableYears(data);
                }
            })
            .catch(err => console.error('Failed to fetch years:', err));
    }

    useEffect(() => {
        fetchAvailableYears();
    }, []);

    // List of days 1..31
    const dayOptions = useMemo(() => {
        return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
    }, []);

    function fetchWorkOrders() {
        setLoading(true);
        let url = '/api/work-orders?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (selectedYear) url += `year=${encodeURIComponent(selectedYear)}&`;
        if (selectedMonth) url += `month=${encodeURIComponent(selectedMonth)}&`;
        if (selectedDay) url += `day=${encodeURIComponent(selectedDay)}&`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setWorkOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchWorkOrders();
    }, [search, selectedYear, selectedMonth, selectedDay]);

    function handleResetFilters() {
        setSearch('');
        setSelectedYear('');
        setSelectedMonth('');
        setSelectedDay('');
    }

    const hasActiveFilter = Boolean(search || selectedYear || selectedMonth || selectedDay);

    // Total accumulation of pcs across filtered orders
    const totalPcs = useMemo(() => {
        return workOrders.reduce((sum, wo) => {
            const qty = parseInt(wo.data_ukuran?.grand_total, 10);
            return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
    }, [workOrders]);

    // Human-readable active filter description
    const activeFilterLabel = useMemo(() => {
        const parts = [];
        if (selectedDay) parts.push(`Tgl ${selectedDay}`);
        if (selectedMonth) {
            const m = MONTH_NAMES.find(x => x.value === selectedMonth);
            if (m) parts.push(m.label);
        }
        if (selectedYear) parts.push(selectedYear);
        return parts.join(' ');
    }, [selectedYear, selectedMonth, selectedDay]);

    async function handleDelete(wo) {
        if (!confirm(`Hapus Work Order ${wo.wo_number} (${wo.customer || wo.team_name})?`)) return;
        try {
            await fetch(`/api/work-orders?id=${wo.id}`, { method: 'DELETE' });
            fetchWorkOrders();
            fetchAvailableYears();
        } catch (err) {
            console.error(err);
        }
    }

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
                    <h2 style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        margin: 0,
                        color: 'var(--text-primary, #f1f5f9)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <span className="material-icons-round" style={{ color: '#3b82f6', fontSize: '1.6rem' }}>
                            assignment
                        </span>
                        Work Order Jersey
                    </h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        Kelola lembar SPK produksi, spesifikasi kain, pola, jadwal timeline, dan cetak dokumen lapangan.
                    </p>
                </div>
            </div>

            {/* Filter Bar: Search + Tahun + Bulan + Tanggal + Reset */}
            <div style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
                {/* Search Text */}
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
                            background: 'var(--bg-secondary, #f8fafc)',
                            color: 'var(--text-primary, #f1f5f9)',
                            border: '1px solid var(--border-color, #cbd5e1)'
                        }}
                        placeholder="Cari No. WO, Order, Tim, Customer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span
                        className="material-icons-round"
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.15rem',
                            color: 'var(--text-muted, #94a3b8)'
                        }}
                    >
                        search
                    </span>
                </div>

                {/* Filter Tahun */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        calendar_today
                    </span>
                    <select
                        className="form-select"
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: 'var(--bg-secondary, #1a1d27)',
                            color: 'var(--text-primary, #f1f5f9)',
                            minWidth: '130px',
                            fontWeight: selectedYear ? 700 : 500
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
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        date_range
                    </span>
                    <select
                        className="form-select"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: 'var(--bg-secondary, #1a1d27)',
                            color: 'var(--text-primary, #f1f5f9)',
                            minWidth: '140px',
                            fontWeight: selectedMonth ? 700 : 500
                        }}
                    >
                        <option value="">Semua Bulan</option>
                        {MONTH_NAMES.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Tanggal / Hari */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.15rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        event
                    </span>
                    <select
                        className="form-select"
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                        style={{
                            height: '38px',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: 'var(--bg-secondary, #1a1d27)',
                            color: 'var(--text-primary, #f1f5f9)',
                            minWidth: '120px',
                            fontWeight: selectedDay ? 700 : 500
                        }}
                    >
                        <option value="">Semua Tgl</option>
                        {dayOptions.map(d => (
                            <option key={d} value={d}>Tgl {d}</option>
                        ))}
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

            {/* Summary Metrics Bar (Universal & Realtime) */}
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
                    <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 500 }}>
                        Menampilkan <strong>{workOrders.length}</strong> Work Order
                    </span>

                    {activeFilterLabel && (
                        <span style={{
                            background: '#3b82f6',
                            color: '#ffffff',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em'
                        }}>
                            📅 Periode: {activeFilterLabel}
                        </span>
                    )}

                    {search && (
                        <span style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-primary, #f1f5f9)',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            Keyword: &quot;{search}&quot;
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>Total Akumulasi:</span>
                    <span style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}>
                        {totalPcs.toLocaleString('id-ID')} pcs
                    </span>
                </div>
            </div>

            {/* Content Area: Cards List or Empty State */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', width: '100%' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 260, borderRadius: '12px' }} />
                    ))}
                </div>
            ) : workOrders.length === 0 ? (
                <div style={{
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color)',
                    width: '100%'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '3.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {hasActiveFilter ? 'filter_list_off' : 'inventory'}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {hasActiveFilter
                            ? 'Tidak ada Work Order pada periode / filter yang dipilih'
                            : 'Belum ada Work Order Jersey'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '460px', margin: '0.5rem auto 1.25rem', lineHeight: 1.5 }}>
                        {hasActiveFilter
                            ? 'Silakan coba ubah pilihan Tahun, Bulan, Tanggal, atau tekan tombol Reset di atas.'
                            : 'Work Order (SPK) dibuat otomatis oleh sistem saat ada pesanan baru yang diinput di menu Pesanan.'}
                    </p>
                    {hasActiveFilter && (
                        <button
                            type="button"
                            className="btn-add"
                            onClick={handleResetFilters}
                            style={{ margin: '0 auto', background: '#64748b' }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>restart_alt</span>
                            Reset Filter Pencarian
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem', width: '100%' }}>
                    {workOrders.map(wo => {
                        const designsList = Array.isArray(wo.designs) ? wo.designs : [];

                        return (
                            <div
                                key={wo.id}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                            >
                                <div>
                                    {/* Card Header: WO Number, Status & Action Menu */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#3b82f6',
                                                background: 'rgba(59, 130, 246, 0.12)',
                                                padding: '0.25rem 0.55rem',
                                                borderRadius: '6px'
                                            }}>
                                                {wo.wo_number}
                                            </span>
                                            {wo.order_id && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                                    Order #{wo.order_id}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPrintWorkOrder(wo)}
                                                style={{
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.35rem 0.65rem',
                                                    color: '#38bdf8',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                                title="Cetak SPK Produksi"
                                            >
                                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>print</span>
                                                Cetak
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(wo)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    padding: '0.35rem 0.55rem',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer'
                                                }}
                                                title="Edit Work Order"
                                            >
                                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>edit</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(wo)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '6px',
                                                    padding: '0.35rem 0.55rem',
                                                    color: '#ef4444',
                                                    cursor: 'pointer'
                                                }}
                                                title="Hapus Work Order"
                                            >
                                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Team Name / Project Title */}
                                    <h4 style={{
                                        fontSize: '1.05rem',
                                        fontWeight: 700,
                                        margin: '0 0 0.25rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {wo.data_transaksi?.nama_project || wo.team_name || 'Tanpa Nama Tim'}
                                    </h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        Customer: <strong style={{ color: 'var(--text-primary)' }}>{wo.customer}</strong>
                                    </div>

                                    {/* Mockups Row (Up to 3 thumbnails) */}
                                    {designsList.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            marginBottom: '0.85rem',
                                            background: 'var(--bg-secondary)',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {designsList.slice(0, 3).map((d, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => d.url && setSelectedModalImage(d.url)}
                                                    style={{
                                                        width: '54px',
                                                        height: '54px',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        cursor: d.url ? 'pointer' : 'default',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative'
                                                    }}
                                                    title={d.label || `Desain #${idx + 1}`}
                                                >
                                                    {d.url ? (
                                                        <img
                                                            src={d.url}
                                                            alt={d.label}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <span className="material-icons-round" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>image</span>
                                                    )}
                                                </div>
                                            ))}
                                            {designsList.length > 3 && (
                                                <div style={{
                                                    width: '54px',
                                                    height: '54px',
                                                    borderRadius: '6px',
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    +{designsList.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Key Details Pills: Tanggal Masuk & Target Keluar */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.5rem',
                                        fontSize: '0.75rem',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Tgl Masuk:</span>
                                            <strong style={{ color: 'var(--text-primary)' }}>
                                                {wo.data_transaksi?.tanggal_masuk || '-'}
                                            </strong>
                                        </div>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Target Keluar:</span>
                                            <strong style={{ color: '#10b981' }}>
                                                {wo.data_transaksi?.tanggal_keluar || '-'}
                                                {wo.data_transaksi?.estimasi_hari ? ` (${wo.data_transaksi.estimasi_hari}h)` : ''}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Specs Badges: Bahan, Celana, Timeline, Qty */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.72rem' }}>
                                        {wo.data_transaksi?.bahan && (
                                            <span style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                                🧵 {wo.data_transaksi.bahan}
                                            </span>
                                        )}
                                        <span style={{
                                            background: wo.spesifikasi_celana?.has_celana ? 'rgba(236, 72, 153, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                                            color: wo.spesifikasi_celana?.has_celana ? '#f472b6' : 'var(--text-secondary)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontWeight: 600
                                        }}>
                                            {wo.spesifikasi_celana?.has_celana ? '🩳 Stel Celana' : '👕 Baju Saja'}
                                        </span>
                                        {Array.isArray(wo.timeline_kerja) && wo.timeline_kerja.length > 0 && (
                                            <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                                ⏳ {wo.timeline_kerja.length} Tahap
                                            </span>
                                        )}
                                        {wo.data_ukuran?.grand_total > 0 && (
                                            <span style={{
                                                background: 'rgba(56, 189, 248, 0.12)',
                                                color: '#38bdf8',
                                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                                padding: '0.2rem 0.55rem',
                                                borderRadius: '4px',
                                                fontWeight: 800
                                            }}>
                                                📏 {wo.data_ukuran.grand_total} pcs
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '0.75rem',
                                    marginTop: '0.85rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                        Dibuat: {wo.created_at ? wo.created_at.slice(0, 10) : '-'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(wo)}
                                        style={{
                                            background: 'var(--primary-color, #3b82f6)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '6px',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        Buka SPK
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Image Preview Modal */}
            {selectedModalImage && (
                <div
                    onClick={() => setSelectedModalImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        cursor: 'zoom-out'
                    }}
                >
                    <img
                        src={selectedModalImage}
                        alt="Preview Desain ACC"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                        }}
                    />
                </div>
            )}

            {/* Print SPK Modal */}
            {selectedPrintWorkOrder && (
                <WorkOrderPrintModal
                    workOrder={selectedPrintWorkOrder}
                    onClose={() => setSelectedPrintWorkOrder(null)}
                />
            )}
        </div>
    );
}
