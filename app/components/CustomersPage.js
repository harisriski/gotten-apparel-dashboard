'use client';

import { useEffect, useState } from 'react';

function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

const colors = ['#a78bfa', '#3b82f6', '#34d399', '#f59e0b', '#f87171', '#f472b6', '#a78bfa', '#3b82f6', '#34d399'];

const monthOptions = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];
const currentYear = new Date().getFullYear();
const yearOptions = [{ value: '', label: 'Semua Tahun' }, ...Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))];

export default function CustomersPage({ onAdd, onEdit, onDetail }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    function fetchCustomers() {
        setLoading(true);
        let url = '/api/customers?';
        if (filterYear) url += `year=${filterYear}&`;
        if (filterMonth) url += `month=${filterMonth}&`;
        fetch(url)
            .then(r => r.json())
            .then(d => { setCustomers(d); setLoading(false); })
            .catch(() => setLoading(false));
    }

    useEffect(() => { fetchCustomers(); }, [filterYear, filterMonth]);

    async function handleDelete(customer) {
        if (!confirm(`Hapus pelanggan "${customer.name}"?`)) return;
        try {
            await fetch(`/api/customers?id=${customer.id}`, { method: 'DELETE' });
            fetchCustomers();
        } catch (err) { console.error(err); }
    }

    if (loading) return (
        <div className="page-content">
            <div className="customers-grid">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <div className="page-filters">
                <div className="page-filters-left">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Total: <strong>{customers.length}</strong> pelanggan
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
                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>person_add</span>
                    Tambah Pelanggan
                </button>
            </div>

            <div className="customers-grid">
                {customers.map((c, i) => (
                    <div className="customer-card" key={c.id}>
                        <div className="customer-avatar" style={{ background: colors[i % colors.length] }}>
                            {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="customer-name">{c.name}</div>
                        <div className="customer-company">{c.company}</div>
                        <div className="customer-stats">
                            <div className="customer-stat">
                                <span className="customer-stat-value">{c.orderCount}</span>
                                <span className="customer-stat-label">Pesanan</span>
                            </div>
                            <div className="customer-stat">
                                <span className="customer-stat-value">{formatCurrency(c.totalSpent).substring(0, 10)}</span>
                                <span className="customer-stat-label">Total Order</span>
                            </div>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                            <button className="action-btn" onClick={() => onDetail(c)} title="Detail">
                                <span className="material-icons-round">visibility</span>
                            </button>
                            <button className="action-btn" onClick={() => onEdit(c)} title="Edit">
                                <span className="material-icons-round">edit</span>
                            </button>
                            <button className="action-btn" onClick={() => handleDelete(c)} title="Hapus">
                                <span className="material-icons-round">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
