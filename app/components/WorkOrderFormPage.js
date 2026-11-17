'use client';

import { useState, useEffect } from 'react';
import WorkOrderPrintModal from './WorkOrderPrintModal';

export default function WorkOrderFormPage({ editItem, onSave, onCancel }) {
    const isEdit = !!editItem;

    const [orderId, setOrderId] = useState(editItem?.order_id || '');
    const [customer, setCustomer] = useState(editItem?.customer || '');
    const [teamName, setTeamName] = useState(editItem?.team_name || '');
    const [notes, setNotes] = useState(editItem?.notes || '');
    const [showPrintModal, setShowPrintModal] = useState(false);

    // ── 1. Desain ACC (Multiple uploads) ──
    const [designs, setDesigns] = useState(
        editItem?.designs && editItem.designs.length > 0
            ? editItem.designs
            : [
                { id: 1, label: 'Pemain (Home)', url: '', fileName: '', notes: '' },
                { id: 2, label: 'Kiper', url: '', fileName: '', notes: '' }
            ]
    );

    // ── 2. Data Transaksi ──
    const initialDt = editItem?.data_transaksi || {};
    const [dataTransaksi, setDataTransaksi] = useState({
        nama_project: initialDt.nama_project || editItem?.team_name || '',
        riwayat: initialDt.riwayat || '',
        bahan: initialDt.bahan || '',
        sablon: initialDt.sablon || '',
        bordir: initialDt.bordir || '',
        tanggal_masuk: initialDt.tanggal_masuk || new Date().toISOString().split('T')[0],
        estimasi_hari: initialDt.estimasi_hari || '',
    });

    // Hitung otomatis Tanggal Keluar = Tanggal Masuk + Estimasi Hari
    const computedTanggalKeluar = (() => {
        if (!dataTransaksi.tanggal_masuk || !dataTransaksi.estimasi_hari) return '';
        const days = parseInt(dataTransaksi.estimasi_hari, 10);
        if (isNaN(days) || days < 0) return '';
        const d = new Date(dataTransaksi.tanggal_masuk);
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    })();

    // ── 3. Spesifikasi Atasan ──
    const initialAtasan = editItem?.spesifikasi_atasan || {};
    const [spesifikasiAtasan, setSpesifikasiAtasan] = useState({
        // Dasar & Pola
        jenis_atasan: initialAtasan.jenis_atasan || '',
        ciri_spesifik: initialAtasan.ciri_spesifik || '',
        jenis_pola: initialAtasan.jenis_pola || '',
        jenis_kain_baju: initialAtasan.jenis_kain_baju || '',
        printing_sablon: initialAtasan.printing_sablon || '',
        authentic: initialAtasan.authentic || '',
        label_size: initialAtasan.label_size || '',
        // Kerah & Leher
        bentuk_kerah: initialAtasan.bentuk_kerah || '',
        warna_kerah: initialAtasan.warna_kerah || '',
        bisban: initialAtasan.bisban || '',
        bahan_kerah: initialAtasan.bahan_kerah || '',
        warna_variasi_kerah: initialAtasan.warna_variasi_kerah || '',
        variasi_jahit_kerah: initialAtasan.variasi_jahit_kerah || '',
        // Lengan
        warna_lengan_kanan: initialAtasan.warna_lengan_kanan || '',
        warna_lengan_kiri: initialAtasan.warna_lengan_kiri || '',
        jenis_lis_lengan: initialAtasan.jenis_lis_lengan || '',
        warna_lis_lengan: initialAtasan.warna_lis_lengan || '',
        variasi_lengan: initialAtasan.variasi_lengan || '',
        tambahan_lengan: initialAtasan.tambahan_lengan || '',
        ciri_lain_lengan: initialAtasan.ciri_lain_lengan || '',
        // Badan & Bawah
        tambahan_badan: initialAtasan.tambahan_badan || '',
        ciri_lain: initialAtasan.ciri_lain || '',
        atasan_warna_resleting: initialAtasan.atasan_warna_resleting || '',
        jenis_jahit_bawah_baju: initialAtasan.jenis_jahit_bawah_baju || '',
        finishing_bawah: initialAtasan.finishing_bawah || '',
        belah_samping: initialAtasan.belah_samping || '',
        lengkung_lurus: initialAtasan.lengkung_lurus || '',
    });

    // Tambahan Atasan (Dinamis List)
    const [tambahanAtasan, setTambahanAtasan] = useState(
        Array.isArray(initialAtasan.tambahan) && initialAtasan.tambahan.length > 0
            ? initialAtasan.tambahan
            : []
    );

    // ── 4. Spesifikasi Celana ──
    const initialCelana = editItem?.spesifikasi_celana || {};
    const [hasCelana, setHasCelana] = useState(initialCelana.has_celana ?? false);
    const [spesifikasiCelana, setSpesifikasiCelana] = useState({
        pakai_celana: initialCelana.pakai_celana || '',
        jenis_kain_celana: initialCelana.jenis_kain_celana || '',
        area_variasi_celana: initialCelana.area_variasi_celana || '',
        model_jahit_celana: initialCelana.model_jahit_celana || '',
        belah_samping: initialCelana.belah_samping || '',
        warna_kain_celana: initialCelana.warna_kain_celana || '',
        sablon_celana: initialCelana.sablon_celana || '',
        panel_kanan: initialCelana.panel_kanan || '',
        panel_kiri: initialCelana.panel_kiri || '',
        pakai_tali_kolor: initialCelana.pakai_tali_kolor || '',
        karet_pinggang: initialCelana.karet_pinggang || '',
        model_celana_khusus: initialCelana.model_celana_khusus || '',
    });

    // Tambahan Celana (Dinamis List)
    const [tambahanCelana, setTambahanCelana] = useState(
        Array.isArray(initialCelana.tambahan) && initialCelana.tambahan.length > 0
            ? initialCelana.tambahan
            : []
    );

    // ── 5. Timeline Kerja Jersey ──
    const DEFAULT_TIMELINE_TASKS = [
        { key: 'beli_kain', tugas: 'Beli Kain', defaultDurasi: '1' },
        { key: 'cutting', tugas: 'Cutting', defaultDurasi: '0' },
        { key: 'printing', tugas: 'Printing/Sablon', defaultDurasi: '5' },
        { key: 'jahit', tugas: 'Jahit', defaultDurasi: '14' },
        { key: 'qc', tugas: 'QC', defaultDurasi: '1' },
        { key: 'packing_kirim', tugas: 'Packing + Kirim', defaultDurasi: '1' },
    ];

    const initialTimelineData = (() => {
        if (Array.isArray(editItem?.timeline_kerja) && editItem.timeline_kerja.length > 0) {
            return editItem.timeline_kerja.map((t, idx) => ({
                id: t.id || `task_${idx}_${Date.now()}`,
                tugas: t.tugas || '',
                durasi: t.durasi !== undefined ? String(t.durasi) : '0',
                pic: t.pic || '',
                ci: t.ci || '',
                isCustom: !DEFAULT_TIMELINE_TASKS.some(d => d.tugas === t.tugas)
            }));
        }
        return DEFAULT_TIMELINE_TASKS.map(task => ({
            id: task.key,
            tugas: task.tugas,
            durasi: task.defaultDurasi,
            pic: '',
            ci: '',
            isCustom: false
        }));
    })();

    const [timelineRows, setTimelineRows] = useState(initialTimelineData);

    // Sisipkan baris tugas baru tepat di bawah index tertentu
    function insertTimelineRowBelow(idx) {
        setTimelineRows(prev => {
            const next = [...prev];
            const newRow = {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                tugas: '',
                durasi: '1',
                pic: '',
                ci: '',
                isCustom: true
            };
            next.splice(idx + 1, 0, newRow);
            return next;
        });
    }

    // Hapus baris tugas
    function removeTimelineRow(idx) {
        if (timelineRows.length === 1) {
            alert('Minimal harus ada satu tahap dalam timeline kerja.');
            return;
        }
        setTimelineRows(prev => prev.filter((_, i) => i !== idx));
    }

    // Reset kembali ke 6 tugas standar
    function resetTimelineToDefault() {
        if (confirm('Kembalikan timeline kerja ke 6 tahap standar? Data durasi & PIC yang sudah diisi di tahap standar akan dipertahankan.')) {
            setTimelineRows(DEFAULT_TIMELINE_TASKS.map(task => {
                const existing = timelineRows.find(t => t.tugas === task.tugas);
                return {
                    id: task.key,
                    tugas: task.tugas,
                    durasi: existing?.durasi !== undefined ? String(existing.durasi) : task.defaultDurasi,
                    pic: existing?.pic || '',
                    ci: existing?.ci || '',
                    isCustom: false
                };
            }));
        }
    }

    // Helper functions for Timeline date calculation (pure arithmetic, immune to timezone drift)
    function addDaysToDateStr(dateStr, days) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return '';
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (isNaN(dateObj.getTime())) return '';
        const numDays = parseInt(days, 10);
        const validDays = isNaN(numDays) ? 0 : numDays;
        dateObj.setDate(dateObj.getDate() + validDays);
        const resY = dateObj.getFullYear();
        const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
        const resD = String(dateObj.getDate()).padStart(2, '0');
        return `${resY}-${resM}-${resD}`;
    }

    function formatIndoDisplayDate(dateStr) {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const MONTHS = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${d} ${MONTHS[m] || ''} ${y}`;
    }

    // Cascade calculation for Timeline Mulai & Selesai
    const computedTimeline = (() => {
        let currentMulai = dataTransaksi.tanggal_masuk || '';
        return timelineRows.map((row) => {
            const mulai = currentMulai;
            const durasiNum = parseInt(row.durasi, 10);
            const selesai = mulai ? addDaysToDateStr(mulai, isNaN(durasiNum) ? 0 : durasiNum) : '';
            // Next task starts on this task's end date
            currentMulai = selesai;
            return {
                ...row,
                mulai,
                selesai
            };
        });
    })();

    const totalTimelineDays = computedTimeline.reduce((sum, item) => {
        const val = parseInt(item.durasi, 10);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const finalPackingSelesai = computedTimeline.length > 0 ? computedTimeline[computedTimeline.length - 1].selesai : '';

    const timelineStatusBadge = (() => {
        if (!finalPackingSelesai || !computedTanggalKeluar) return null;
        const isOver = finalPackingSelesai > computedTanggalKeluar;
        if (isOver) {
            return (
                <span style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>warning</span>
                    Melebihi Estimasi Keluar ({formatIndoDisplayDate(computedTanggalKeluar)})
                </span>
            );
        }
        return (
            <span style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #6ee7b7',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
            }}>
                <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>check_circle</span>
                Sesuai Estimasi Keluar ({formatIndoDisplayDate(computedTanggalKeluar)})
            </span>
        );
    })();

    function updateTimelineRow(idx, field, value) {
        setTimelineRows(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    }

    // ── 6. Rincian Ukuran & Total (Size Breakdown) ──
    const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
    const initialUkuran = editItem?.data_ukuran || {};

    const [ukuranAtasan, setUkuranAtasan] = useState(
        Array.isArray(initialUkuran.atasan) && initialUkuran.atasan.length > 0
            ? initialUkuran.atasan.map(item => ({ size: item.size || '', qty: item.qty !== undefined ? String(item.qty) : '' }))
            : DEFAULT_SIZES.map(s => ({ size: s, qty: '' }))
    );

    const [ukuranCelana, setUkuranCelana] = useState(
        Array.isArray(initialUkuran.celana) && initialUkuran.celana.length > 0
            ? initialUkuran.celana.map(item => ({ size: item.size || '', qty: item.qty !== undefined ? String(item.qty) : '' }))
            : DEFAULT_SIZES.map(s => ({ size: s, qty: '' }))
    );

    // Subtotal Atasan
    const subtotalAtasan = ukuranAtasan.reduce((sum, item) => {
        const val = parseInt(item.qty, 10);
        return sum + (isNaN(val) || val < 0 ? 0 : val);
    }, 0);

    // Subtotal Celana (only active if hasCelana is true)
    const subtotalCelana = hasCelana
        ? ukuranCelana.reduce((sum, item) => {
            const val = parseInt(item.qty, 10);
            return sum + (isNaN(val) || val < 0 ? 0 : val);
        }, 0)
        : 0;

    // Grand Total (Atasan + Celana)
    const grandTotalUkuran = subtotalAtasan + subtotalCelana;

    function addUkuranAtasanRow() {
        setUkuranAtasan(prev => [...prev, { size: '', qty: '' }]);
    }
    function updateUkuranAtasanRow(idx, field, val) {
        setUkuranAtasan(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    }
    function removeUkuranAtasanRow(idx) {
        setUkuranAtasan(prev => prev.filter((_, i) => i !== idx));
    }

    function addUkuranCelanaRow() {
        setUkuranCelana(prev => [...prev, { size: '', qty: '' }]);
    }
    function updateUkuranCelanaRow(idx, field, val) {
        setUkuranCelana(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    }
    function removeUkuranCelanaRow(idx) {
        setUkuranCelana(prev => prev.filter((_, i) => i !== idx));
    }

    // ── 7. Finishing & Kemungkinan ──
    const initialFk = editItem?.finishing_kemungkinan || {};
    const initialFinishing = initialFk.finishing || {};
    const initialKemungkinan = initialFk.kemungkinan || {};

    const [finishing, setFinishing] = useState({
        packing: initialFinishing.packing || '',
        plastik_packing: initialFinishing.plastik_packing || '',
        pengiriman: initialFinishing.pengiriman || '',
    });

    const [tambahanFinishing, setTambahanFinishing] = useState(
        Array.isArray(initialFinishing.tambahan) && initialFinishing.tambahan.length > 0
            ? initialFinishing.tambahan
            : []
    );

    const [kemungkinan, setKemungkinan] = useState({
        penyusutan_kain: initialKemungkinan.penyusutan_kain || '',
        perubahan_size_jahit: initialKemungkinan.perubahan_size_jahit || '',
        kesulitan_jahit: initialKemungkinan.kesulitan_jahit || '',
        proofing: initialKemungkinan.proofing || '',
        sampling: initialKemungkinan.sampling || '',
    });

    const [tambahanKemungkinan, setTambahanKemungkinan] = useState(
        Array.isArray(initialKemungkinan.tambahan) && initialKemungkinan.tambahan.length > 0
            ? initialKemungkinan.tambahan
            : []
    );

    // Handlers for Tambahan Finishing
    function addTambahanFinishing() {
        setTambahanFinishing(prev => [...prev, { label: '', value: '' }]);
    }
    function updateTambahanFinishing(idx, field, val) {
        setTambahanFinishing(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    }
    function removeTambahanFinishing(idx) {
        setTambahanFinishing(prev => prev.filter((_, i) => i !== idx));
    }

    // Handlers for Tambahan Kemungkinan
    function addTambahanKemungkinan() {
        setTambahanKemungkinan(prev => [...prev, { label: '', value: '' }]);
    }
    function updateTambahanKemungkinan(idx, field, val) {
        setTambahanKemungkinan(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    }
    function removeTambahanKemungkinan(idx) {
        setTambahanKemungkinan(prev => prev.filter((_, i) => i !== idx));
    }

    // ── 8. Notes & Bahan yang Dibeli ──
    const [notesProduksi, setNotesProduksi] = useState(
        Array.isArray(editItem?.notes_produksi) ? editItem.notes_produksi : []
    );

    const [bahanDibeli, setBahanDibeli] = useState(
        Array.isArray(editItem?.bahan_dibeli) ? editItem.bahan_dibeli : []
    );

    function addNotesProduksiRow() {
        setNotesProduksi(prev => [...prev, '']);
    }
    function updateNotesProduksiRow(idx, val) {
        setNotesProduksi(prev => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    }
    function removeNotesProduksiRow(idx) {
        setNotesProduksi(prev => prev.filter((_, i) => i !== idx));
    }

    function addBahanDibeliRow() {
        setBahanDibeli(prev => [
            ...prev,
            { id: Date.now(), jenis_kain: '', kg: '', meter: '', toko: '', keterangan: '' }
        ]);
    }
    function updateBahanDibeliRow(idx, field, val) {
        setBahanDibeli(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    }
    function removeBahanDibeliRow(idx) {
        setBahanDibeli(prev => prev.filter((_, i) => i !== idx));
    }

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Keep nama_project updated if teamName changes
    useEffect(() => {
        if (!dataTransaksi.nama_project && teamName) {
            setDataTransaksi(prev => ({ ...prev, nama_project: teamName }));
        }
    }, [teamName]);

    // Handlers for Designs
    function addDesignItem() {
        const nextId = Date.now();
        setDesigns([...designs, { id: nextId, label: '', url: '', fileName: '', notes: '' }]);
    }
    function removeDesignItem(id) {
        if (designs.length === 1) {
            alert('Minimal harus ada satu slot desain.');
            return;
        }
        setDesigns(designs.filter(d => d.id !== id));
    }
    function updateDesignField(id, field, value) {
        setDesigns(designs.map(d => d.id === id ? { ...d, [field]: value } : d));
    }

    async function handleFileUpload(id, file) {
        if (!file) return;
        updateDesignField(id, 'uploading', true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.url) {
                setDesigns(prev => prev.map(d => d.id === id ? {
                    ...d,
                    url: data.url,
                    fileName: data.filename || file.name,
                    uploading: false
                } : d));
            } else {
                alert(data.error || 'Gagal mengupload file gambar.');
                updateDesignField(id, 'uploading', false);
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Gagal mengupload file gambar.');
            updateDesignField(id, 'uploading', false);
        }
    }

    // Handlers for Tambahan Lists
    function addTambahanAtasan() {
        setTambahanAtasan([...tambahanAtasan, '']);
    }
    function updateTambahanAtasan(idx, val) {
        const updated = [...tambahanAtasan];
        updated[idx] = val;
        setTambahanAtasan(updated);
    }
    function removeTambahanAtasan(idx) {
        setTambahanAtasan(tambahanAtasan.filter((_, i) => i !== idx));
    }

    function addTambahanCelana() {
        setTambahanCelana([...tambahanCelana, '']);
    }
    function updateTambahanCelana(idx, val) {
        const updated = [...tambahanCelana];
        updated[idx] = val;
        setTambahanCelana(updated);
    }
    function removeTambahanCelana(idx) {
        setTambahanCelana(tambahanCelana.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg('');
        setSaving(true);

        const payload = {
            order_id: orderId,
            customer,
            team_name: teamName,
            notes,
            designs: designs.map(({ id, label, url, fileName, notes: dNotes }) => ({
                id,
                label,
                url,
                fileName,
                notes: dNotes
            })),
            data_transaksi: {
                ...dataTransaksi,
                nama_project: dataTransaksi.nama_project || teamName,
                tanggal_keluar: computedTanggalKeluar
            },
            spesifikasi_atasan: {
                ...spesifikasiAtasan,
                tambahan: tambahanAtasan.filter(t => t.trim() !== '')
            },
            spesifikasi_celana: {
                has_celana: hasCelana,
                ...(hasCelana ? spesifikasiCelana : {}),
                tambahan: hasCelana ? tambahanCelana.filter(t => t.trim() !== '') : []
            },
            timeline_kerja: computedTimeline.map(t => ({
                tugas: t.tugas,
                mulai: t.mulai,
                selesai: t.selesai,
                durasi: t.durasi,
                pic: t.pic,
                ci: t.ci
            })),
            data_ukuran: {
                atasan: ukuranAtasan.filter(u => u.size.trim() !== '' || u.qty !== ''),
                celana: hasCelana ? ukuranCelana.filter(u => u.size.trim() !== '' || u.qty !== '') : [],
                total_atasan: subtotalAtasan,
                total_celana: subtotalCelana,
                grand_total: grandTotalUkuran
            },
            finishing_kemungkinan: {
                finishing: {
                    ...finishing,
                    tambahan: tambahanFinishing.filter(t => t.label.trim() !== '' || t.value.trim() !== '')
                },
                kemungkinan: {
                    ...kemungkinan,
                    tambahan: tambahanKemungkinan.filter(t => t.label.trim() !== '' || t.value.trim() !== '')
                }
            },
            notes_produksi: notesProduksi.filter(n => n.trim() !== ''),
            bahan_dibeli: bahanDibeli.filter(b => (b.jenis_kain || '').trim() !== '' || b.kg !== '' || b.meter !== '' || (b.toko || '').trim() !== '' || (b.keterangan || '').trim() !== '')
        };

        try {
            let res;
            if (isEdit) {
                res = await fetch('/api/work-orders', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editItem.id, ...payload })
                });
            } else {
                res = await fetch('/api/work-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                onSave();
            } else {
                const errData = await res.json();
                setErrorMsg(errData.error || 'Terjadi kesalahan saat menyimpan Work Order.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Terjadi kesalahan jaringan.');
        }

        setSaving(false);
    }

    return (
        <div className="page-content">
            <div className="form-page-header">
                <button className="btn-back" onClick={onCancel}>
                    <span className="material-icons-round">arrow_back</span>
                    Kembali
                </button>
                <h2 className="form-page-title" style={{ margin: 0 }}>
                    {isEdit ? '✏️ Edit Work Order Jersey' : '📋 Buat Work Order Jersey Baru'}
                </h2>
                {isEdit && (
                    <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginLeft: 'auto'
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>print</span>
                        Cetak / Download SPK
                    </button>
                )}
            </div>

            {errorMsg && (
                <div style={{
                    padding: '0.85rem 1.25rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    marginBottom: '1.25rem',
                    fontSize: '0.875rem'
                }}>
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%' }}>
                
                {/* ── CARD 1: Informasi Pesanan & Tim (Read Only) ── */}
                <div className="form-page-card" style={{ marginBottom: '1.5rem', maxWidth: '100%', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-icons-round" style={{ color: 'var(--primary, #3b82f6)' }}>assignment</span>
                            Informasi Pesanan &amp; Tim
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(148, 163, 184, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
                            <span className="material-icons-round" style={{ fontSize: '0.85rem' }}>lock</span>
                            Terkunci otomatis dari Pesanan
                        </span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nomor Pesanan (Order ID)</label>
                            <input
                                className="form-input"
                                readOnly
                                value={orderId || '-'}
                                style={{ background: 'rgba(148, 163, 184, 0.1)', cursor: 'not-allowed', fontWeight: 600 }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nama Tim / Klub</label>
                            <input
                                className="form-input"
                                readOnly
                                value={teamName || '-'}
                                style={{ background: 'rgba(148, 163, 184, 0.1)', cursor: 'not-allowed', fontWeight: 600 }}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Pemesan / Customer</label>
                            <input
                                className="form-input"
                                readOnly
                                value={customer || '-'}
                                style={{ background: 'rgba(148, 163, 184, 0.1)', cursor: 'not-allowed', fontWeight: 600 }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Catatan Umum Produksi</label>
                            <input
                                className="form-input"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Contoh: Deadline turnamen tgl 25, packing dus khusus"
                            />
                        </div>
                    </div>
                </div>

                {/* ── CARD 2: Desain ACC (Multiple uploads) ── */}
                <div className="form-page-card" style={{ marginBottom: '1.5rem', maxWidth: '100%', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons-round" style={{ color: '#10b981' }}>palette</span>
                                Desain ACC (Multiple Jersey Mockup)
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                                Masukkan judul desain (Pemain, Kiper, Official, dll.) dan upload file desain/mockup fix yang sudah di-ACC customer.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-add"
                            onClick={addDesignItem}
                            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1rem' }}>add</span>
                            Tambah Varian Desain
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                        {designs.map((design, index) => (
                            <div
                                key={design.id}
                                style={{
                                    border: '1px solid var(--border-color, #e2e8f0)',
                                    borderRadius: '10px',
                                    padding: '1.25rem',
                                    background: 'var(--card-bg, #ffffff)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#3b82f6',
                                        background: '#eff6ff',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px'
                                    }}>
                                        Desain #{index + 1}
                                    </span>
                                    {designs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDesignItem(design.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '0.2rem',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Hapus varian desain ini"
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '1.2rem' }}>delete_outline</span>
                                        </button>
                                    )}
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Judul / Kategori Desain *</label>
                                    <input
                                        className="form-input"
                                        required
                                        value={design.label}
                                        onChange={e => updateDesignField(design.id, 'label', e.target.value)}
                                        placeholder="Contoh: Pemain Home / Kiper / Official"
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">File Mockup / Desain ACC</label>
                                    {design.url ? (
                                        <div style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            textAlign: 'center'
                                        }}>
                                            <img
                                                src={design.url}
                                                alt={design.label}
                                                style={{
                                                    maxHeight: '180px',
                                                    width: '100%',
                                                    objectFit: 'contain',
                                                    display: 'block',
                                                    margin: '0 auto',
                                                    padding: '0.5rem'
                                                }}
                                            />
                                            <div style={{
                                                padding: '0.5rem',
                                                background: '#ffffff',
                                                borderTop: '1px solid #e2e8f0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '0.75rem'
                                            }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '180px',
                                                    color: 'var(--text-muted, #64748b)'
                                                }}>
                                                    {design.fileName || 'desain.png'}
                                                </span>
                                                <label style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
                                                    Ganti
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={e => handleFileUpload(design.id, e.target.files[0])}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '1.5rem 1rem',
                                            border: '2px dashed #cbd5e1',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: '#f8fafc',
                                            minHeight: '140px'
                                        }}>
                                            <span className="material-icons-round" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                                {design.uploading ? 'hourglass_top' : 'cloud_upload'}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color, #1e293b)' }}>
                                                {design.uploading ? 'Mengunggah...' : 'Klik untuk Upload Gambar'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>PNG, JPG, WEBP</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                disabled={design.uploading}
                                                onChange={e => handleFileUpload(design.id, e.target.files[0])}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Catatan Teknis Desain</label>
                                    <input
                                        className="form-input"
                                        style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                                        value={design.notes || ''}
                                        onChange={e => updateDesignField(design.id, 'notes', e.target.value)}
                                        placeholder="Pola kerah V-neck, celana hitam list putih, dll."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CARD 3: Data Transaksi (Kotak Hijau) ── */}
                <div className="form-page-card" style={{ marginBottom: '1.5rem', maxWidth: '100%', width: '100%', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857' }}>
                        <span className="material-icons-round">calendar_today</span>
                        Data Transaksi &amp; Jadwal
                    </h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Project (Nama Tim)</label>
                            <input
                                className="form-input"
                                value={dataTransaksi.nama_project || teamName}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, nama_project: e.target.value })}
                                placeholder="Contoh: Jersey STEMGA"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Riwayat (Freetext)</label>
                            <input
                                className="form-input"
                                value={dataTransaksi.riwayat}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, riwayat: e.target.value })}
                                placeholder="Contoh: Baru / Repeat Order / Pernah Pesan"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="form-group">
                            <label className="form-label">Bahan</label>
                            <input
                                className="form-input"
                                value={dataTransaksi.bahan}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, bahan: e.target.value })}
                                placeholder="Contoh: Milano / Dryfit Jarum"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sablon</label>
                            <input
                                className="form-input"
                                value={dataTransaksi.sablon}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, sablon: e.target.value })}
                                placeholder="Contoh: Print Sublim / DTF"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bordir</label>
                            <input
                                className="form-input"
                                value={dataTransaksi.bordir}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, bordir: e.target.value })}
                                placeholder="Contoh: Emblem Dada Kiri / -"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="form-group">
                            <label className="form-label">Tanggal Masuk (Manual Input)</label>
                            <input
                                className="form-input"
                                type="date"
                                value={dataTransaksi.tanggal_masuk}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, tanggal_masuk: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estimasi (Hari) - Bebas</label>
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={dataTransaksi.estimasi_hari}
                                onChange={e => setDataTransaksi({ ...dataTransaksi, estimasi_hari: e.target.value })}
                                placeholder="Contoh: 21"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Tanggal Keluar
                                <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: '0.4rem', fontWeight: 600 }}>
                                    (Otomatis Kalender)
                                </span>
                            </label>
                            <input
                                className="form-input"
                                readOnly
                                value={computedTanggalKeluar}
                                placeholder="Terhitung otomatis..."
                                style={{ background: 'rgba(16, 185, 129, 0.08)', fontWeight: 700, color: '#047857', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── CARD 4: Spesifikasi Atasan (Kotak Biru) ── */}
                <div className="form-page-card" style={{ marginBottom: '1.5rem', maxWidth: '100%', width: '100%', borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8' }}>
                        <span className="material-icons-round">checkroom</span>
                        Spesifikasi Atasan
                    </h3>

                    {/* Sub-grup 1: Dasar & Pola */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            1. Dasar &amp; Pola Baju
                        </h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div className="form-group">
                                <label className="form-label">Jenis Atasan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.jenis_atasan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, jenis_atasan: e.target.value })}
                                    placeholder="2 PCS (1 pecah pola, 1 biasa)"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ciri Spesifik</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.ciri_spesifik}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, ciri_spesifik: e.target.value })}
                                    placeholder="Pecah pola pakai seperti AFK"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jenis Pola</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.jenis_pola}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, jenis_pola: e.target.value })}
                                    placeholder="Reguler / Slimfit"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jenis Kain Baju</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.jenis_kain_baju}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, jenis_kain_baju: e.target.value })}
                                    placeholder="Milano / Serena / Dryfit"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Printing / Sablon</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.printing_sablon}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, printing_sablon: e.target.value })}
                                    placeholder="Print / Sublim / DTF"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Authentic</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.authentic}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, authentic: e.target.value })}
                                    placeholder="Ya / Tidak"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Label Size</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.label_size}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, label_size: e.target.value })}
                                    placeholder="DTF / Woven"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-grup 2: Kerah & Leher */}
                    <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            2. Kerah &amp; Leher
                        </h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div className="form-group">
                                <label className="form-label">Bentuk Kerah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.bentuk_kerah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, bentuk_kerah: e.target.value })}
                                    placeholder="1. Kancing satu 2. V variasi kecil"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warna Kerah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.warna_kerah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, warna_kerah: e.target.value })}
                                    placeholder="1. Putih 2. Hijau Putih"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bisban</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.bisban}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, bisban: e.target.value })}
                                    placeholder="Gotten"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bahan Kerah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.bahan_kerah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, bahan_kerah: e.target.value })}
                                    placeholder="1. Rib poly 2. Seperti badan"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warna Variasi Kerah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.warna_variasi_kerah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, warna_variasi_kerah: e.target.value })}
                                    placeholder="Warna variasi kerah..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Variasi Jahit Kerah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.variasi_jahit_kerah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, variasi_jahit_kerah: e.target.value })}
                                    placeholder="Seperti gambar / Polos"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-grup 3: Bagian Lengan */}
                    <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            3. Bagian Lengan
                        </h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div className="form-group">
                                <label className="form-label">Warna Lengan Kanan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.warna_lengan_kanan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, warna_lengan_kanan: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warna Lengan Kiri</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.warna_lengan_kiri}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, warna_lengan_kiri: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jenis Lis Lengan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.jenis_lis_lengan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, jenis_lis_lengan: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warna Lis Lengan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.warna_lis_lengan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, warna_lis_lengan: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Variasi Lengan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.variasi_lengan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, variasi_lengan: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tambahan Lengan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.tambahan_lengan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, tambahan_lengan: e.target.value })}
                                    placeholder="Seperti gambar"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ciri Lain Lengan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.ciri_lain_lengan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, ciri_lain_lengan: e.target.value })}
                                    placeholder="Ciri khusus lengan..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-grup 4: Bagian Badan & Bawah Baju */}
                    <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            4. Bagian Badan &amp; Bawah Baju
                        </h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div className="form-group">
                                <label className="form-label">Tambahan Badan</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.tambahan_badan}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, tambahan_badan: e.target.value })}
                                    placeholder="Pecah pola 7 panel (desain 1)"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ciri Lain</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.ciri_lain}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, ciri_lain: e.target.value })}
                                    placeholder="Ciri khusus lainnya..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Atasan Warna Resleting</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.atasan_warna_resleting}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, atasan_warna_resleting: e.target.value })}
                                    placeholder="Hitam / Sesuai badan"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jenis Jahit Bawah Baju</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.jenis_jahit_bawah_baju}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, jenis_jahit_bawah_baju: e.target.value })}
                                    placeholder="Standar / Jahit rantai"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Finishing Bawah</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.finishing_bawah}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, finishing_bawah: e.target.value })}
                                    placeholder="Overdeck"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Belah Samping</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.belah_samping}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, belah_samping: e.target.value })}
                                    placeholder="Tidak / Ya (3cm)"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Lengkung / Lurus</label>
                                <input
                                    className="form-input"
                                    value={spesifikasiAtasan.lengkung_lurus}
                                    onChange={e => setSpesifikasiAtasan({ ...spesifikasiAtasan, lengkung_lurus: e.target.value })}
                                    placeholder="Lurus / Lengkung"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-grup 5: *Tambahan Atasan */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                                * Tambahan Spesifikasi Atasan (Bisa Lebih Dari Satu)
                            </label>
                            <button
                                type="button"
                                onClick={addTambahanAtasan}
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
                                    gap: '0.2rem'
                                }}
                            >
                                <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                Tambah Poin
                            </button>
                        </div>

                        {tambahanAtasan.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                Belum ada catatan tambahan atasan. Klik tombol "+ Tambah Poin" jika ada instruksi khusus.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {tambahanAtasan.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                                        <input
                                            className="form-input"
                                            value={item}
                                            onChange={e => updateTambahanAtasan(idx, e.target.value)}
                                            placeholder="Contoh: Jahitan stik balik pada sambungan pundak..."
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeTambahanAtasan(idx)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                            title="Hapus baris ini"
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>delete_outline</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── CARD 5: Spesifikasi Celana (Kotak Pink/Ungu) ── */}
                <div className="form-page-card" style={{ marginBottom: '1.5rem', maxWidth: '100%', width: '100%', borderLeft: '4px solid #ec4899' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasCelana ? '1.25rem' : '0', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be185d' }}>
                            <span className="material-icons-round">accessibility</span>
                            Spesifikasi Celana
                        </h3>

                        {/* Checkbox Toggle Termasuk Celana */}
                        <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: hasCelana ? '#fdf2f8' : 'rgba(148, 163, 184, 0.08)',
                            border: `1px solid ${hasCelana ? '#fbcfe8' : 'var(--border-color)'}`,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: hasCelana ? '#be185d' : 'var(--text-muted)'
                        }}>
                            <input
                                type="checkbox"
                                checked={hasCelana}
                                onChange={e => setHasCelana(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ec4899' }}
                            />
                            Termasuk Celana dalam Pesanan ini
                        </label>
                    </div>

                    {!hasCelana ? (
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
                            Pesanan ini tidak menyertakan celana (hanya atasan). Centang opsi di atas jika pesanan ini termasuk celana.
                        </p>
                    ) : (
                        <div style={{ marginTop: '1.25rem' }}>
                            <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                                <div className="form-group">
                                    <label className="form-label">Pakai Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.pakai_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, pakai_celana: e.target.value })}
                                        placeholder="Ya (hanya 1) / Semua Pemain"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Jenis Kain Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.jenis_kain_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, jenis_kain_celana: e.target.value })}
                                        placeholder="Jarum / Lotto / Serena"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Area Variasi Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.area_variasi_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, area_variasi_celana: e.target.value })}
                                        placeholder="Samping / Bawah"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model Jahit Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.model_jahit_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, model_jahit_celana: e.target.value })}
                                        placeholder="Obras + Setik"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Belah Samping</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.belah_samping}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, belah_samping: e.target.value })}
                                        placeholder="Tidak / Ya (5cm)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Warna Kain Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.warna_kain_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, warna_kain_celana: e.target.value })}
                                        placeholder="Putih hijau botol"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sablon Celana</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.sablon_celana}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, sablon_celana: e.target.value })}
                                        placeholder="DTF / Polyflex / -"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Panel Kanan</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.panel_kanan}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, panel_kanan: e.target.value })}
                                        placeholder="Logo gotten"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Panel Kiri</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.panel_kiri}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, panel_kiri: e.target.value })}
                                        placeholder="Nomor"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pakai Tali Kolor</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.pakai_tali_kolor}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, pakai_tali_kolor: e.target.value })}
                                        placeholder="Ya / Tidak"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Karet Pinggang</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.karet_pinggang}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, karet_pinggang: e.target.value })}
                                        placeholder="4cm / 3cm"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model Celana Khusus</label>
                                    <input
                                        className="form-input"
                                        value={spesifikasiCelana.model_celana_khusus}
                                        onChange={e => setSpesifikasiCelana({ ...spesifikasiCelana, model_celana_khusus: e.target.value })}
                                        placeholder="Saku resleting kanan kiri..."
                                    />
                                </div>
                            </div>

                            {/* *Tambahan Celana */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                                        * Tambahan Spesifikasi Celana (Bisa Lebih Dari Satu)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addTambahanCelana}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.3rem 0.65rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ec4899',
                                            background: '#fdf2f8',
                                            color: '#be185d',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Poin
                                    </button>
                                </div>

                                {tambahanCelana.length === 0 ? (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                        Belum ada catatan tambahan celana. Klik tombol "+ Tambah Poin" jika ada instruksi khusus.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {tambahanCelana.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                                                <input
                                                    className="form-input"
                                                    value={item}
                                                    onChange={e => updateTambahanCelana(idx, e.target.value)}
                                                    placeholder="Contoh: Saku celana kanan pakai resleting jepang..."
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeTambahanCelana(idx)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                                    title="Hapus baris ini"
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '1.15rem' }}>delete_outline</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CARD 6: Timeline Kerja Jersey ── */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #d8b4fe',
                    boxShadow: '0 2px 8px rgba(147, 51, 234, 0.05)',
                    overflow: 'hidden',
                    width: '100%',
                    marginBottom: '1.75rem'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        color: '#ffffff',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.35rem' }}>schedule</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    Timeline Kerja Jersey
                                </h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    Jadwal alur produksi otomatis berurutan (Mulai + Durasi Hari = Selesai)
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                            <button
                                type="button"
                                onClick={resetTimelineToDefault}
                                style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    color: '#ffffff',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                                title="Kembalikan susunan ke 6 tahap bawaan"
                            >
                                <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>restart_alt</span>
                                Reset 6 Tahap
                            </button>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
                                📅 Mulai Produksi: <strong>{formatIndoDisplayDate(dataTransaksi.tanggal_masuk) || 'Belum diisi'}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                                <thead>
                                    <tr style={{ background: '#ede9fe', color: '#5b21b6' }}>
                                        <th rowSpan="2" style={{ padding: '0.75rem 0.85rem', border: '1px solid #ddd6fe', fontWeight: 700, width: '22%' }}>
                                            Tugas
                                        </th>
                                        <th colSpan="2" style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd6fe', fontWeight: 700, textAlign: 'center', width: '31%' }}>
                                            Timeline
                                        </th>
                                        <th rowSpan="2" style={{ padding: '0.75rem 0.5rem', border: '1px solid #ddd6fe', fontWeight: 700, textAlign: 'center', width: '11%' }}>
                                            Durasi (Hari)
                                        </th>
                                        <th rowSpan="2" style={{ padding: '0.75rem 0.65rem', border: '1px solid #ddd6fe', fontWeight: 700, width: '15%' }}>
                                            PIC
                                        </th>
                                        <th rowSpan="2" style={{ padding: '0.75rem 0.5rem', border: '1px solid #ddd6fe', fontWeight: 700, width: '8%' }}>
                                            CI
                                        </th>
                                        <th rowSpan="2" style={{ padding: '0.75rem 0.5rem', border: '1px solid #ddd6fe', fontWeight: 700, textAlign: 'center', width: '13%' }}>
                                            Aksi
                                        </th>
                                    </tr>
                                    <tr style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                                        <th style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd6fe', fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>
                                            Mulai
                                        </th>
                                        <th style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd6fe', fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>
                                            Selesai
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {computedTimeline.map((item, idx) => (
                                        <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#faf5ff' }}>
                                            {/* Tugas */}
                                            <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #e9d5ff', fontWeight: 600, color: '#1e293b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                    <span style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '50%',
                                                        background: item.isCustom ? '#c084fc' : '#ede9fe',
                                                        color: item.isCustom ? '#ffffff' : '#7c3aed',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        flexShrink: 0
                                                    }}>
                                                        {idx + 1}
                                                    </span>

                                                    {item.isCustom ? (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.tugas}
                                                            onChange={e => updateTimelineRow(idx, 'tugas', e.target.value)}
                                                            placeholder="Ketik nama tugas (cth: Bordir)..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.35rem 0.5rem',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                borderColor: '#c084fc',
                                                                background: '#ffffff'
                                                            }}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '0.9rem' }}>{item.tugas}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Mulai (Read-only) */}
                                            <td style={{ padding: '0.55rem 0.65rem', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '6px',
                                                    padding: '0.4rem 0.5rem',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 500,
                                                    color: item.mulai ? '#334155' : '#94a3b8',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {formatIndoDisplayDate(item.mulai)}
                                                </div>
                                            </td>

                                            {/* Selesai (Read-only) */}
                                            <td style={{ padding: '0.55rem 0.65rem', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '6px',
                                                    padding: '0.4rem 0.5rem',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    color: item.selesai ? '#059669' : '#94a3b8',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {formatIndoDisplayDate(item.selesai)}
                                                </div>
                                            </td>

                                            {/* Durasi (Hari) */}
                                            <td style={{ padding: '0.55rem 0.5rem', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="form-input"
                                                        value={item.durasi}
                                                        onChange={e => updateTimelineRow(idx, 'durasi', e.target.value)}
                                                        style={{
                                                            width: '56px',
                                                            textAlign: 'center',
                                                            fontWeight: 700,
                                                            padding: '0.35rem 0.25rem',
                                                            borderColor: '#c084fc'
                                                        }}
                                                        placeholder="0"
                                                    />
                                                    <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>Hari</span>
                                                </div>
                                            </td>

                                            {/* PIC */}
                                            <td style={{ padding: '0.55rem 0.65rem', border: '1px solid #e9d5ff' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={item.pic}
                                                    onChange={e => updateTimelineRow(idx, 'pic', e.target.value)}
                                                    placeholder="Nama PIC (contoh: Hames)"
                                                    style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                                                />
                                            </td>

                                            {/* CI */}
                                            <td style={{ padding: '0.55rem 0.5rem', border: '1px solid #e9d5ff' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={item.ci}
                                                    onChange={e => updateTimelineRow(idx, 'ci', e.target.value)}
                                                    placeholder="Inisial/Cl"
                                                    style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                                                />
                                            </td>

                                            {/* Aksi: Sisip & Hapus */}
                                            <td style={{ padding: '0.45rem 0.4rem', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                                    {/* Tombol Sisipkan di Bawah */}
                                                    <button
                                                        type="button"
                                                        onClick={() => insertTimelineRowBelow(idx)}
                                                        style={{
                                                            background: '#f3e8ff',
                                                            border: '1px solid #c084fc',
                                                            color: '#7c3aed',
                                                            borderRadius: '6px',
                                                            padding: '0.25rem 0.45rem',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.15rem',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700
                                                        }}
                                                        title="Sisipkan tahap tugas baru tepat di bawah proses ini"
                                                    >
                                                        <span className="material-icons-round" style={{ fontSize: '0.95rem' }}>add</span>
                                                        Sisip
                                                    </button>

                                                    {/* Tombol Hapus */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimelineRow(idx)}
                                                        style={{
                                                            background: '#fee2e2',
                                                            border: '1px solid #fca5a5',
                                                            color: '#dc2626',
                                                            borderRadius: '6px',
                                                            padding: '0.25rem 0.35rem',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        title="Hapus baris proses ini"
                                                    >
                                                        <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>delete_outline</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.85rem', color: '#4c1d95' }}>
                                    Total Durasi Timeline: <strong style={{ fontSize: '0.95rem' }}>{totalTimelineDays} Hari</strong>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#4c1d95' }}>
                                    🏁 Selesai Kirim: <strong style={{ fontSize: '0.95rem', color: '#059669' }}>{formatIndoDisplayDate(finalPackingSelesai) || '-'}</strong>
                                </div>
                            </div>

                            {/* Status indicator compared to Tanggal Keluar */}
                            {timelineStatusBadge}
                        </div>
                    </div>
                </div>

                {/* ── CARD 7: Rincian Ukuran & Total (Size Breakdown) ── */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.06)',
                    overflow: 'hidden',
                    width: '100%',
                    marginBottom: '1.75rem'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        color: '#ffffff',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.35rem' }}>straighten</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    Rincian Ukuran & Total
                                </h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    Breakdown ukuran Atasan & Celana beserta perhitungan total kuantiti otomatis
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <span style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontWeight: 700
                            }}>
                                Total Produksi: {grandTotalUkuran} Pcs
                            </span>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.25rem',
                            alignItems: 'stretch'
                        }}>
                            {/* ── Kolom 1: Ukuran Atasan ── */}
                            <div style={{
                                background: '#fefce8',
                                borderRadius: '10px',
                                border: '1px solid #fef08a',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #fde047'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>checkroom</span>
                                        Ukuran Atasan
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addUkuranAtasanRow}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ca8a04',
                                            background: '#ffffff',
                                            color: '#854d0e',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Ukuran
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto', flex: 1 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#fef08a', color: '#713f12', fontSize: '0.8rem' }}>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fde047', fontWeight: 700, width: '45%' }}>
                                                    Ukuran
                                                </th>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fde047', fontWeight: 700, textAlign: 'center', width: '40%' }}>
                                                    Jumlah (Pcs)
                                                </th>
                                                <th style={{ padding: '0.45rem 0.4rem', border: '1px solid #fde047', width: '15%', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ukuranAtasan.map((item, idx) => (
                                                <tr key={idx} style={{ background: '#ffffff' }}>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fef08a' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.size}
                                                            onChange={e => updateUkuranAtasanRow(idx, 'size', e.target.value)}
                                                            placeholder="Contoh: S, M, XL..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.35rem 0.5rem',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fef08a', textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-input"
                                                            value={item.qty}
                                                            onChange={e => updateUkuranAtasanRow(idx, 'qty', e.target.value)}
                                                            placeholder="0"
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.35rem 0.5rem',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 700,
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fef08a', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUkuranAtasanRow(idx)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                padding: '0.2rem'
                                                            }}
                                                            title="Hapus baris ukuran ini"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Subtotal Atasan */}
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    background: '#fef08a',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: '#713f12'
                                }}>
                                    <span>Subtotal Atasan:</span>
                                    <span style={{ fontSize: '1rem', color: '#854d0e' }}>{subtotalAtasan} Pcs</span>
                                </div>
                            </div>

                            {/* ── Kolom 2: Ukuran Celana ── */}
                            <div style={{
                                background: hasCelana ? '#fdf2f8' : '#f8fafc',
                                borderRadius: '10px',
                                border: hasCelana ? '1px solid #fbcfe8' : '1px dashed #cbd5e1',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                opacity: hasCelana ? 1 : 0.8
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: hasCelana ? '2px solid #f472b6' : '2px solid #cbd5e1'
                                }}>
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        color: hasCelana ? '#9d174d' : '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>dry_cleaning</span>
                                        Ukuran Celana
                                    </h4>
                                    {hasCelana && (
                                        <button
                                            type="button"
                                            onClick={addUkuranCelanaRow}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '6px',
                                                border: '1px solid #db2777',
                                                background: '#ffffff',
                                                color: '#9d174d',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.2rem'
                                            }}
                                        >
                                            <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                            Tambah Ukuran
                                        </button>
                                    )}
                                </div>

                                {!hasCelana ? (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '1.5rem 1rem',
                                        textAlign: 'center',
                                        color: '#64748b'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                            block
                                        </span>
                                        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                            Tidak Termasuk Celana
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                            Centang pilihan <em>"Termasuk Celana"</em> pada bagian <strong>Spesifikasi Celana</strong> jika pesanan ini mencakup celana.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ overflowX: 'auto', flex: 1 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: '#fce7f3', color: '#831843', fontSize: '0.8rem' }}>
                                                        <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fbcfe8', fontWeight: 700, width: '45%' }}>
                                                            Ukuran
                                                        </th>
                                                        <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fbcfe8', fontWeight: 700, textAlign: 'center', width: '40%' }}>
                                                            Jumlah (Pcs)
                                                        </th>
                                                        <th style={{ padding: '0.45rem 0.4rem', border: '1px solid #fbcfe8', width: '15%', textAlign: 'center' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ukuranCelana.map((item, idx) => (
                                                        <tr key={idx} style={{ background: '#ffffff' }}>
                                                            <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    value={item.size}
                                                                    onChange={e => updateUkuranCelanaRow(idx, 'size', e.target.value)}
                                                                    placeholder="Contoh: S, M, XL..."
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.35rem 0.5rem',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 600,
                                                                        textAlign: 'center'
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3', textAlign: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-input"
                                                                    value={item.qty}
                                                                    onChange={e => updateUkuranCelanaRow(idx, 'qty', e.target.value)}
                                                                    placeholder="0"
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.35rem 0.5rem',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 700,
                                                                        textAlign: 'center'
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fce7f3', textAlign: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeUkuranCelanaRow(idx)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#ef4444',
                                                                        cursor: 'pointer',
                                                                        padding: '0.2rem'
                                                                    }}
                                                                    title="Hapus baris ukuran celana ini"
                                                                >
                                                                    <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Subtotal Celana */}
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.5rem 0.75rem',
                                            background: '#fce7f3',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#831843'
                                        }}>
                                            <span>Subtotal Celana:</span>
                                            <span style={{ fontSize: '1rem', color: '#9d174d' }}>{subtotalCelana} Pcs</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── Kolom 3: Total (Huge Number) ── */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '10px',
                                border: '2px solid #f59e0b',
                                padding: '1.25rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: '#b45309',
                                    marginBottom: '0.5rem'
                                }}>
                                    Total Kuantiti
                                </div>

                                <div style={{
                                    fontSize: '4.25rem',
                                    fontWeight: 900,
                                    color: '#0f172a',
                                    lineHeight: 1,
                                    margin: '0.5rem 0'
                                }}>
                                    {grandTotalUkuran}
                                </div>

                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    marginBottom: '0.75rem'
                                }}>
                                    PCS
                                </div>

                                <div style={{
                                    width: '100%',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px dashed #e2e8f0',
                                    fontSize: '0.78rem',
                                    color: '#475569',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Atasan:</span>
                                        <strong>{subtotalAtasan} pcs</strong>
                                    </div>
                                    {hasCelana && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Celana:</span>
                                            <strong>{subtotalCelana} pcs</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CARD 8: Finishing & Kemungkinan (2-Kolom Berdampingan) ── */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #fbcfe8',
                    boxShadow: '0 2px 8px rgba(190, 24, 93, 0.05)',
                    overflow: 'hidden',
                    width: '100%',
                    marginBottom: '1.75rem'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #9d174d 0%, #831843 100%)',
                        color: '#ffffff',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.35rem' }}>verified</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    Finishing & Kemungkinan
                                </h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    Instruksi packaging akhir serta identifikasi resiko/teknis produksi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content: 2 Kolom Berdampingan */}
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                            gap: '1.25rem',
                            alignItems: 'start'
                        }}>
                            {/* ── Kolom Kiri: Finishing ── */}
                            <div style={{
                                background: '#fdf2f8',
                                borderRadius: '10px',
                                border: '1px solid #fbcfe8',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #f472b6'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>inventory_2</span>
                                        Finishing
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addTambahanFinishing}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #db2777',
                                            background: '#ffffff',
                                            color: '#9d174d',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Baris
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#fce7f3', color: '#831843', fontSize: '0.8rem' }}>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fbcfe8', fontWeight: 700, width: '38%' }}>Item</th>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fbcfe8', fontWeight: 700 }}>Keterangan / Instruksi</th>
                                                <th style={{ padding: '0.45rem 0.35rem', border: '1px solid #fbcfe8', width: '32px', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Baris Standar 1: Packing */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #fce7f3', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Packing
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={finishing.packing}
                                                        onChange={e => setFinishing({ ...finishing, packing: e.target.value })}
                                                        placeholder="Contoh: Zipper"
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fce7f3' }}></td>
                                            </tr>

                                            {/* Baris Standar 2: Plastik Packing */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #fce7f3', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Plastik Packing
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={finishing.plastik_packing}
                                                        onChange={e => setFinishing({ ...finishing, plastik_packing: e.target.value })}
                                                        placeholder="Keterangan plastik..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fce7f3' }}></td>
                                            </tr>

                                            {/* Baris Standar 3: Pengiriman */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #fce7f3', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Pengiriman
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={finishing.pengiriman}
                                                        onChange={e => setFinishing({ ...finishing, pengiriman: e.target.value })}
                                                        placeholder="Kurir / Ekspedisi / Ambil Sendiri..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fce7f3' }}></td>
                                            </tr>

                                            {/* Baris Dinamis Tambahan */}
                                            {tambahanFinishing.map((item, idx) => (
                                                <tr key={idx} style={{ background: '#fff5f9' }}>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.label}
                                                            onChange={e => updateTambahanFinishing(idx, 'label', e.target.value)}
                                                            placeholder="Nama Label..."
                                                            style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #fce7f3' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.value}
                                                            onChange={e => updateTambahanFinishing(idx, 'value', e.target.value)}
                                                            placeholder="Keterangan..."
                                                            style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fce7f3', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTambahanFinishing(idx)}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                                                            title="Hapus baris ini"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── Kolom Kanan: Kemungkinan ── */}
                            <div style={{
                                background: '#fff7ed',
                                borderRadius: '10px',
                                border: '1px solid #fed7aa',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #fb923c'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>warning_amber</span>
                                        Kemungkinan
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addTambahanKemungkinan}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ea580c',
                                            background: '#ffffff',
                                            color: '#c2410c',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Baris
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#ffedd5', color: '#9a3412', fontSize: '0.8rem' }}>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fed7aa', fontWeight: 700, width: '42%' }}>Item</th>
                                                <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fed7aa', fontWeight: 700 }}>Keterangan / Catatan</th>
                                                <th style={{ padding: '0.45rem 0.35rem', border: '1px solid #fed7aa', width: '32px', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Baris Standar 1: Penyusutan Kain */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #ffedd5', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Penyusutan Kain
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={kemungkinan.penyusutan_kain}
                                                        onChange={e => setKemungkinan({ ...kemungkinan, penyusutan_kain: e.target.value })}
                                                        placeholder="Keterangan..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5' }}></td>
                                            </tr>

                                            {/* Baris Standar 2: Perubahan Size (Jahit) */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #ffedd5', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Perubahan Size (Jahit)
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={kemungkinan.perubahan_size_jahit}
                                                        onChange={e => setKemungkinan({ ...kemungkinan, perubahan_size_jahit: e.target.value })}
                                                        placeholder="Toleransi ukuran jahitan..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5' }}></td>
                                            </tr>

                                            {/* Baris Standar 3: Kesulitan Jahit */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #ffedd5', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Kesulitan Jahit
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={kemungkinan.kesulitan_jahit}
                                                        onChange={e => setKemungkinan({ ...kemungkinan, kesulitan_jahit: e.target.value })}
                                                        placeholder="Contoh: Pecah pola jersey 1"
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5' }}></td>
                                            </tr>

                                            {/* Baris Standar 4: Proofing */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #ffedd5', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Proofing
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={kemungkinan.proofing}
                                                        onChange={e => setKemungkinan({ ...kemungkinan, proofing: e.target.value })}
                                                        placeholder="Keterangan proofing..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5' }}></td>
                                            </tr>

                                            {/* Baris Standar 5: Sampling */}
                                            <tr style={{ background: '#ffffff' }}>
                                                <td style={{ padding: '0.45rem 0.6rem', border: '1px solid #ffedd5', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                                    Sampling
                                                </td>
                                                <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={kemungkinan.sampling}
                                                        onChange={e => setKemungkinan({ ...kemungkinan, sampling: e.target.value })}
                                                        placeholder="Keterangan sampling..."
                                                        style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5' }}></td>
                                            </tr>

                                            {/* Baris Dinamis Tambahan */}
                                            {tambahanKemungkinan.map((item, idx) => (
                                                <tr key={idx} style={{ background: '#fffaf5' }}>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.label}
                                                            onChange={e => updateTambahanKemungkinan(idx, 'label', e.target.value)}
                                                            placeholder="Nama Label..."
                                                            style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.5rem', border: '1px solid #ffedd5' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={item.value}
                                                            onChange={e => updateTambahanKemungkinan(idx, 'value', e.target.value)}
                                                            placeholder="Keterangan..."
                                                            style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #ffedd5', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTambahanKemungkinan(idx)}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                                                            title="Hapus baris ini"
                                                        >
                                                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CARD 9: Notes & Bahan yang Dibeli (2-Kolom Berdampingan) ── */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
                    overflow: 'hidden',
                    width: '100%',
                    marginBottom: '1.75rem'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        color: '#ffffff',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.35rem' }}>edit_note</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    Notes & Bahan yang Dibeli
                                </h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    Catatan khusus produksi serta rincian logistik pengadaan kain
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content: 2 Kolom Berdampingan */}
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                            gap: '1.25rem',
                            alignItems: 'start'
                        }}>
                            {/* ── Kolom Kiri: Notes ── */}
                            <div style={{
                                background: '#fefce8',
                                borderRadius: '10px',
                                border: '1px solid #fef08a',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #fde047'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>speaker_notes</span>
                                        Notes
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addNotesProduksiRow}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ca8a04',
                                            background: '#ffffff',
                                            color: '#854d0e',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Catatan
                                    </button>
                                </div>

                                {notesProduksi.length === 0 ? (
                                    <div style={{
                                        padding: '1.75rem 1rem',
                                        textAlign: 'center',
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px dashed #fde047'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.8rem', color: '#ca8a04', opacity: 0.6, marginBottom: '0.35rem', display: 'block' }}>
                                            note_add
                                        </span>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#854d0e', fontStyle: 'italic' }}>
                                            Belum ada catatan khusus. Klik <strong>"+ Tambah Catatan"</strong> jika ada instruksi tambahan (contoh: Atasan 2 namun Celana hanya 1).
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {notesProduksi.map((note, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: '#854d0e',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#fef08a',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    #{idx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={note}
                                                    onChange={e => updateNotesProduksiRow(idx, e.target.value)}
                                                    placeholder="Contoh: Atasan 2 namun Celana hanya 1..."
                                                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNotesProduksiRow(idx)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                                                    title="Hapus catatan ini"
                                                >
                                                    <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Kolom Kanan: Bahan yang Dibeli ── */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '10px',
                                border: '1px solid #fde68a',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #fde047'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>shopping_bag</span>
                                        Bahan yang Dibeli
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addBahanDibeliRow}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ca8a04',
                                            background: '#fefce8',
                                            color: '#854d0e',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '0.9rem' }}>add</span>
                                        Tambah Bahan
                                    </button>
                                </div>

                                {bahanDibeli.length === 0 ? (
                                    <div style={{
                                        padding: '1.75rem 1rem',
                                        textAlign: 'center',
                                        background: '#fefce8',
                                        borderRadius: '8px',
                                        border: '1px dashed #fde047'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.8rem', color: '#ca8a04', opacity: 0.6, marginBottom: '0.35rem', display: 'block' }}>
                                            add_shopping_cart
                                        </span>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#854d0e', fontStyle: 'italic' }}>
                                            Belum ada rincian bahan yang dibeli. Klik <strong>"+ Tambah Bahan"</strong> untuk mencatat pembelian kain.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '480px' }}>
                                            <thead>
                                                <tr style={{ background: '#fef08a', color: '#713f12', fontSize: '0.8rem' }}>
                                                    <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fde047', fontWeight: 700, width: '28%' }}>Jenis Kain</th>
                                                    <th style={{ padding: '0.45rem 0.4rem', border: '1px solid #fde047', fontWeight: 700, textAlign: 'center', width: '14%' }}>Kg</th>
                                                    <th style={{ padding: '0.45rem 0.4rem', border: '1px solid #fde047', fontWeight: 700, textAlign: 'center', width: '14%' }}>Meter</th>
                                                    <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fde047', fontWeight: 700, width: '22%' }}>Toko</th>
                                                    <th style={{ padding: '0.45rem 0.6rem', border: '1px solid #fde047', fontWeight: 700, width: '18%' }}>Ket</th>
                                                    <th style={{ padding: '0.45rem 0.3rem', border: '1px solid #fde047', width: '32px', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bahanDibeli.map((item, idx) => (
                                                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fefce8' }}>
                                                        <td style={{ padding: '0.35rem 0.4rem', border: '1px solid #fef08a' }}>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={item.jenis_kain}
                                                                onChange={e => updateBahanDibeliRow(idx, 'jenis_kain', e.target.value)}
                                                                placeholder="Jenis kain..."
                                                                style={{ width: '100%', padding: '0.35rem 0.4rem', fontSize: '0.82rem' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.35rem 0.3rem', border: '1px solid #fef08a', textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                className="form-input"
                                                                value={item.kg}
                                                                onChange={e => updateBahanDibeliRow(idx, 'kg', e.target.value)}
                                                                placeholder="0"
                                                                style={{ width: '100%', padding: '0.35rem 0.3rem', fontSize: '0.82rem', textAlign: 'center' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.35rem 0.3rem', border: '1px solid #fef08a', textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                className="form-input"
                                                                value={item.meter}
                                                                onChange={e => updateBahanDibeliRow(idx, 'meter', e.target.value)}
                                                                placeholder="0"
                                                                style={{ width: '100%', padding: '0.35rem 0.3rem', fontSize: '0.82rem', textAlign: 'center' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.35rem 0.4rem', border: '1px solid #fef08a' }}>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={item.toko}
                                                                onChange={e => updateBahanDibeliRow(idx, 'toko', e.target.value)}
                                                                placeholder="Toko kain..."
                                                                style={{ width: '100%', padding: '0.35rem 0.4rem', fontSize: '0.82rem' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.35rem 0.4rem', border: '1px solid #fef08a' }}>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={item.keterangan}
                                                                onChange={e => updateBahanDibeliRow(idx, 'keterangan', e.target.value)}
                                                                placeholder="Ket..."
                                                                style={{ width: '100%', padding: '0.35rem 0.4rem', fontSize: '0.82rem' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.35rem 0.25rem', border: '1px solid #fef08a', textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBahanDibeliRow(idx)}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                                                                title="Hapus baris ini"
                                                            >
                                                                <span className="material-icons-round" style={{ fontSize: '1.05rem' }}>delete_outline</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-page-actions" style={{ maxWidth: '100%', width: '100%', marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Batal
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowPrintModal(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', borderColor: '#38bdf8' }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>print</span>
                            Cetak SPK
                        </button>
                    )}
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan Work Order' : 'Buat Work Order')}
                    </button>
                </div>
            </form>

            {/* Modal Preview Cetak / Download PDF SPK */}
            {showPrintModal && (
                <WorkOrderPrintModal
                    workOrder={{
                        ...editItem,
                        order_id: orderId,
                        customer,
                        team_name: teamName,
                        designs,
                        data_transaksi: {
                            ...dataTransaksi,
                            nama_project: dataTransaksi.nama_project || teamName,
                            tanggal_keluar: computedTanggalKeluar
                        },
                        spesifikasi_atasan: {
                            ...spesifikasiAtasan,
                            tambahan: tambahanAtasan
                        },
                        spesifikasi_celana: {
                            has_celana: hasCelana,
                            ...(hasCelana ? spesifikasiCelana : {}),
                            tambahan: hasCelana ? tambahanCelana : []
                        },
                        timeline_kerja: computedTimeline,
                        data_ukuran: {
                            atasan: ukuranAtasan,
                            celana: hasCelana ? ukuranCelana : [],
                            total_atasan: subtotalAtasan,
                            total_celana: subtotalCelana,
                            grand_total: grandTotalUkuran
                        },
                        finishing_kemungkinan: {
                            finishing: { ...finishing, tambahan: tambahanFinishing },
                            kemungkinan: { ...kemungkinan, tambahan: tambahanKemungkinan }
                        },
                        notes_produksi: notesProduksi,
                        bahan_dibeli: bahanDibeli,
                        notes
                    }}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
        </div>
    );
}
