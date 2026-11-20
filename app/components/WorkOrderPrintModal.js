'use client';

import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   Dokumen cetak (iframe) — ukuran A4 dikunci, auto-fit 1 halaman.
   - Area isi = 200mm x 286mm (A4 dikurangi margin 5mm).
   - Jika isi kebanyakan  → seluruh SPK di-zoom kecil sampai pas.
   - Jika isi ada sisa    → sisa ruang dipakai memperbesar gambar
                            Desain ACC (kolom grid dipilih otomatis).
   - Kolom tanda tangan selalu menempel di dasar kertas.
   ───────────────────────────────────────────────────────────── */
const FIT_SCRIPT = `
(function () {
    function fit() {
        var page = document.querySelector('.spk-page');
        var content = document.querySelector('.spk-content');
        if (!page || !content) return;
        var grid = document.querySelector('[data-spk="design-grid"]');
        var boxes = [].slice.call(document.querySelectorAll('[data-spk="design-box"]'));
        var MIN = 70, GAP = 8;

        content.style.zoom = '';
        content.style.minHeight = '0';
        boxes.forEach(function (b) { b.style.height = MIN + 'px'; });

        var P = page.clientHeight;
        var H = content.scrollHeight;

        // 1) Isi kebanyakan → perkecil proporsional
        if (H > P) {
            content.style.zoom = String(Math.floor((P / H) * 1000) / 1000);
            content.style.minHeight = '';
            return;
        }

        // 2) Ada sisa ruang → perbesar gambar desain
        if (grid && boxes.length) {
            var n = boxes.length;
            var labelH = 0;
            boxes.forEach(function (b) {
                labelH = Math.max(labelH, b.parentElement.offsetHeight - MIN);
            });
            var budget = grid.offsetHeight + (P - H) - 6;
            var W = grid.clientWidth;

            var ratios = [];
            [].slice.call(grid.querySelectorAll('img')).forEach(function (img) {
                if (img.naturalWidth && img.naturalHeight) ratios.push(img.naturalWidth / img.naturalHeight);
            });
            var ar = ratios.length ? ratios.reduce(function (a, b) { return a + b; }, 0) / ratios.length : 0.8;

            var best = null;
            for (var c = 1; c <= n; c++) {
                var rows = Math.ceil(n / c);
                var h = (budget - (rows - 1) * GAP) / rows - labelH;
                var w = (W - (c - 1) * GAP) / c - 10;
                if (h < MIN) continue;
                var dispW = Math.min(w, h * ar);
                var dispH = dispW / ar;
                if (!best || dispW > best.score) best = { score: dispW, c: c, rows: rows, h: Math.min(h, dispH + 6) };
            }
            if (best) {
                grid.style.gridTemplateColumns = 'repeat(' + best.c + ', 1fr)';
                boxes.forEach(function (b) { b.style.height = Math.floor(best.h) + 'px'; });
                // Koreksi jika ternyata masih meluap sedikit
                var over = content.scrollHeight - P;
                if (over > 0) {
                    var nh = Math.max(MIN, Math.floor(best.h - over / best.rows) - 2);
                    boxes.forEach(function (b) { b.style.height = nh + 'px'; });
                }
            }
        }
        content.style.minHeight = '';
    }
    window.__spkFit = fit;
    if (document.readyState === 'complete') fit();
    else window.addEventListener('load', fit);
})();
`;

