'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusLabel(status) {
    const labels = { baru: '● Baru', proses: '● Diproses', selesai: '● Selesai', dikirim: '● Dikirim', pending: '● Pending', lunas: '● Lunas', dp: '● DP' };
    return labels[status] || status;
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

export default function OverviewPage({ onViewOrders, onOrderClick }) {
    const [data, setData] = useState(null);
    const [finData, setFinData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const revenueChartRef = useRef(null);
    const cashflowChartRef = useRef(null);
    const revenueInstance = useRef(null);
    const cashflowInstance = useRef(null);

    function fetchData() {
        setLoading(true);
        let dashUrl = '/api/dashboard?';
        let finUrl = '/api/finance?';
        if (filterYear) { dashUrl += `year=${filterYear}&`; finUrl += `year=${filterYear}&`; }
        if (filterMonth) { dashUrl += `month=${filterMonth}&`; finUrl += `month=${filterMonth}&`; }

        Promise.all([
            fetch(dashUrl).then(r => r.json()),
            fetch(finUrl).then(r => r.json()),
        ])
            .then(([dashData, fin]) => {
                setData(dashData);
                setFinData(fin);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
    }

    useEffect(() => { fetchData(); }, [filterYear, filterMonth]);

    useEffect(() => {
        if (!data || !finData || !revenueChartRef.current) return;
        if (data.monthlyRevenue.length === 0 && finData.monthlyCashflow.length === 0) return;

        if (revenueInstance.current) revenueInstance.current.destroy();
        if (cashflowInstance.current) cashflowInstance.current.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const gridColor = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(148, 163, 184, 0.12)';
        const bgColor = isDark ? '#0f1117' : '#f0f2f5';

        const ctx = revenueChartRef.current.getContext('2d');
        const gradient1 = ctx.createLinearGradient(0, 0, 0, 260);
        gradient1.addColorStop(0, 'rgba(52, 211, 153, 0.3)');
        gradient1.addColorStop(1, 'rgba(52, 211, 153, 0)');
        const gradient2 = ctx.createLinearGradient(0, 0, 0, 260);
        gradient2.addColorStop(0, 'rgba(248, 113, 113, 0.2)');
        gradient2.addColorStop(1, 'rgba(248, 113, 113, 0)');

        if (data.monthlyRevenue.length > 0) {
            revenueInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.monthlyRevenue.map(m => m.month),
                    datasets: [
                        {
                            label: 'Pemasukan (Juta)', data: data.monthlyRevenue.map(m => m.revenue),
                            borderColor: '#34d399', backgroundColor: gradient1, fill: true, tension: 0.4,
                            borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#34d399',
                            pointBorderColor: bgColor, pointBorderWidth: 2, pointHoverRadius: 6,
                        },
                        {
                            label: 'Pengeluaran (Juta)', data: data.monthlyRevenue.map(m => m.expense || Math.round(m.revenue * 0.6)),
                            borderColor: '#f87171', backgroundColor: gradient2, fill: true, tension: 0.4,
                            borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#f87171',
                            pointBorderColor: bgColor, pointBorderWidth: 2, pointHoverRadius: 6,
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(26, 29, 39, 0.95)', borderColor: 'rgba(148, 163, 184, 0.1)', borderWidth: 1, padding: 12,
                            callbacks: { label: (ctx) => `${ctx.dataset.label}: Rp ${ctx.parsed.y} Juta` }
                        }
                    },
                    scales: {
                        x: { grid: { color: gridColor, drawBorder: false } },
                        y: { grid: { color: gridColor, drawBorder: false }, ticks: { callback: v => `Rp ${v}jt` } },
                    }
                }
            });
        }

        if (cashflowChartRef.current && finData.monthlyCashflow.length > 0) {
            cashflowInstance.current = new Chart(cashflowChartRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: finData.monthlyCashflow.map(m => m.month),
                    datasets: [
                        { label: 'Pemasukan', data: finData.monthlyCashflow.map(m => m.income), backgroundColor: 'rgba(52, 211, 153, 0.7)', borderColor: '#34d399', borderWidth: 1, borderRadius: 6, borderSkipped: false },
                        { label: 'Pengeluaran', data: finData.monthlyCashflow.map(m => m.expense), backgroundColor: 'rgba(248, 113, 113, 0.7)', borderColor: '#f87171', borderWidth: 1, borderRadius: 6, borderSkipped: false }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15 } },
                        tooltip: { backgroundColor: 'rgba(26, 29, 39, 0.95)', callbacks: { label: ctx => `${ctx.dataset.label}: Rp ${ctx.parsed.y} Juta` } }
                    },
                    scales: { x: { grid: { color: gridColor, drawBorder: false } }, y: { grid: { color: gridColor, drawBorder: false }, ticks: { callback: v => `Rp ${v}jt` } } }
                }
            });
        }

        return () => {
            if (revenueInstance.current) revenueInstance.current.destroy();
            if (cashflowInstance.current) cashflowInstance.current.destroy();
        };
    }, [data, finData]);

    if (loading) return (
        <div className="page-content">
            <div className="kpi-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
            <div className="charts-row">
                <div className="skeleton" style={{ height: 320 }} />
                <div className="skeleton" style={{ height: 320 }} />
            </div>
        </div>
    );

    if (!data || !finData) return <div className="page-content"><p>Gagal memuat data.</p></div>;

    const profit = (data.kpi.totalIn || finData.summary.totalIn) - (data.kpi.totalOut || finData.summary.totalOut);
    const totalIn = data.kpi.totalIn || finData.summary.totalIn;
    const profitMargin = totalIn > 0 ? ((profit / totalIn) * 100).toFixed(1) : 0;

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
            </div>

            {/* Financial KPI Grid */}
            <div className="kpi-grid">
                <div className="kpi-card" style={{ '--accent': '#34d399' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#34d399' }}>trending_up</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Pemasukan</span>
                        <span className="kpi-value"><AnimatedValue target={finData.summary.totalIn} prefix="Rp " /></span>
                        <span className="kpi-change positive">
                            <span className="material-icons-round">trending_up</span>+12% dari bulan lalu
                        </span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--accent': '#f87171' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(248,113,113,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#f87171' }}>trending_down</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Pengeluaran</span>
                        <span className="kpi-value"><AnimatedValue target={finData.summary.totalOut} prefix="Rp " /></span>
                        <span className="kpi-change negative">
                            <span className="material-icons-round">warning</span>Kontrol pengeluaran
                        </span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--accent': '#a78bfa' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#a78bfa' }}>account_balance</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Saldo / Profit</span>
                        <span className="kpi-value"><AnimatedValue target={profit} prefix="Rp " /></span>
                        <span className="kpi-change positive">
                            <span className="material-icons-round">analytics</span>Margin {profitMargin}%
                        </span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--accent': '#3b82f6' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <span className="material-icons-round" style={{ color: '#3b82f6' }}>receipt_long</span>
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Pesanan</span>
                        <span className="kpi-value"><AnimatedValue target={data.kpi.totalOrders} /></span>
                        <span className="kpi-change positive">
                            <span className="material-icons-round">trending_up</span>{data.kpi.activeOrders} aktif
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-header"><h3>📈 Tren Pemasukan vs Pengeluaran</h3></div>
                    {data.monthlyRevenue.length === 0 ? (
                        <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada data transaksi</div>
                    ) : (
                        <>
                            <div className="chart-body"><canvas ref={revenueChartRef}></canvas></div>
                            <div className="chart-legend">
                                <div className="legend-item"><span className="legend-dot" style={{ background: '#34d399' }} /><span>Pemasukan</span></div>
                                <div className="legend-item"><span className="legend-dot" style={{ background: '#f87171' }} /><span>Pengeluaran</span></div>
                            </div>
                        </>
                    )}
                </div>
                <div className="chart-card">
                    <div className="chart-header"><h3>📊 Arus Kas Bulanan</h3></div>
                    {finData.monthlyCashflow.length === 0 ? (
                        <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada data transaksi</div>
                    ) : (
                        <div className="chart-body"><canvas ref={cashflowChartRef}></canvas></div>
                    )}
                </div>
            </div>

            {/* Recent Orders & Transactions */}
            <div className="content-row">
                <div className="content-card">
                    <div className="card-header">
                        <h3>🕐 Pesanan Terbaru</h3>
                        <button className="view-all" onClick={() => onViewOrders && onViewOrders()}>Lihat Semua →</button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Status</th><th>Deadline</th></tr></thead>
                            <tbody>
                                {data.recentOrders.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada data untuk periode ini</td></tr>
                                ) : data.recentOrders.map(o => (
                                    <tr key={o.id} onClick={() => onOrderClick && onOrderClick(o)} style={{ cursor: 'pointer' }}>
                                        <td><strong>{o.id}</strong></td>
                                        <td>{o.customer}</td>
                                        <td>{o.product}</td>
                                        <td>{formatCurrency(o.price)}</td>
                                        <td><span className={`status-badge ${o.status}`}>{getStatusLabel(o.status)}</span></td>
                                        <td>{formatDate(o.deadline)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="content-card">
                    <div className="card-header"><h3>💰 Transaksi Terakhir</h3></div>
                    <div className="alerts-container">
                        {finData.transactions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada transaksi untuk periode ini</div>
                        ) : finData.transactions.slice(0, 6).map((t, i) => (
                            <div className={`alert-item ${t.amount_in > 0 ? 'success' : 'danger'}`} key={i}>
                                <span className="material-icons-round">{t.amount_in > 0 ? 'arrow_downward' : 'arrow_upward'}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="alert-title">{t.description}</div>
                                    <div className="alert-desc">{t.date} · {t.category}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem' }}>
                                    {t.amount_in > 0 ? (
                                        <span style={{ color: 'var(--accent-green)' }}>+{formatCurrency(t.amount_in)}</span>
                                    ) : (
                                        <span style={{ color: 'var(--accent-red)' }}>-{formatCurrency(t.amount_out)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
