'use client';

import { useEffect, useState } from 'react';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusLabel(status) {
    const labels = { baru: '● Baru', proses: '● Diproses', selesai: '● Selesai', dikirim: '● Dikirim', pending: '● Pending' };
    return labels[status] || status;
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

export default function OrdersPage({ onOrderClick, onAdd, onEdit, searchQuery }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    function fetchOrders(statusFilter, search) {
        setLoading(true);
        let url = '/api/orders?';
        if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (filterYear) url += `year=${filterYear}&`;
        if (filterMonth) url += `month=${filterMonth}&`;
        fetch(url)
            .then(r => r.json())
            .then(d => { setOrders(d); setLoading(false); })
            .catch(() => setLoading(false));
    }

    useEffect(() => { fetchOrders(filter, searchQuery); }, [filter, searchQuery, filterYear, filterMonth]);

    function handleFilter(f) { setFilter(f); }

    async function handleDelete(orderId) {
        if (!confirm(`Hapus pesanan ${orderId}?`)) return;
        try {
            await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            fetchOrders(filter, searchQuery);
        } catch (err) { console.error(err); }
    }

    const filterBtns = [
        { key: 'all', label: 'Semua' },
        { key: 'baru', label: 'Baru' },
        { key: 'proses', label: 'Diproses' },
        { key: 'selesai', label: 'Selesai' },
        { key: 'dikirim', label: 'Dikirim' },
    ];

    return (
        <div className="page-content">
            <div className="page-filters">
                <div className="page-filters-left">
                    <div className="filter-group">
                        {filterBtns.map(f => (
                            <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => handleFilter(f.key)}>{f.label}</button>
                        ))}
                    </div>
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
                    Pesanan Baru
                </button>
            </div>

            <div className="content-card full-width">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Pelanggan</th><th>Produk</th><th>Qty</th>
                                <th>Harga</th><th>Status</th><th>Deadline</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={8}><div className="skeleton skeleton-row" /></td></tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada pesanan ditemukan</td></tr>
                            ) : (
                                orders.map(o => (
                                    <tr key={o.id}>
                                        <td><strong>{o.id}</strong></td>
                                        <td>{o.customer}</td>
                                        <td>{o.product}</td>
                                        <td>{o.qty} pcs</td>
                                        <td>{formatCurrency(o.price)}</td>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