function buildPrintHtml(innerHTML, title) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
    @page { size: A4 portrait; margin: 5mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body {
        color: #0f172a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        line-height: 1.3;
    }
    @media screen { body { padding: 5mm; } }
    table { border-collapse: collapse; }
    img { max-width: 100%; }
    .spk-page { width: 200mm; height: 286mm; overflow: hidden; }
    .spk-content { display: flex; flex-direction: column; min-height: 100%; }
    [data-spk="signature"] { margin-top: auto !important; }
</style>
</head>
<body>
    <div class="spk-page"><div class="spk-content">${innerHTML}</div></div>
    <script>${FIT_SCRIPT}</script>
</body>
</html>`;
}

export default function WorkOrderPrintModal({ workOrder, onClose }) {
    const sourceRef = useRef(null);
    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    const [ready, setReady] = useState(false);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Bangun dokumen cetak dari sumber tersembunyi
    useEffect(() => {
        if (!sourceRef.current || !workOrder) return;
        setReady(false);
        setHtml(buildPrintHtml(sourceRef.current.innerHTML, `SPK_${workOrder.wo_number || 'Jersey'}`));
    }, [workOrder]);

    if (!workOrder) return null;

    const dt = workOrder.data_transaksi || {};
    const atasan = workOrder.spesifikasi_atasan || {};
    const celana = workOrder.spesifikasi_celana || {};
    const timeline = Array.isArray(workOrder.timeline_kerja) ? workOrder.timeline_kerja : [];
    const ukuran = workOrder.data_ukuran || {};
    const fk = workOrder.finishing_kemungkinan || {};
    const finishing = fk.finishing || {};
    const kemungkinan = fk.kemungkinan || {};
    const notesProduksi = Array.isArray(workOrder.notes_produksi) ? workOrder.notes_produksi : [];
    const bahanDibeli = Array.isArray(workOrder.bahan_dibeli) ? workOrder.bahan_dibeli : [];
    const designs = Array.isArray(workOrder.designs) ? workOrder.designs : [];

    function handlePrint() {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        if (typeof win.__spkFit === 'function') win.__spkFit();
        win.focus();
        win.print();
    }

    const sectionTitle = {
        fontSize: '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        color: '#334155',
        borderBottom: '1px solid #cbd5e1',
        paddingBottom: '0.15rem',
        marginBottom: '0.35rem'
    };
    const cardTitle = (color) => ({
        fontWeight: 800,
        color,
        borderBottom: '1px solid #cbd5e1',
        paddingBottom: '0.2rem',
        marginBottom: '0.25rem',
        textTransform: 'uppercase',
        fontSize: '0.72rem'
    });
    const card = { border: '1px solid #cbd5e1', borderRadius: '5px', padding: '0.35rem 0.5rem' };
    const label = { color: '#64748b' };
    const cell = { padding: '0.2rem 0.4rem', border: '1px solid #cbd5e1' };
    const sizeCell = { padding: '0.2rem 0.3rem', borderRight: '1px solid #e2e8f0' };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1rem',
            overflowY: 'auto'
        }}>
            {/* Top Bar */}
            <div style={{
                width: '210mm',
                maxWidth: '100%',
                flexShrink: 0,
                background: '#1e293b',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="material-icons-round" style={{ color: '#38bdf8' }}>print</span>
                    <div>
                        <strong style={{ fontSize: '0.95rem' }}>Pratinjau Cetak SPK (A4)</strong>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.5rem' }}>
                            ({workOrder.wo_number})
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={!ready}
                        style={{
                            background: ready ? '#0284c7' : '#64748b',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: ready ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>
                            {ready ? 'print' : 'hourglass_top'}
                        </span>
                        {ready ? 'Cetak / Download PDF' : 'Menyiapkan...'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Pratinjau = dokumen cetak sebenarnya (WYSIWYG) */}
            <iframe
                ref={iframeRef}
                title="Pratinjau SPK"
                srcDoc={html}
                onLoad={() => html && setReady(true)}
                style={{
                    width: '210mm',
                    height: '297mm',
                    flexShrink: 0,
                    border: 0,
                    background: '#ffffff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
                }}
            />

            {/* Sumber konten (tersembunyi) — disalin ke dalam iframe */}
            <div ref={sourceRef} style={{ display: 'none' }}>
                {/* ── KOP SURAT ── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #0f172a',
                    paddingBottom: '0.4rem',
                    marginBottom: '0.45rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.04em', margin: 0, color: '#0f172a', lineHeight: 1.1 }}>
                            GOTTEN APPAREL
                        </h1>
                        <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0.15rem 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Custom Sportswear &amp; Jersey Production Sheet
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            display: 'inline-block',
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            letterSpacing: '0.04em'
                        }}>
                            SPK PRODUKSI
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '0.2rem', color: '#0f172a' }}>
                            {workOrder.wo_number}
                            {workOrder.order_id && (
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginLeft: '0.4rem' }}>
                                    (Order #{workOrder.order_id})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── INFORMASI PROYEK ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.4rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '5px',
                    padding: '0.4rem 0.6rem',
                    marginBottom: '0.45rem',
                    fontSize: '0.75rem'
                }}>
                    <div>
                        <span style={{ ...label, display: 'block', fontSize: '0.65rem' }}>NAMA TIM / PROYEK:</span>
                        <strong style={{ fontSize: '0.85rem' }}>{dt.nama_project || workOrder.team_name || '-'}</strong>
                    </div>
                    <div>
                        <span style={{ ...label, display: 'block', fontSize: '0.65rem' }}>CUSTOMER & RIWAYAT:</span>
                        <strong style={{ fontSize: '0.85rem' }}>
                            {workOrder.customer || '-'}
                            {dt.riwayat ? <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', marginLeft: '0.3rem' }}>({dt.riwayat})</span> : ''}
                        </strong>
                    </div>
                    <div>
                        <span style={{ ...label, display: 'block', fontSize: '0.65rem' }}>TANGGAL MASUK:</span>
                        <strong>{dt.tanggal_masuk || '-'}</strong>
                    </div>
                    <div>
                        <span style={{ ...label, display: 'block', fontSize: '0.65rem' }}>TARGET KELUAR:</span>
                        <strong style={{ color: '#059669', fontSize: '0.85rem' }}>
                            {dt.tanggal_keluar ? `${dt.tanggal_keluar} (${dt.estimasi_hari || 0} Hari)` : '-'}
                        </strong>
                    </div>
                </div>

                {/* ── DESAIN ACC (ukuran gambar diatur otomatis oleh FIT_SCRIPT) ── */}
                {designs.length > 0 && (
                    <div style={{ marginBottom: '0.45rem' }}>
                        <div style={sectionTitle}>🎨 Desain ACC Jersey Fix</div>
                        <div data-spk="design-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.min(designs.length, 3)}, 1fr)`,
                            gap: '8px'
                        }}>
                            {designs.map((d, idx) => (
                                <div key={idx} style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '5px',
                                    padding: '4px',
                                    textAlign: 'center',
                                    background: '#f8fafc'
                                }}>
                                    <div data-spk="design-box" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {d.url ? (
                                            <img src={d.url} alt={d.label || ''} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Mockup belum diupload</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.2rem', marginTop: '0.2rem' }}>
                                        {d.label || `Desain #${idx + 1}`}
                                    </div>
                                    {d.notes && (
                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{d.notes}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RINCIAN UKURAN ── */}
                <div style={{ marginBottom: '0.45rem' }}>
                    <div style={sectionTitle}>📏 Rincian Ukuran &amp; Total Kuantiti</div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: celana.has_celana ? '1fr 1fr 130px' : '2fr 130px',
                        gap: '0.5rem',
                        alignItems: 'stretch'
                    }}>
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', fontWeight: 700, fontSize: '0.7rem', color: '#334155' }}>
                                Ukuran Atasan ({ukuran.total_atasan || 0} Pcs)
                            </div>
                            <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'center' }}>
                                <tbody>
                                    <tr style={{ background: '#f8fafc', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
                                        {(ukuran.atasan || []).map((u, i) => <td key={i} style={sizeCell}>{u.size}</td>)}
                                    </tr>
                                    <tr style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                                        {(ukuran.atasan || []).map((u, i) => <td key={i} style={sizeCell}>{u.qty || '-'}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {celana.has_celana && (
                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', fontWeight: 700, fontSize: '0.7rem', color: '#334155' }}>
                                    Ukuran Celana ({ukuran.total_celana || 0} Pcs)
                                </div>
                                <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'center' }}>
                                    <tbody>
                                        <tr style={{ background: '#f8fafc', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
                                            {(ukuran.celana || []).map((u, i) => <td key={i} style={sizeCell}>{u.size}</td>)}
                                        </tr>
                                        <tr style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                                            {(ukuran.celana || []).map((u, i) => <td key={i} style={sizeCell}>{u.qty || '-'}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{
                            border: '2px solid #0f172a',
                            borderRadius: '5px',
                            background: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Produksi</span>
                            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, margin: '0.1rem 0' }}>
                                {ukuran.grand_total || 0}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>PCS JERSEY</span>
                        </div>
                    </div>
                </div>

                {/* ── SPESIFIKASI ATASAN & CELANA ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <div style={{ ...card, fontSize: '0.7rem' }}>
                        <div style={cardTitle('#1e40af')}>👕 Spesifikasi Atasan</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: '0.15rem 0.4rem', lineHeight: 1.35 }}>
                            <span style={label}>Bahan / Kain:</span>
                            <strong>{dt.bahan || atasan.jenis_kain_baju || '-'}</strong>

                            <span style={label}>Pola:</span>
                            <span>{atasan.jenis_pola || '-'} {atasan.ciri_spesifik ? `(${atasan.ciri_spesifik})` : ''}</span>

                            <span style={label}>Sablon / Print:</span>
                            <span>{dt.sablon || atasan.printing_sablon || '-'}</span>

                            <span style={label}>Bordir:</span>
                            <span>{dt.bordir || '-'}</span>

                            <span style={label}>Bentuk / Warna Kerah:</span>
                            <span>{atasan.bentuk_kerah || '-'} / {atasan.warna_kerah || '-'}</span>

                            <span style={label}>Bahan Kerah &amp; Bisban:</span>
                            <span>{atasan.bahan_kerah || '-'} (Bisban: {atasan.bisban || '-'})</span>

                            <span style={label}>Lengan (Kanan/Kiri):</span>
                            <span>{atasan.warna_lengan_kanan || '-'} / {atasan.warna_lengan_kiri || '-'}</span>

                            <span style={label}>Lis Lengan:</span>
                            <span>{atasan.jenis_lis_lengan || '-'} {atasan.warna_lis_lengan ? `(${atasan.warna_lis_lengan})` : ''}</span>

                            <span style={label}>Finishing Bawah:</span>
                            <span>{atasan.finishing_bawah || '-'} {atasan.belah_samping ? `• Belah: ${atasan.belah_samping}` : ''}</span>

                            {atasan.tambahan_badan && (
                                <>
                                    <span style={label}>Tambahan Badan:</span>
                                    <span>{atasan.tambahan_badan}</span>
                                </>
                            )}
                            {Array.isArray(atasan.tambahan) && atasan.tambahan.length > 0 && (
                                <>
                                    <span style={label}>Tambahan Lain:</span>
                                    <span>{atasan.tambahan.join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ ...card, fontSize: '0.7rem' }}>
                        <div style={cardTitle('#9d174d')}>🩳 Spesifikasi Celana</div>
                        {!celana.has_celana ? (
                            <div style={{ color: '#64748b', fontStyle: 'italic', padding: '0.4rem 0' }}>
                                (Tidak Termasuk Celana / Hanya Baju)
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '0.15rem 0.4rem', lineHeight: 1.35 }}>
                                <span style={label}>Pakai Celana:</span>
                                <strong>{celana.pakai_celana || 'Ya'}</strong>

                                <span style={label}>Kain Celana:</span>
                                <span>{celana.jenis_kain_celana || '-'} ({celana.warna_kain_celana || '-'})</span>

                                <span style={label}>Model Jahit:</span>
                                <span>{celana.model_jahit_celana || '-'}</span>

                                <span style={label}>Karet Pinggang:</span>
                                <span>{celana.karet_pinggang || '-'} (Tali Kolor: {celana.pakai_tali_kolor || '-'})</span>

                                <span style={label}>Panel Kanan/Kiri:</span>
                                <span>{celana.panel_kanan || '-'} / {celana.panel_kiri || '-'}</span>

                                <span style={label}>Sablon Celana:</span>
                                <span>{celana.sablon_celana || '-'}</span>

                                {Array.isArray(celana.tambahan) && celana.tambahan.length > 0 && (
                                    <>
                                        <span style={label}>Catatan Celana:</span>
                                        <span>{celana.tambahan.join(', ')}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TIMELINE KERJA ── */}
                {timeline.length > 0 && (
                    <div style={{ marginBottom: '0.45rem' }}>
                        <div style={sectionTitle}>⏳ Alur &amp; Jadwal Kerja Jersey</div>
                        <table style={{ width: '100%', fontSize: '0.7rem', border: '1px solid #cbd5e1' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', color: '#1e293b' }}>
                                    <th style={{ ...cell, width: '22%', textAlign: 'left' }}>Tahap / Tugas</th>
                                    <th style={{ ...cell, width: '16%' }}>Mulai</th>
                                    <th style={{ ...cell, width: '16%' }}>Selesai</th>
                                    <th style={{ ...cell, width: '10%' }}>Durasi</th>
                                    <th style={{ ...cell, width: '20%', textAlign: 'left' }}>PIC</th>
                                    <th style={{ ...cell, width: '16%' }}>Paraf / CI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeline.map((t, idx) => (
                                    <tr key={idx} style={{ background: t.is_done ? '#f0fdf4' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                                        <td style={{ ...cell, fontWeight: 600, color: t.is_done ? '#166534' : '#1e293b' }}>
                                            {idx + 1}. {t.tugas} {t.is_done && <span style={{ color: '#059669', fontSize: '0.65rem' }}>[✓]</span>}
                                        </td>
                                        <td style={{ ...cell, textAlign: 'center' }}>{t.mulai || '-'}</td>
                                        <td style={{ ...cell, textAlign: 'center', fontWeight: 600 }}>{t.selesai || '-'}</td>
                                        <td style={{ ...cell, textAlign: 'center' }}>{t.durasi || 0} Hari</td>
                                        <td style={cell}>{t.pic || '-'}</td>
                                        <td style={{ ...cell, textAlign: 'center', color: t.is_done ? '#059669' : '#64748b', fontWeight: t.is_done ? 700 : 400 }}>
                                            {t.is_done ? '✓ Selesai' : (t.ci || '[       ]')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── FINISHING, KEMUNGKINAN, NOTES & BAHAN ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.45rem', fontSize: '0.7rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={card}>
                            <div style={cardTitle('#0f172a')}>📦 Finishing &amp; Packing</div>
                            <div style={{ lineHeight: 1.35 }}>
                                <div>• Packing: <strong>{finishing.packing || '-'}</strong></div>
                                <div>• Plastik: <strong>{finishing.plastik_packing || '-'}</strong></div>
                                <div>• Kirim: <strong>{finishing.pengiriman || '-'}</strong></div>
                                {Array.isArray(finishing.tambahan) && finishing.tambahan.map((item, i) => (
                                    <div key={i}>• {item.label}: <strong>{item.value}</strong></div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...card, flex: 1 }}>
                            <div style={cardTitle('#b45309')}>📝 Notes Khusus Produksi</div>
                            {notesProduksi.length === 0 ? (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada catatan khusus.</span>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    {notesProduksi.map((n, i) => (
                                        <div key={i}><strong>#{i + 1}.</strong> {n}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={card}>
                            <div style={cardTitle('#c2410c')}>⚠️ Kemungkinan / Mitigasi Resiko</div>
                            <div style={{ lineHeight: 1.35 }}>
                                {kemungkinan.penyusutan_kain && <div>• Susut Kain: {kemungkinan.penyusutan_kain}</div>}
                                {kemungkinan.perubahan_size_jahit && <div>• Toleransi Size: {kemungkinan.perubahan_size_jahit}</div>}
                                {kemungkinan.kesulitan_jahit && <div>• Kesulitan Jahit: <strong>{kemungkinan.kesulitan_jahit}</strong></div>}
                                {kemungkinan.proofing && <div>• Proofing: {kemungkinan.proofing}</div>}
                                {kemungkinan.sampling && <div>• Sampling: {kemungkinan.sampling}</div>}
                                {Array.isArray(kemungkinan.tambahan) && kemungkinan.tambahan.map((item, i) => (
                                    <div key={i}>• {item.label}: {item.value}</div>
                                ))}
                                {!kemungkinan.penyusutan_kain && !kemungkinan.perubahan_size_jahit && !kemungkinan.kesulitan_jahit &&
                                    !kemungkinan.proofing && !kemungkinan.sampling &&
                                    !(Array.isArray(kemungkinan.tambahan) && kemungkinan.tambahan.length) && (
                                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada resiko khusus tercatat.</span>
                                    )}
                            </div>
                        </div>

                        <div style={{ ...card, flex: 1 }}>
                            <div style={cardTitle('#0f172a')}>🧵 Kain / Bahan yang Dibeli</div>
                            {bahanDibeli.length === 0 ? (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum ada rincian pembelian kain.</span>
                            ) : (
                                <table style={{ width: '100%', fontSize: '0.68rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid #cbd5e1' }}>Kain</th>
                                            <th style={{ padding: '0.2rem 0.25rem', borderBottom: '1px solid #cbd5e1' }}>Kg</th>
                                            <th style={{ padding: '0.2rem 0.25rem', borderBottom: '1px solid #cbd5e1' }}>Mtr</th>
                                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid #cbd5e1' }}>Toko</th>
                                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid #cbd5e1' }}>Ket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bahanDibeli.map((b, i) => (
                                            <tr key={i} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                                                <td style={{ padding: '0.2rem 0.3rem', fontWeight: 600 }}>{b.jenis_kain}</td>
                                                <td style={{ padding: '0.2rem 0.25rem' }}>{b.kg || '-'}</td>
                                                <td style={{ padding: '0.2rem 0.25rem' }}>{b.meter || '-'}</td>
                                                <td style={{ padding: '0.2rem 0.3rem' }}>{b.toko || '-'}</td>
                                                <td style={{ padding: '0.2rem 0.3rem' }}>{b.keterangan || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TANDA TANGAN (selalu di dasar kertas) ── */}
                <div data-spk="signature" style={{ borderTop: '2px solid #0f172a', paddingTop: '0.35rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.7rem' }}>
                        {['Admin / Sales', 'Cutting (Potong)', 'Printing / Sablon', 'Jahit (Sewing)', 'QC & Packing'].map((role) => (
                            <div key={role}>
                                <span style={{ color: '#64748b', display: 'block', marginBottom: '1.8rem', fontSize: '0.68rem' }}>{role}</span>
                                <div style={{ borderTop: '1px solid #334155', paddingTop: '0.2rem', fontWeight: 600 }}>
                                    ( ......................... )
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
