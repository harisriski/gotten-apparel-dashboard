'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { waLink } from './data';

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

export default function OrderTracker({ initialOrderId = '', inModal = false, onClose = null }) {
    const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [errorData, setErrorData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [copied, setCopied] = useState(false);

    async function handleSearch(idToSearch) {
        const targetId = (idToSearch || orderIdInput || '').trim().toUpperCase();
        if (!targetId) return;

        setLoading(true);
        setErrorData(null);
        setOrderData(null);

        try {
            const res = await fetch(`/api/track?id=${encodeURIComponent(targetId)}`);
            const data = await res.json();

            if (!res.ok) {
                setErrorData({
                    message: data.error || `Nomor pesanan ${targetId} tidak ditemukan. Silakan periksa kembali tanda terima pesanan Anda atau hubungi Admin Gotten.`,
                    searchId: targetId
                });
            } else {
                setOrderData(data);
                setOrderIdInput(data.id);
            }
        } catch (err) {
            console.error('Tracking fetch error:', err);
            setErrorData({
                message: 'Terjadi gangguan jaringan saat melacak pesanan. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.',
                searchId: targetId
            });
        }
        setLoading(false);
    }

    // Auto-search if initialOrderId is provided (e.g. from URL ?id=GTN-0001)
    useEffect(() => {
        if (initialOrderId && initialOrderId.trim()) {
            setOrderIdInput(initialOrderId.trim().toUpperCase());
            handleSearch(initialOrderId.trim().toUpperCase());
        }
    }, [initialOrderId]);

    function handleCopyId(id) {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    // Status helpers
    const status = (orderData?.status || '').toLowerCase();
    const isBaru = status === 'baru';
    const isProses = status === 'proses';
    const isSelesai = status === 'selesai';
    const isDikirim = status === 'dikirim';

    // 3 Macro Milestones definition
    const milestones = [
        {
            stepNumber: 1,
            title: 'Antrean Berikutnya',
            desc: 'Pesanan telah divalidasi dan masuk daftar antrean produksi workshop Gotten.',
            icon: 'schedule',
            state: isBaru ? 'active' : (isProses || isSelesai || isDikirim ? 'completed' : 'pending'),
            badgeLabel: isBaru ? 'Sedang Antre' : (isProses || isSelesai || isDikirim ? 'Selesai' : 'Menunggu'),
            color: '#3b82f6'
        },
        {
            stepNumber: 2,
            title: 'Sedang Dikerjakan',
            desc: 'Jersey tim Anda sedang dalam proses produksi aktif sesuai timeline kerja.',
            icon: 'precision_manufacturing',
            state: isProses ? 'active' : (isSelesai || isDikirim ? 'completed' : 'pending'),
            badgeLabel: isProses ? 'Sedang Dikerjakan' : (isSelesai || isDikirim ? 'Selesai' : 'Menunggu'),
            color: '#059669',
            hasTimeline: true
        },
        {
            stepNumber: 3,
            title: isDikirim ? 'Pesanan Telah Dikirim' : 'Sedang Persiapan Dikirim',
            desc: isDikirim
                ? 'Pesanan sudah diserahkan ke kurir pengiriman atau siap diambil di workshop.'
                : 'Proses Quality Control akhir & packing rapi, siap diserahkan ke jasa ekspedisi.',
            icon: isDikirim ? 'local_shipping' : 'inventory_2',
            state: (isSelesai || isDikirim) ? 'active' : 'pending',
            badgeLabel: isDikirim ? 'Telah Dikirim' : (isSelesai ? 'Persiapan Dikirim' : 'Menunggu'),
            color: '#f59e0b'
        }
    ];

    return (
        <div style={{
            width: '100%',
            maxWidth: inModal ? '780px' : '860px',
            margin: '0 auto',
            color: '#0f172a'
        }}>
            {/* ── CARD FORM PENCARIAN ── */}
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: inModal ? '1.25rem 1.5rem' : '2rem',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: inModal ? '1.25rem' : '1.5rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span className="material-icons-round" style={{ color: '#059669', fontSize: '1.75rem' }}>
                                travel_explore
                            </span>
                            Lacak Status Pesanan
                        </h2>
                        <p style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.88rem',
                            color: '#64748b'
                        }}>
                            Masukkan Nomor Pesanan Gotten Apparel Anda (contoh: <strong>GTN-0001</strong>).
                        </p>
                    </div>

                    {inModal && onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#475569',
                                transition: 'all 0.15s ease'
                            }}
                            title="Tutup"
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>close</span>
                        </button>
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSearch();
                    }}
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'stretch',
                        flexWrap: 'wrap'
                    }}
                >
                    <div style={{ position: 'relative', flex: '1 1 260px' }}>
                        <span className="material-icons-round" style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                            fontSize: '1.25rem'
                        }}>
                            tag
                        </span>
                        <input
                            type="text"
                            value={orderIdInput}
                            onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
                            placeholder="Contoh: GTN-0001"
                            style={{
                                width: '100%',
                                height: '48px',
                                paddingLeft: '2.75rem',
                                paddingRight: '1rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                color: '#0f172a',
                                background: '#f8fafc',
                                border: '2px solid #cbd5e1',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.15s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#059669'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !orderIdInput.trim()}
                        style={{
                            height: '48px',
                            padding: '0 1.5rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: loading || !orderIdInput.trim() ? '#94a3b8' : '#059669',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: loading || !orderIdInput.trim() ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="material-icons-round" style={{ animation: 'spin 1s infinite linear', fontSize: '1.2rem' }}>
                                    sync
                                </span>
                                Memeriksa...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round" style={{ fontSize: '1.2rem' }}>
                                    search
                                </span>
                                Lacak Pesanan
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* ── ERROR STATE (ID TIDAK DITEMUKAN) ── */}
            {errorData && (
                <div style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#d97706',
                            flexShrink: 0
                        }}>
                            <span className="material-icons-round" style={{ fontSize: '1.65rem' }}>search_off</span>
                        </div>

                        <div style={{ flex: '1 1 280px' }}>
                            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
                                Pesanan Tidak Ditemukan
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.92rem', color: '#78350f', lineHeight: 1.55 }}>
                                {errorData.message}
                            </p>

                            <div style={{
                                marginTop: '1.15rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap'
                            }}>
                                <a
                                    href={waLink(`Halo Admin Gotten, saya ingin menanyakan status pesanan saya dengan nomor ${errorData.searchId || ''}, namun tidak ditemukan saat dilacak. Mohon bantuannya ya.`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.65rem 1.15rem',
                                        background: '#25D366',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        textDecoration: 'none',
                                        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
                                    }}
                                >
                                    <span className="material-icons-round" style={{ fontSize: '1.2rem' }}>chat</span>
                                    Bantuan via WhatsApp
                                </a>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setErrorData(null);
                                        setOrderIdInput('');
                                    }}
                                    style={{
                                        padding: '0.65rem 1rem',
                                        background: '#ffffff',
                                        color: '#78350f',
                                        border: '1px solid #fde68a',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Coba Nomor Lain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SUCCESS STATE (DATA PESANAN DITEMUKAN) ── */}
            {orderData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* 1. Header Ringkasan Pesanan */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            borderBottom: '1px solid #f1f5f9',
                            paddingBottom: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '1.15rem',
                                    fontWeight: 900,
                                    color: '#0f172a',
                                    letterSpacing: '0.03em'
                                }}>
                                    #{orderData.id}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyId(orderData.id)}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '0.25rem 0.55rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: copied ? '#059669' : '#64748b',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                    title="Salin ID Pesanan"
                                >
                                    <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>
                                        {copied ? 'check' : 'content_copy'}
                                    </span>
                                    {copied ? 'Tersalin!' : 'Salin'}
                                </button>
                            </div>

                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '999px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                background: isProses ? 'rgba(5, 150, 105, 0.1)'
                                    : (isSelesai || isDikirim) ? 'rgba(59, 130, 246, 0.1)'
                                        : 'rgba(245, 158, 11, 0.1)',
                                color: isProses ? '#059669'
                                    : (isSelesai || isDikirim) ? '#2563eb'
                                        : '#d97706',
                                border: `1px solid ${isProses ? '#05966930' : (isSelesai || isDikirim) ? '#2563eb30' : '#d9770630'}`
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>
                                    {isProses ? 'settings' : (isSelesai || isDikirim) ? 'check_circle' : 'hourglass_top'}
                                </span>
                                Status: {isBaru ? 'Antrean Baru' : isProses ? 'Sedang Diproses' : isSelesai ? 'Selesai Produksi' : isDikirim ? 'Telah Dikirim' : orderData.status}
                            </div>
                        </div>

                        {/* Grid Info Ringkas */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pemesan / Tim
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                                    {orderData.customer} {orderData.team_name ? `(${orderData.team_name})` : ''}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Produk & Jumlah
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                                    {orderData.product} • {orderData.qty} Pcs
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Tanggal Masuk
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                                    {formatDate(orderData.order_date)}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Estimasi Selesai / Kirim
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginTop: '0.2rem' }}>
                                    {formatDate(orderData.deadline)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Mockup Desain Jersey (Mockup Tim) */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span className="material-icons-round" style={{ color: '#059669', fontSize: '1.35rem' }}>
                                    palette
                                </span>
                                Desain Jersey (Mockup Tim)
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {orderData.designs && orderData.designs.length > 0
                                    ? `${orderData.designs.length} mockup disetujui`
                                    : 'Menunggu unggahan desainer'}
                            </span>
                        </div>

                        {orderData.designs && orderData.designs.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem'
                            }}>
                                {orderData.designs.map((design, idx) => {
                                    const imgSrc = design.url || design.previewUrl;
                                    return (
                                        <div
                                            key={design.id || idx}
                                            style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                background: '#f8fafc',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <div
                                                onClick={() => imgSrc && setPreviewImage({ url: imgSrc, title: design.label || `Mockup ${idx + 1}` })}
                                                style={{
                                                    height: '180px',
                                                    position: 'relative',
                                                    background: '#ffffff',
                                                    cursor: imgSrc ? 'pointer' : 'default',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}
                                                title={imgSrc ? 'Klik untuk memperbesar' : ''}
                                            >
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={design.label || 'Mockup Jersey'}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            objectFit: 'contain',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                        <span className="material-icons-round" style={{ fontSize: '2.5rem' }}>image</span>
                                                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Pratinjau tidak tersedia</div>
                                                    </div>
                                                )}
                                                {imgSrc && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        bottom: '0.5rem',
                                                        right: '0.5rem',
                                                        background: 'rgba(15, 23, 42, 0.7)',
                                                        color: '#ffffff',
                                                        borderRadius: '6px',
                                                        padding: '0.2rem 0.45rem',
                                                        fontSize: '0.7rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.2rem'
                                                    }}>
                                                        <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>zoom_in</span>
                                                        Perbesar
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ padding: '0.75rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                                                    {design.label || `Mockup ${idx + 1}`}
                                                </div>
                                                {design.notes && (
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                        {design.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '12px',
                                padding: '2rem 1.5rem',
                                textAlign: 'center'
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '2.5rem', color: '#94a3b8' }}>
                                    draw
                                </span>
                                <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                                    Mockup Desain Sedang Difinalisasi
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                                    Desain jersey tim Anda sedang dirapikan oleh tim desainer Gotten Apparel. Mockup visual akan otomatis muncul di sini setelah di-ACC.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 3. Tiga Macro Milestones (Fase Utama Berurutan) */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span className="material-icons-round" style={{ color: '#059669', fontSize: '1.35rem' }}>
                                    route
                                </span>
                                Tahapan Utama Pengerjaan
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                                Urutan fase dari antrean pemesanan hingga pengiriman jersey ke tangan Anda.
                            </p>
                        </div>

                        {/* Visual Step Bar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {milestones.map((m, idx) => {
                                const isCurrentActive = m.state === 'active';
                                const isCompleted = m.state === 'completed';
                                const isPending = m.state === 'pending';

                                return (
                                    <div
                                        key={m.stepNumber}
                                        style={{
                                            border: `1.5px solid ${isCurrentActive ? '#059669' : isCompleted ? '#cbd5e1' : '#e2e8f0'}`,
                                            borderRadius: '14px',
                                            background: isCurrentActive ? 'rgba(5, 150, 105, 0.02)' : '#ffffff',
                                            padding: '1.25rem',
                                            position: 'relative',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isCurrentActive ? '0 4px 12px rgba(5, 150, 105, 0.08)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1 1 280px' }}>
                                                {/* Icon Bulat */}
                                                <div style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '12px',
                                                    background: isCompleted ? '#ecfdf5' : isCurrentActive ? '#059669' : '#f1f5f9',
                                                    color: isCompleted ? '#059669' : isCurrentActive ? '#ffffff' : '#94a3b8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    fontWeight: 800,
                                                    fontSize: '1rem',
                                                    boxShadow: isCurrentActive ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none'
                                                }}>
                                                    {isCompleted ? (
                                                        <span className="material-icons-round" style={{ fontSize: '1.35rem' }}>check</span>
                                                    ) : (
                                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>{m.icon}</span>
                                                    )}
                                                </div>

                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: isCurrentActive ? '#059669' : '#64748b',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            Fase {m.stepNumber}
                                                        </span>
                                                        <h4 style={{
                                                            margin: 0,
                                                            fontSize: '1rem',
                                                            fontWeight: 800,
                                                            color: isPending ? '#64748b' : '#0f172a'
                                                        }}>
                                                            {m.title}
                                                        </h4>
                                                    </div>
                                                    <p style={{
                                                        margin: '0.25rem 0 0 0',
                                                        fontSize: '0.85rem',
                                                        color: isPending ? '#94a3b8' : '#475569',
                                                        lineHeight: 1.5
                                                    }}>
                                                        {m.desc}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Badge Status */}
                                            <span style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                padding: '0.3rem 0.75rem',
                                                borderRadius: '999px',
                                                background: isCompleted ? '#ecfdf5' : isCurrentActive ? 'rgba(5, 150, 105, 0.12)' : '#f1f5f9',
                                                color: isCompleted ? '#059669' : isCurrentActive ? '#059669' : '#94a3b8',
                                                border: `1px solid ${isCompleted ? '#a7f3d0' : isCurrentActive ? 'rgba(5, 150, 105, 0.3)' : '#e2e8f0'}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: isCompleted ? '#059669' : isCurrentActive ? '#059669' : '#94a3b8',
                                                    display: 'inline-block'
                                                }} />
                                                {m.badgeLabel}
                                            </span>
                                        </div>

                                        {/* DETAIL TIMELINE KERJA (Hadir saat Fase 2 / Pesanan Di Proses atau selesai) */}
                                        {m.hasTimeline && (
                                            <div style={{
                                                marginTop: '1.25rem',
                                                paddingTop: '1.25rem',
                                                borderTop: '1px dashed #e2e8f0'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '0.85rem'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}>
                                                        <span className="material-icons-round" style={{ fontSize: '1rem', color: '#059669' }}>
                                                            view_timeline
                                                        </span>
                                                        Visualisasi Timeline Kerja:
                                                    </div>

                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {orderData.timeline_kerja?.length || 6} Langkah
                                                    </span>
                                                </div>

                                                {/* Daftar Baris Timeline Kerja */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                                    gap: '0.65rem'
                                                }}>
                                                    {orderData.timeline_kerja && (() => {
                                                        const firstUnfinishedIdx = orderData.timeline_kerja.findIndex(t => !t.is_done);

                                                        return orderData.timeline_kerja.map((task, tIdx) => {
                                                            const isTaskDone = isSelesai || isDikirim || Boolean(task.is_done);
                                                            const isTaskActive = isProses && !isTaskDone && (firstUnfinishedIdx === tIdx || (firstUnfinishedIdx === -1 && tIdx === 0));

                                                            return (
                                                                <div
                                                                    key={task.id || tIdx}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.65rem',
                                                                        padding: '0.65rem 0.85rem',
                                                                        borderRadius: '10px',
                                                                        background: isTaskDone ? '#f0fdf4' : isTaskActive ? '#eff6ff' : '#f8fafc',
                                                                        border: `1.5px solid ${isTaskDone ? '#bbf7d0' : isTaskActive ? '#93c5fd' : '#e2e8f0'}`,
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        borderRadius: '50%',
                                                                        background: isTaskDone ? '#059669' : isTaskActive ? '#2563eb' : '#f1f5f9',
                                                                        color: (isTaskDone || isTaskActive) ? '#ffffff' : '#94a3b8',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 800,
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {isTaskDone ? (
                                                                            <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>check</span>
                                                                        ) : isTaskActive ? (
                                                                            <span className="material-icons-round" style={{ fontSize: '0.9rem', animation: 'spin 2s infinite linear' }}>sync</span>
                                                                        ) : (
                                                                            tIdx + 1
                                                                        )}
                                                                    </div>

                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            gap: '0.35rem'
                                                                        }}>
                                                                            <div style={{
                                                                                fontSize: '0.84rem',
                                                                                fontWeight: 700,
                                                                                color: isTaskDone ? '#065f46' : isTaskActive ? '#1e40af' : '#1e293b',
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis'
                                                                            }}>
                                                                                {task.tugas}
                                                                            </div>

                                                                            <span style={{
                                                                                fontSize: '0.68rem',
                                                                                fontWeight: 700,
                                                                                padding: '0.15rem 0.45rem',
                                                                                borderRadius: '999px',
                                                                                background: isTaskDone ? '#dcfce7' : isTaskActive ? '#dbeafe' : '#f1f5f9',
                                                                                color: isTaskDone ? '#15803d' : isTaskActive ? '#1d4ed8' : '#94a3b8',
                                                                                whiteSpace: 'nowrap',
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {isTaskDone ? 'Selesai' : isTaskActive ? 'Dikerjakan' : 'Menunggu'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Footer Bantuan WA */}
                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                                Ada perubahan atau pertanyaan tentang pesanan Anda?
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                                Tim customer care Gotten siap membantu melalui WhatsApp.
                            </div>
                        </div>

                        <a
                            href={waLink(`Halo Admin Gotten, saya ingin bertanya terkait progres pesanan saya dengan nomor #${orderData.id} (${orderData.customer} - ${orderData.product}).`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.6rem 1.15rem',
                                background: '#25D366',
                                color: '#ffffff',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)'
                            }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>chat</span>
                            Hubungi Admin via WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* ── IMAGE LIGHTBOX / PREVIEW MODAL ── */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.85)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            background: '#ffffff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <div style={{
                            padding: '0.75rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e2e8f0',
                            background: '#f8fafc'
                        }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                                {previewImage.title || 'Mockup Jersey'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1.4rem' }}>close</span>
                            </button>
                        </div>
                        <div style={{ padding: '1rem', overflow: 'auto', textAlign: 'center', background: '#0b1120' }}>
                            <img
                                src={previewImage.url}
                                alt="Pratinjau Mockup"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '75vh',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
