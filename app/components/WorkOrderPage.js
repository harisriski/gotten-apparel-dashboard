'use client';

import { useEffect, useState } from 'react';
import WorkOrderPrintModal from './WorkOrderPrintModal';

export default function WorkOrderPage({ onAdd, onEdit, onView }) {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedModalImage, setSelectedModalImage] = useState(null);
    const [selectedPrintWorkOrder, setSelectedPrintWorkOrder] = useState(null);

    function fetchWorkOrders() {
        setLoading(true);
        let url = '/api/work-orders?';
        if (search) url += `search=${encodeURIComponent(search)}&`;

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
    }, [search]);

    async function handleDelete(wo) {
        if (!confirm(`Hapus Work Order ${wo.wo_number} (${wo.customer || wo.team_name})?`)) return;
        try {
            await fetch(`/api/work-orders?id=${wo.id}`, { method: 'DELETE' });
            fetchWorkOrders();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="page-content">
            {/* Header & Action */}
            <div className="page-filters" style={{ marginBottom: '1.5rem' }}>
                <div className="page-filters-left">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-icons-round" style={{ color: '#3b82f6' }}>sports_soccer</span>
                        Work Order Jersey
                    </h3>
                    <div style={{ position: 'relative', width: '260px' }}>
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.875rem' }}
                            placeholder="Cari No. WO, Order, Tim..."
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
                                color: '#94a3b8'
                            }}
                        >
                            search
                        </span>
                    </div>
                </div>

                <button className="btn-add" onClick={onAdd}>
                    <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>add</span>
                    Work Order Baru
                </button>
            </div>

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
                    background: 'var(--card-bg, #ffffff)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color, #cbd5e1)',
                    width: '100%'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '3.5rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        inventory
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color, #1e293b)' }}>
                        Belum ada Work Order Jersey
                    </h3>
                    <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', maxWidth: '420px', margin: '0.5rem auto 1.25rem' }}>
                        Pesanan jersey yang sudah fix dan masuk DP dapat dibuatkan Work Order di sini untuk memulai proses produksi.
                    </p>
                    <button className="btn-add" onClick={onAdd} style={{ margin: '0 auto' }}>
                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>add</span>
                        Buat Work Order Sekarang
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem', width: '100%' }}>
                    {workOrders.map(wo => {
                        const designsList = Array.isArray(wo.designs) ? wo.designs : [];

                        return (
                            <div
                                key={wo.id}
                                style={{
                                    background: 'var(--card-bg, #ffffff)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color, #e2e8f0)',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                    position: 'relative'
                                }}
                            >
                                {/* Header Card */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: '#2563eb',
                                                background: '#eff6ff',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px'
                                            }}>
                                                {wo.wo_number}
                                            </span>
                                            {wo.order_id && (
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                    • Order #{wo.order_id}
                                                </span>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.4rem 0 0.15rem', color: 'var(--text-color, #0f172a)' }}>
                                            {wo.team_name || wo.customer}
                                        </h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                                            Pemesan: <strong>{wo.customer}</strong>
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <button
                                            type="button"
                                            className="action-btn"
                                            onClick={() => setSelectedPrintWorkOrder(wo)}
                                            title="Cetak / Download PDF SPK"
                                            style={{
                                                padding: '0.3rem 0.55rem',
                                                color: '#0284c7',
                                                background: '#f0f9ff',
                                                border: '1px solid #bae6fd',
                                                borderRadius: '6px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>print</span>
                                            Cetak
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => onEdit(wo)}
                                            title="Edit Work Order"
                                            style={{ padding: '0.35rem' }}
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>edit</span>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => handleDelete(wo)}
                                            title="Hapus Work Order"
                                            style={{ padding: '0.35rem', color: '#ef4444' }}
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Designs ACC Showcase */}
                                <div style={{
                                    borderTop: '1px solid var(--border-color, #f1f5f9)',
                                    paddingTop: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Desain ACC ({designsList.length})
                                        </span>
                                    </div>

                                    {designsList.length === 0 ? (
                                        <div style={{
                                            padding: '1.25rem 1rem',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            border: '1px dashed #cbd5e1',
                                            textAlign: 'center'
                                        }}>
                                            <span className="material-icons-round" style={{ fontSize: '1.5rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                                                palette
                                            </span>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem', fontWeight: 500 }}>
                                                Desain ACC belum diunggah
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(wo)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.3rem 0.65rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid #3b82f6',
                                                    background: '#eff6ff',
                                                    color: '#2563eb',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>upload</span>
                                                Upload Desain ACC
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: designsList.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(100px, 1fr))',
                                            gap: '0.65rem'
                                        }}>
                                            {designsList.map((d, idx) => (
                                                <div
                                                    key={d.id || idx}
                                                    style={{
                                                        background: '#f8fafc',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        overflow: 'hidden',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: '90px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: d.url ? 'pointer' : 'default',
                                                            background: '#f1f5f9'
                                                        }}
                                                        onClick={() => d.url && setSelectedModalImage({ url: d.url, title: d.label })}
                                                    >
                                                        {d.url ? (
                                                            <img
                                                                src={d.url}
                                                                alt={d.label}
                                                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                                            />
                                                        ) : (
                                                            <span className="material-icons-round" style={{ fontSize: '1.8rem', color: '#cbd5e1' }}>
                                                                image
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: '0.4rem 0.5rem' }}>
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            color: '#1e293b'
                                                        }}>
                                                            {d.label || `Desain #${idx + 1}`}
                                                        </div>
                                                        {d.notes && (
                                                            <div style={{
                                                                fontSize: '0.7rem',
                                                                color: '#64748b',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                marginTop: '0.1rem'
                                                            }} title={d.notes}>
                                                                {d.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Technical Summary Badges */}
                                {(() => {
                                    const dt = wo.data_transaksi || {};
                                    const atasan = wo.spesifikasi_atasan || {};
                                    const celana = wo.spesifikasi_celana || {};
                                    const timeline = Array.isArray(wo.timeline_kerja) ? wo.timeline_kerja : [];
                                    const totalTimelineDays = timeline.reduce((s, t) => s + (parseInt(t.durasi, 10) || 0), 0);
                                    const lastTimelineTask = timeline[timeline.length - 1];
                                    const ukuran = wo.data_ukuran || {};
                                    
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.4rem',
                                            fontSize: '0.75rem',
                                            background: '#f8fafc',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                <span>📅 Masuk: <strong>{dt.tanggal_masuk || '-'}</strong></span>
                                                <span>⏱ Estimasi: <strong>{dt.estimasi_hari ? `${dt.estimasi_hari} Hari` : '-'}</strong></span>
                                                {dt.tanggal_keluar && (
                                                    <span style={{ color: '#059669', fontWeight: 600 }}>
                                                        🏁 Keluar: {dt.tanggal_keluar}
                                                    </span>
                                                )}
                                            </div>
                                            {timeline.length > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    background: '#faf5ff',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #f3e8ff',
                                                    color: '#6b21a8',
                                                    fontSize: '0.72rem'
                                                }}>
                                                    <span>⏳ Total Timeline: <strong>{totalTimelineDays} Hari</strong></span>
                                                    {lastTimelineTask?.selesai && (
                                                        <span>🏁 Selesai Produksi: <strong>{lastTimelineTask.selesai}</strong></span>
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
                                                {ukuran.grand_total > 0 && (
                                                    <span style={{
                                                        background: '#fef3c7',
                                                        color: '#92400e',
                                                        fontWeight: 700,
                                                        padding: '0.15rem 0.45rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid #fde68a'
                                                    }}>
                                                        📏 {ukuran.grand_total} pcs {ukuran.total_atasan ? `(${ukuran.total_atasan} Atasan${ukuran.total_celana ? ` + ${ukuran.total_celana} Celana` : ''})` : ''}
                                                    </span>
                                                )}
                                                {dt.bahan && <span>🧶 Bahan: <strong>{dt.bahan}</strong></span>}
                                                {atasan.bentuk_kerah && <span>👔 Kerah: <strong>{atasan.bentuk_kerah}</strong></span>}
                                                {celana.has_celana && <span style={{ color: '#be185d', fontWeight: 600 }}>🩳 Termasuk Celana</span>}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Footer notes & date */}
                                {wo.notes && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#475569',
                                        background: '#f8fafc',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        borderLeft: '3px solid #3b82f6'
                                    }}>
                                        <strong>Catatan:</strong> {wo.notes}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    color: '#94a3b8',
                                    marginTop: 'auto',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    <span>Dibuat: {wo.created_at ? wo.created_at.slice(0, 10) : '-'}</span>
                                    <span style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        background: '#fef3c7',
                                        color: '#b45309',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                    }}>
                                        Produksi
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox / Modal Preview for Design Image */}
            {selectedModalImage && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.75)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem'
                    }}
                    onClick={() => setSelectedModalImage(null)}
                >
                    <div
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            background: '#ffffff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '0.75rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                {selectedModalImage.title}
                            </h4>
                            <button
                                onClick={() => setSelectedModalImage(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ padding: '1rem', textAlign: 'center', overflow: 'auto' }}>
                            <img
                                src={selectedModalImage.url}
                                alt={selectedModalImage.title}
                                style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Preview Cetak / Download PDF */}
            {selectedPrintWorkOrder && (
                <WorkOrderPrintModal
                    workOrder={selectedPrintWorkOrder}
                    onClose={() => setSelectedPrintWorkOrder(null)}
                />
            )}
        </div>
    );
}
