'use client';

import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function AnimatedValue({ target, prefix = '' }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const duration = 1500;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(target * ease));
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }, [target]);
    return <>{prefix}{value.toLocaleString('id-ID')}</>;
}

const monthOptions = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];
const currentYear = new Date().getFullYear();
const yearOptions = [{ value: '', label: 'Semua Tahun' }, ...Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))];

const ITEMS_PER_PAGE = 15;

const TYPE_FILTERS = [
    { value: '', label: 'Semua', icon: 'list' },
    { value: 'manual', label: 'Manual', icon: 'edit_note' },
    { value: 'dp', label: 'DP', icon: 'payments' },
    { value: 'pelunasan', label: 'Pelunasan', icon: 'check_circle' },
    { value: 'profit', label: 'Laba/Rugi Pesanan', icon: 'analytics' },
];

export default function FinancePage({ onAdd, onEdit }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const cashflowRef = useRef(null);
    const expenseRef = useRef(null);
    const cashflowChart = useRef(null);
    const expenseChart = useRef(null);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // ── Table controls ──
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedOrders, setExpandedOrders] = useState({});

    function fetchData() {
        setLoading(true);
        let url = '/api/finance?';
        if (filterYear) url += `year=${filterYear}&`;
        if (filterMonth) url += `month=${filterMonth}&`;
        fetch(url)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }

    useEffect(() => { fetchData(); }, [filterYear, filterMonth]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [typeFilter, searchQuery]);

    useEffect(() => {
        if (!data) return;

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const gridColor = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(148, 163, 184, 0.12)';

        if (cashflowChart.current) cashflowChart.current.destroy();
        if (expenseChart.current) expenseChart.current.destroy();

        if (data.monthlyCashflow.length === 0 && data.expenseBreakdown.length === 0) return;

        if (cashflowRef.current && data.monthlyCashflow.length > 0) {
            cashflowChart.current = new Chart(cashflowRef.current, {
                type: 'bar',
                data: {
                    labels: data.monthlyCashflow.map(m => m.month),
                    datasets: [
                        {
                            label: 'Debit (Masuk)',
                            data: data.monthlyCashflow.map(m => m.income),
                            backgroundColor: 'rgba(52, 211, 153, 0.7)',
                            borderColor: '#34d399',
                            borderWidth: 1,
                            borderRadius: 6,
                            borderSkipped: false,
                        },
                        {
                            label: 'Kredit (Keluar)',
                            data: data.monthlyCashflow.map(m => m.expense),
                            backgroundColor: 'rgba(248, 113, 113, 0.7)',
                            borderColor: '#f87171',
                            borderWidth: 1,
                            borderRadius: 6,
                            borderSkipped: false,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15 } },
                        tooltip: {
                            backgroundColor: 'rgba(26, 29, 39, 0.95)',
                            callbacks: { label: ctx => `${ctx.dataset.label}: Rp ${ctx.parsed.y} Juta` }
                        }
                    },
                    scales: {
                        x: { grid: { color: gridColor, drawBorder: false } },
                        y: { grid: { color: gridColor, drawBorder: false }, ticks: { callback: v => `Rp ${v}jt` } }
                    }
                }
            });
        }

        if (expenseRef.current && data.expenseBreakdown.length > 0) {
            expenseChart.current = new Chart(expenseRef.current, {
                type: 'doughnut',
                data: {
                    labels: data.expenseBreakdown.map(e => e.label),
                    datasets: [{
                        data: data.expenseBreakdown.map(e => e.value),
                        backgroundColor: data.expenseBreakdown.map(e => e.color),
                        borderWidth: 0,
                        hoverOffset: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(26, 29, 39, 0.95)',
                            callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` }
                        }
                    }
                }
            });
        }

        return () => {
            if (cashflowChart.current) cashflowChart.current.destroy();
            if (expenseChart.current) expenseChart.current.destroy();
        };
    }, [data]);

    async function handleDelete(tx) {
        if (!confirm(`Hapus transaksi "${tx.description}"?`)) return;
        try {
            await fetch(`/api/finance?id=${tx.id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    }

    if (loading) return (
        <div className="page-content">
            <div className="finance-kpi">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
        </div>
    );

    if (!data) return <div className="page-content"><p>Gagal memuat data.</p></div>;

    const profit = data.summary.totalIn - data.summary.totalOut;
    const profitMargin = data.summary.totalIn > 0 ? ((profit / data.summary.totalIn) * 100).toFixed(1) : 0;
    const ops = data.orderProfitSummary || { totalLabaBersih: 0, totalHpp: 0, totalHargaPesanan: 0, avgMargin: 0, orderCount: 0, lunasCount: 0 };

    // ── Filter + Search + Pagination logic ──
    const filteredTransactions = data.transactions.filter(t => {
        // Skip filtering for profit tab (handled separately)
        if (typeFilter === 'profit') return false;
        // Type filter
        if (typeFilter && (t.type || 'manual') !== typeFilter) return false;
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const searchFields = [
                t.description,
                t.customer,
                t.category,
                t.category_group,
                t.category_sub,
                t.date,
                t.order_id,
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(q)) return false;
        }
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedTransactions = filteredTransactions.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    // Count per type for badges
    const typeCounts = {
        '': data.transactions.length,
        manual: data.transactions.filter(t => (t.type || 'manual') === 'manual').length,
        dp: data.transactions.filter(t => t.type === 'dp').length,
        pelunasan: data.transactions.filter(t => t.type === 'pelunasan').length,
        profit: (data.orderProfitData || []).length,
    };

    // Toggle expand for order profit rows
    function toggleOrderExpand(orderId) {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    }

    const isProfitTab = typeFilter === 'profit';

    // Helper: build category display with breadcrumb
    function renderCategoryPath(t) {
        const parts = [];
        if (t.category_group) parts.push(t.category_group);
        if (t.category) parts.push(t.category);
        if (t.category_sub) parts.push(t.category_sub);
        if (parts.length === 0) return <span className="status-badge proses">{t.category || '-'}</span>;
        return (
            <div className="category-path-cell">
                {parts.map((p, i) => (
                    <span key={i}>
                        {i > 0 && <span className="category-path-sep"> › </span>}
                        <span className={`category-path-part ${i === parts.length - 1 ? 'active' : ''}`}>{p}</span>
                    </span>
                ))}
            </div>
        );
    }

    // Generate page numbers with ellipsis
    function getPageNumbers() {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safePage > 3) pages.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
                pages.push(i);
            }
            if (safePage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }

    return (
        <div className="page-content">
            {/* Date Filter */}
            <div className="page-filters">
                <div className="page-filters-left">
                    <div className="date-filter">
                        <div className="date-filter-item">
                            <span className="material-icons-round" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>calendar_month</span>
                            <select className="date-filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                                {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                            </select>
                        </div>
                        <div className="date-filter-item">
                            <span className="material-icons-round" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>date_range</span>
                            <select className="date-filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <button className="btn-add" onClick={onAdd}>
                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>add</span>
                    Tambah Transaksi
                </button>
            </div>

            {/* Financial KPIs */}
            {/* Financial KPIs */}
            {isProfitTab ? (
                <div className="finance-kpi">
                    <div className="kpi-card" style={{ '--accent': ops.totalLabaBersih >= 0 ? '#34d399' : '#f87171' }}>
                        <div className="kpi-icon" style={{ background: ops.totalLabaBersih >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                            <span className="material-icons-round" style={{ color: ops.totalLabaBersih >= 0 ? '#34d399' : '#f87171' }}>analytics</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Laba Bersih Pesanan</span>
                            <span className="kpi-value"><AnimatedValue target={ops.totalLabaBersih} prefix="Rp " /></span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#f59e0b' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#f59e0b' }}>inventory_2</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total HPP</span>
                            <span className="kpi-value"><AnimatedValue target={ops.totalHpp} prefix="Rp " /></span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#3b82f6' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#3b82f6' }}>percent</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Rata-rata Margin</span>
                            <span className="kpi-value">{ops.avgMargin}%</span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#10b981' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#10b981' }}>check_circle</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Status Lunas</span>
                            <span className="kpi-value">{ops.lunasCount}/{ops.orderCount}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="finance-kpi">
                    <div className="kpi-card" style={{ '--accent': '#34d399' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#34d399' }}>arrow_downward</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total Debit (Masuk)</span>
                            <span className="kpi-value"><AnimatedValue target={data.summary.totalIn} prefix="Rp " /></span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#f87171' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(248,113,113,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#f87171' }}>arrow_upward</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total Kredit (Keluar)</span>
                            <span className="kpi-value"><AnimatedValue target={data.summary.totalOut} prefix="Rp " /></span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#a78bfa' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#a78bfa' }}>account_balance</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Saldo / Profit</span>
                            <span className="kpi-value"><AnimatedValue target={profit} prefix="Rp " /></span>
                        </div>
                    </div>
                    <div className="kpi-card" style={{ '--accent': '#3b82f6' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            <span className="material-icons-round" style={{ color: '#3b82f6' }}>analytics</span>
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Margin Profit</span>
                            <span className="kpi-value">{profitMargin}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📊 Arus Kas Bulanan</h3>
                    </div>
                    {data.monthlyCashflow.length === 0 ? (
                        <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada data transaksi</div>
                    ) : (
                        <div className="chart-body">
                            <canvas ref={cashflowRef}></canvas>
                        </div>
                    )}
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>🧾 Komposisi Pengeluaran</h3>
                    </div>
                    {data.expenseBreakdown.length === 0 ? (
                        <div className="doughnut-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada data pengeluaran</div>
                    ) : (
                        <>
                            <div className="doughnut-container">
                                <canvas ref={expenseRef}></canvas>
                                <div className="doughnut-center">
                                    <span className="doughnut-value">{formatCurrency(data.summary.totalOut)}</span>
                                    <span className="doughnut-label">Total Kredit</span>
                                </div>
                            </div>
                            <div className="chart-legend">
                                {data.expenseBreakdown.map((item, i) => (
                                    <div className="legend-item" key={i}>
                                        <span className="legend-dot" style={{ background: item.color }} />
                                        <span>{item.label} ({item.value}%)</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Transaction History */}
            <div className="content-card full-width">
                <div className="card-header">
                    <h3>📋 Riwayat Transaksi</h3>
                </div>

                {/* ── Table Toolbar: Type Filter + Search ── */}
                <div className="table-toolbar">
                    <div className="table-toolbar-left">
                        <div className="type-filter-group">
                            {TYPE_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    className={`type-filter-btn ${typeFilter === f.value ? 'active' : ''}`}
                                    onClick={() => setTypeFilter(f.value)}
                                >
                                    <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>{f.icon}</span>
                                    {f.label}
                                    <span className="type-filter-count">{typeCounts[f.value]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="table-toolbar-right">
                        <div className="table-search">
                            <span className="material-icons-round table-search-icon">search</span>
                            <input
                                type="text"
                                className="table-search-input"
                                placeholder="Cari deskripsi, kategori, ID pesanan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="table-search-clear" onClick={() => setSearchQuery('')}>
                                    <span className="material-icons-round">close</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Results info ── */}
                {!isProfitTab && (
                    <div className="table-results-info">
                        Menampilkan {paginatedTransactions.length} dari {filteredTransactions.length} transaksi
                        {(typeFilter || searchQuery) && (
                            <button className="table-clear-filters" onClick={() => { setTypeFilter(''); setSearchQuery(''); }}>
                                <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>filter_list_off</span>
                                Reset Filter
                            </button>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════ */}
                {/* ── PROFIT/LOSS TAB ── */}
                {/* ══════════════════════════════════════════════════════════════ */}
                {isProfitTab ? (
                    <>
                        <div className="table-results-info">
                            Menampilkan {(data.orderProfitData || []).length} pesanan dengan transaksi HPP
                        </div>
                        {(data.orderProfitData || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <span className="material-icons-round" style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block', marginBottom: '0.75rem' }}>analytics</span>
                                <p>Belum ada pesanan dengan transaksi HPP terkait.</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Tambahkan transaksi Kredit dengan kategori HPP dan pilih pesanan terkait.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="data-table profit-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '2rem' }}></th>
                                            <th>ID Pesanan</th>
                                            <th>Pelanggan</th>
                                            <th>Total Harga</th>
                                            <th>Total HPP</th>
                                            <th>Laba Bersih</th>
                                            <th>Status Bayar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.orderProfitData || []).map(op => (
                                            <React.Fragment key={op.order_id}>
                                                <tr
                                                    className={`profit-row ${expandedOrders[op.order_id] ? 'expanded' : ''}`}
                                                    onClick={() => toggleOrderExpand(op.order_id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td style={{ width: '2rem', textAlign: 'center' }}>
                                                        <span className="material-icons-round profit-expand-icon" style={{ fontSize: '1.1rem', transition: 'transform 0.2s', transform: expandedOrders[op.order_id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                            chevron_right
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: 600, color: 'var(--accent-purple)', fontSize: '0.85rem' }}>#{op.order_id}</span>
                                                    </td>
                                                    <td>{op.customer}</td>
                                                    <td>{formatCurrency(op.totalHarga)}</td>
                                                    <td className="amount-out">{formatCurrency(op.totalHpp)}</td>
                                                    <td>
                                                        <span style={{ fontWeight: 700, color: op.labaBersih >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                            {formatCurrency(op.labaBersih)}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>({op.margin}%)</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${op.isLunas ? 'selesai' : 'proses'}`}>
                                                            {op.isLunas ? 'Lunas' : 'Belum Lunas'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {expandedOrders[op.order_id] && (
                                                    <tr key={`${op.order_id}-detail`} className="profit-detail-row">
                                                        <td colSpan={7} style={{ padding: 0 }}>
                                                            <div className="profit-detail-container">
                                                                <table className="profit-detail-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Tanggal</th>
                                                                            <th>Deskripsi</th>
                                                                            <th>Tipe</th>
                                                                            <th>Kategori</th>
                                                                            <th style={{ textAlign: 'right' }}>Nominal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {op.transactions.map(tx => (
                                                                            <tr key={tx.id}>
                                                                                <td>{tx.date}</td>
                                                                                <td>
                                                                                    {tx.description}
                                                                                    {tx.type === 'dp' && <span className="status-badge baru" style={{ marginLeft: '0.4rem', fontSize: '0.6rem' }}>DP</span>}
                                                                                    {tx.type === 'pelunasan' && <span className="status-badge selesai" style={{ marginLeft: '0.4rem', fontSize: '0.6rem' }}>Pelunasan</span>}
                                                                                </td>
                                                                                <td>
                                                                                    <span className={`tx-type-badge ${tx.tx_type || 'debit'}`}>
                                                                                        {(tx.tx_type || 'debit') === 'debit' ? 'Debit' : 'Kredit'}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                                    {[tx.category_group, tx.category].filter(Boolean).join(' › ') || '-'}
                                                                                </td>
                                                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                                                    {tx.amount_in > 0 && <span className="amount-in">+{formatCurrency(tx.amount_in)}</span>}
                                                                                    {tx.amount_out > 0 && <span className="amount-out">-{formatCurrency(tx.amount_out)}</span>}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                {/* Summary footer */}
                                                                <div className="profit-detail-summary">
                                                                    <div className="profit-detail-summary-item">
                                                                        <span>Total Harga Pesanan</span>
                                                                        <span style={{ fontWeight: 600 }}>{formatCurrency(op.totalHarga)}</span>
                                                                    </div>
                                                                    <div className="profit-detail-summary-item">
                                                                        <span>Total Pemasukan (DP + Pelunasan)</span>
                                                                        <span className="amount-in">{formatCurrency(op.totalIncome)}</span>
                                                                    </div>
                                                                    <div className="profit-detail-summary-item">
                                                                        <span>Total HPP</span>
                                                                        <span className="amount-out">{formatCurrency(op.totalHpp)}</span>
                                                                    </div>
                                                                    <div className="profit-detail-summary-item profit-detail-summary-total">
                                                                        <span>Laba Bersih</span>
                                                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: op.labaBersih >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                                            {formatCurrency(op.labaBersih)} ({op.margin}%)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    /* ══════════════════════════════════════════════════════════ */
                    /* ── NORMAL TRANSACTION TABLE ── */
                    /* ══════════════════════════════════════════════════════════ */
                    <>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th><th>Deskripsi</th><th>Tipe</th><th>Kategori</th><th>Debit</th><th>Kredit</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTransactions.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            {(typeFilter || searchQuery) ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className="material-icons-round" style={{ fontSize: '2rem', opacity: 0.4 }}>search_off</span>
                                                    <span>Tidak ada transaksi yang cocok</span>
                                                    <button className="table-clear-filters" onClick={() => { setTypeFilter(''); setSearchQuery(''); }} style={{ marginTop: '0.25rem' }}>
                                                        Reset Filter
                                                    </button>
                                                </div>
                                            ) : 'Belum ada transaksi'}
                                        </td></tr>
                                    ) : (
                                        paginatedTransactions.map((t, i) => (
                                            <tr key={t.id || i}>
                                                <td>{t.date}</td>
                                                <td>
                                                    <div>
                                                        {t.description}
                                                        {t.type === 'dp' && <span className="status-badge baru" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>DP</span>}
                                                        {t.type === 'pelunasan' && <span className="status-badge selesai" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Pelunasan</span>}
                                                    </div>
                                                    {t.customer && (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>person</span>
                                                            {t.customer}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`tx-type-badge ${(t.tx_type || (t.amount_in > 0 ? 'debit' : 'kredit'))}`}>
                                                        {(t.tx_type || (t.amount_in > 0 ? 'debit' : 'kredit')) === 'debit' ? 'Debit' : 'Kredit'}
                                                    </span>
                                                </td>
                                                <td>{renderCategoryPath(t)}</td>
                                                <td className="amount-in">{t.amount_in > 0 ? formatCurrency(t.amount_in) : '-'}</td>
                                                <td className="amount-out">{t.amount_out > 0 ? formatCurrency(t.amount_out) : '-'}</td>
                                                <td>
                                                    {t.type !== 'pelunasan' && (
                                                        <button className="action-btn" onClick={() => onEdit(t)} title="Edit">
                                                            <span className="material-icons-round">edit</span>
                                                        </button>
                                                    )}
                                                    {' '}
                                                    {t.type !== 'dp' && t.type !== 'pelunasan' ? (
                                                        <button className="action-btn" onClick={() => handleDelete(t)} title="Hapus" style={{ marginLeft: '0.25rem' }}>
                                                            <span className="material-icons-round">delete</span>
                                                        </button>
                                                    ) : (
                                                        <button className="action-btn" title="Tidak bisa dihapus (terkait pesanan)" style={{ marginLeft: '0.25rem', opacity: 0.3, cursor: 'not-allowed' }} disabled>
                                                            <span className="material-icons-round">lock</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                >
                                    <span className="material-icons-round">chevron_left</span>
                                </button>

                                {getPageNumbers().map((page, i) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                                    ) : (
                                        <button
                                            key={page}
                                            className={`pagination-btn ${safePage === page ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}

                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage >= totalPages}
                                >
                                    <span className="material-icons-round">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
