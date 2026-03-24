'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
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

export default function FinancePage({ onAdd, onEdit }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const cashflowRef = useRef(null);
    const expenseRef = useRef(null);
    const cashflowChart = useRef(null);
    const expenseChart = useRef(null);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

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
                            label: 'Pemasukan',
                            data: data.monthlyCashflow.map(m => m.income),
                            backgroundColor: 'rgba(52, 211, 153, 0.7)',
                            borderColor: '#34d399',
                            borderWidth: 1,
                            borderRadius: 6,
                            borderSkipped: false,
                        },
                        {
                            label: 'Pengeluaran',
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
            <div className="finance-kpi">
                <div className="kpi-card" style={{ '--accent': '#34d399' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#34d399' }}>arrow_downward</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Pemasukan</span>
                        <span className="kpi-value">{formatCurrency(data.summary.totalIn)}</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--accent': '#f87171' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(248,113,113,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#f87171' }}>arrow_upward</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Pengeluaran</span>
                        <span className="kpi-value">{formatCurrency(data.summary.totalOut)}</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--accent': '#a78bfa' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#a78bfa' }}>account_balance</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Saldo / Profit</span>
                        <span className="kpi-value">{formatCurrency(profit)}</span>
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

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📊 Arus Kas 6 Bulan Terakhir</h3>
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
                                    <span className="doughnut-label">Total Pengeluaran</span>
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
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Masuk</th><th>Keluar</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.transactions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada transaksi</td></tr>
                            ) : (
                                data.transactions.map((t, i) => (
                                    <tr key={t.id || i}>
                                        <td>{t.date}</td>
                                        <td>{t.description}</td>
                                        <td><span className="status-badge proses">{t.category}</span></td>
                                        <td className="amount-in">{t.amount_in > 0 ? formatCurrency(t.amount_in) : '-'}</td>
                                        <td className="amount-out">{t.amount_out > 0 ? formatCurrency(t.amount_out) : '-'}</td>
                                        <td>
                                            <button className="action-btn" onClick={() => onEdit(t)} title="Edit">
                                                <span className="material-icons-round">edit</span>
                                            </button>
                                            {' '}
                                            <button className="action-btn" onClick={() => handleDelete(t)} title="Hapus" style={{ marginLeft: '0.25rem' }}>
                                                <span className="material-icons-round">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
