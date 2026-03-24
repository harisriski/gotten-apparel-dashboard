'use client';

import { useEffect, useState } from 'react';

const stageInfo = {
    desain: { icon: '🎨', label: 'Desain' },
    cutting: { icon: '✂️', label: 'Cutting' },
    sewing: { icon: '🧵', label: 'Sewing' },
    sablon: { icon: '🖨️', label: 'Sablon' },
    qc: { icon: '✅', label: 'Quality Control' },
    packing: { icon: '📦', label: 'Packing' },
};

const monthOptions = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];
const currentYear = new Date().getFullYear();
const yearOptions = [{ value: '', label: 'Semua Tahun' }, ...Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))];

export default function ProductionPage({ onOrderClick, onAdd, onEdit }) {
    const [pipeline, setPipeline] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    function fetchPipeline() {
        setLoading(true);
        let url = '/api/production?';
        if (filterYear) url += `year=${filterYear}&`;
        if (filterMonth) url += `month=${filterMonth}&`;
        fetch(url)
            .then(r => r.json())
            .then(d => { setPipeline(d); setLoading(false); })
            .catch(() => setLoading(false));
    }

    useEffect(() => { fetchPipeline(); }, [filterYear, filterMonth]);

    async function handleDelete(item) {
        if (!confirm(`Hapus produksi "${item.title}" (${item.order_id})?`)) return;
        try {
            await fetch(`/api/production?id=${item.id}`, { method: 'DELETE' });
            fetchPipeline();
        } catch (err) { console.error(err); }
    }

    async function moveStage(item, newStage) {
        try {
            await fetch('/api/production', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, stage: newStage })
            });
            fetchPipeline();
        } catch (err) { console.error(err); }
    }

    if (loading) return (
        <div className="page-content">
            <div className="pipeline-grid">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 250 }} />)}
            </div>
        </div>
    );

    const stageKeys = Object.keys(stageInfo);

    return (
        <div className="page-content">
            <div className="page-filters">
                <div className="page-filters-left">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>🏭 Pipeline Produksi</h3>
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
                    Tambah Produksi
                </button>
            </div>

            <div className="pipeline-grid">
                {stageKeys.map((stage, stageIdx) => {
                    const info = stageInfo[stage];
                    const items = pipeline[stage] || [];

                    return (
                        <div className="stage-column" key={stage}>
                            <div className="stage-header">
                                <div className="stage-title">
                                    <span className="stage-icon">{info.icon}</span>
                                    {info.label}
                                </div>
                                <span className="stage-count">{items.length}</span>
                            </div>
                            <div className="stage-cards">
                                {items.map((item) => (
                                    <div
                                        className="stage-card"
                                        key={`${item.order_id}-${item.id}`}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div className="stage-card-id">{item.order_id}</div>
                                                <div className="stage-card-title">{item.title}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }}>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); onEdit(item); }} title="Edit" style={{ padding: '0.1rem' }}>
                                                    <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>edit</span>
                                                </button>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleDelete(item); }} title="Hapus" style={{ padding: '0.1rem' }}>
                                                    <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="stage-card-info">
                                            <span>{item.qty}</span>
                                            <span className="stage-card-deadline">⏱ {item.deadline}</span>
                                        </div>
                                        {/* Move Stage Buttons */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                                            {stageIdx > 0 && (
                                                <button
                                                    className="action-btn"
                                                    onClick={(e) => { e.stopPropagation(); moveStage(item, stageKeys[stageIdx - 1]); }}
                                                    title={`Kembali ke ${stageInfo[stageKeys[stageIdx - 1]].label}`}
                                                    style={{ padding: '0.1rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>arrow_back</span>
                                                </button>
                                            )}
                                            <div style={{ flex: 1 }} />
                                            {stageIdx < stageKeys.length - 1 && (
                                                <button
                                                    className="action-btn"
                                                    onClick={(e) => { e.stopPropagation(); moveStage(item, stageKeys[stageIdx + 1]); }}
                                                    title={`Pindah ke ${stageInfo[stageKeys[stageIdx + 1]].label}`}
                                                    style={{ padding: '0.1rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>arrow_forward</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        Tidak ada item
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
