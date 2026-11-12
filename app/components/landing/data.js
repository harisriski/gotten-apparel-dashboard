// Static content for the public landing page.

export const WA_NUMBER = '6285640537027';
export const WA_DISPLAY = '+62 856-4053-7027';

export function waLink(message = 'Halo Gotten, saya mau tanya tentang custom jersey.') {
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const ADDRESS =
    'Kauman RT 23 RW 11, Kalitengah, Kec. Wedi, Kab. Klaten, Jawa Tengah 57461';
export const MAPS_QUERY = 'Kauman, Kalitengah, Wedi, Klaten, Jawa Tengah 57461';
export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;
export const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;
export const HOURS = 'Senin – Sabtu, 10.00 – 22.00 WIB';

export const INSTAGRAM = [
    { handle: '@gotten.indonesia', label: 'Brand', url: 'https://instagram.com/gotten.indonesia' },
    { handle: '@jasajahit_klaten', label: 'Jasa Jahit', url: 'https://instagram.com/jasajahit_klaten' },
];

export const NAV_LINKS = [
    { href: '#produksi', label: 'Kualitas' },
    { href: '#harga', label: 'Harga' },
    { href: '#cara-pesan', label: 'Cara Pesan' },
    { href: '#portofolio', label: 'Portofolio' },
    { href: '#kontak', label: 'Kontak' },
];

export const STATS = [
    { value: 2018, prefix: 'Sejak ', suffix: '', label: 'Berdiri di Klaten', plain: true },
    { value: 500, prefix: '', suffix: '+', label: 'Pcs per bulan' },
    { value: 1000, prefix: '', suffix: '+', label: 'Klien terlayani' },
    { value: 2, prefix: '1–', suffix: ' Mgg', label: 'Estimasi pengerjaan', plain: true },
];

export const DETAILS = [
    {
        img: '/landing/web/detail-badge.webp',
        tag: '01',
        title: 'Detail Logo Tajam',
        text: 'Logo, badge, dan motif tercetak tajam dan warnanya tidak mudah pudar.',
        big: true,
    },
    {
        img: '/landing/web/detail-fabric.webp',
        tag: '02',
        title: 'Bahan Dri-Fit',
        text: 'Ringan, menyerap keringat, dan cepat kering.',
    },
    {
        img: '/landing/web/detail-print.webp',
        tag: '03',
        title: 'Cutting Presisi',
        text: 'Nama dan nomor punggung dipotong dengan mesin, hasilnya rapi.',
    },
    {
        img: '/landing/web/detail-label.webp',
        tag: '04',
        title: 'Label Custom',
        text: 'Label leher dan tag khusus untuk tim Anda.',
    },
    {
        img: '/landing/web/detail-rack.webp',
        tag: '05',
        title: 'Cek Kualitas',
        text: 'Setiap jersey dicek satu per satu sebelum dikirim.',
    },
];

export const JERSEY_MODELS = [
    {
        id: 'classic',
        name: 'Jersey Classic',
        badge: 'Gaya Retro Klasik',
        tier: 'Ekonomis',
        price: 95000,
        priceFormatted: '95.000',
        unit: '/ 1 Stel',
        tagline: 'Minimalis retro dengan kombinasi kain warna elegan.',
        images: {
            front: '/landing/models/classic-front.png',
            side: '/landing/models/classic-side.png',
            back: '/landing/models/classic-back.png',
        },
        highlights: [
            'Setelan Baju + Celana',
            'Bahan Dryfit Premium (Milano/Jarum/Benzema)',
            'Kombinasi Kain Warna (Max 3 Warna)',
            'Sablon Full Polyflex Premium / DTF',
            'Collar (Krah) Tipe B',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'Setelan Atas Bawah (1 Stel Siap Pakai)' },
            { label: 'Pilihan Bahan', value: 'Dryfit Premium (Milano, Jarum, Benzema, Rhabit, dll)' },
            { label: 'Badan & Lengan', value: 'Badan depan, belakang, krah, dan lengan menggunakan kain warna (max kombinasi 3 warna)' },
            { label: 'Aplikasi Sablon', value: 'Sablon full Polyflex Premium / Digital Transfer Film (DTF)' },
            { label: 'Model Kerah', value: 'Collar (krah) tipe B' },
            { label: 'Celana Olahraga', value: 'Kain warna (max 2 warna) + sablon Polyflex Premium / DTF' },
            { label: 'Pengemasan', value: 'Packing plastic zipper exclusive' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Jersey Classic (Rp 95.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'halfprint',
        name: 'Jersey Half Print',
        badge: 'Best Value',
        tier: 'Value Choice',
        price: 115000,
        priceFormatted: '115.000',
        unit: '/ 1 Stel',
        tagline: 'Badan depan full printing bebas motif dengan kombinasi kain warna.',
        images: {
            front: '/landing/models/halfprint-front.png',
            side: '/landing/models/halfprint-side.png',
            back: '/landing/models/halfprint-back.png',
        },
        highlights: [
            'Setelan Baju + Celana',
            'Badan Depan Full Printing Bebas Desain',
            'Logo & Sponsor Depan Printing Tajam',
            'Lengan & Belakang Polyflex / DTF',
            'Collar (Krah) Tipe B',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'Setelan Atas Bawah (1 Stel Siap Pakai)' },
            { label: 'Pilihan Bahan', value: 'Dryfit Premium (Milano, Jarum, Benzema, Rhabit, dll)' },
            { label: 'Badan Depan', value: 'Full Printing termasuk logo & sponsor (motif, warna & desain bebas)' },
            { label: 'Belakang & Lengan', value: 'Kain warna solid + sablon Polyflex Premium / DTF' },
            { label: 'Model Kerah', value: 'Collar (krah) tipe B' },
            { label: 'Celana Olahraga', value: 'Kain warna (max 2 warna) + sablon Polyflex Premium / DTF' },
            { label: 'Pengemasan', value: 'Packing plastic zipper exclusive' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Jersey Half Print (Rp 115.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'fullprint',
        name: 'Jersey Full Print Atasan',
        badge: 'Paling Populer',
        tier: 'Best Seller',
        isPopular: true,
        price: 135000,
        priceFormatted: '135.000',
        unit: '/ 1 Stel',
        tagline: 'Atasan full printing bebas kreasi. Pilihan nomor satu turnamen & tim.',
        images: {
            front: '/landing/models/fullprint-front.png',
            side: '/landing/models/fullprint-side.png',
            back: '/landing/models/fullprint-back.png',
        },
        highlights: [
            'Setelan Baju + Celana',
            'Atasan Full Printing Menyeluruh (Depan, Belakang, Lengan, Krah)',
            'Logo, Sponsor, Nama & Nomor Terintegrasi Bebas Warna',
            'Dryfit Premium Quality',
            'Collar (Krah) Tipe B',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'Setelan Atas Bawah (1 Stel Siap Pakai)' },
            { label: 'Pilihan Bahan', value: 'Dryfit Premium (Milano, Jarum, Benzema, Rhabit, dll)' },
            { label: 'Atasan Printing', value: 'Atasan Full Printing termasuk logo, sponsor, nama, nomor punggung, lengan, dan krah' },
            { label: 'Kustomisasi Desain', value: 'Motif, warna, dan desain 100% bebas sesuai keinginan' },
            { label: 'Model Kerah', value: 'Collar (krah) tipe B' },
            { label: 'Celana Olahraga', value: 'Kain warna (max 2 warna) + sablon Polyflex Premium / DTF' },
            { label: 'Pengemasan', value: 'Packing plastic zipper exclusive' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Jersey Full Print Atasan (Rp 135.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'premium',
        name: 'Jersey Premium',
        badge: 'Eksklusif • Pro Edition',
        tier: 'Flagship Edition',
        isPremium: true,
        price: 175000,
        priceFormatted: '175.000',
        unit: '/ 1 Stel',
        tagline: 'Kualitas authentic pro dengan Logo 3D Rubber, kerah bebas, & Exclusive Hard Box.',
        images: {
            front: '/landing/models/premium-front.png',
            side: '/landing/models/premium-side.png',
            back: '/landing/models/premium-back.png',
        },
        highlights: [
            'Setelan Baju + Celana',
            'Full Printing Depan, Belakang, Lengan & Krah',
            'Logo 3D Rubber Timbul (atau sejenisnya)',
            'Material Sponsor & Nama Bebas Request',
            'Model Kerah Bebas Pilih Sesuai Selera',
            'Packing Plastic Zipper + Hard Box + Gift Card',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'Setelan Atas Bawah (1 Stel Siap Pakai Pro Edition)' },
            { label: 'Pilihan Bahan', value: 'Dryfit Premium Grade A (Milano, Jarum, Benzema, Rhabit, dll)' },
            { label: 'Teknik Printing', value: 'Badan depan, badan belakang, krah, dan lengan Full Printing' },
            { label: 'Logo Badge', value: 'Logo 3D Rubber timbul atau yang sejenisnya' },
            { label: 'Sponsor & Nameset', value: 'Sablon Polyflex Premium / DTF atau material boleh request khusus' },
            { label: 'Model Kerah', value: 'Collar (krah) bebas pilih model sesuai selera' },
            { label: 'Celana Olahraga', value: 'Kain warna (max 2 warna) + sablon Polyflex Premium / DTF' },
            { label: 'Packaging Eksklusif', value: 'Plastic zipper + Kardus/Hard Box Eksklusif + Gift Card' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Jersey Premium (Rp 175.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
];

export const INCLUDES = [
    'Baju + celana (1 stel)',
    'Bahan dri-fit premium',
    'Full printing',
    'Desain gratis',
    'Nama & nomor punggung',
    'Logo tim & sponsor',
];

export const SIZE_FEES = [
    { size: 'S – XL', fee: 'Harga normal' },
    { size: '2XL', fee: '+Rp10.000' },
    { size: '3XL', fee: '+Rp20.000' },
    { size: '4XL', fee: '+Rp30.000' },
];

export const BONUS_EXAMPLES = [
    { order: 12, get: 13 },
    { order: 24, get: 26 },
    { order: 36, get: 39 },
];

export const STEPS = [
    {
        title: 'Konsultasi',
        text: 'Chat via WhatsApp. Kirim konsep, logo, dan perkiraan jumlah order.',
    },
    {
        title: 'Desain & DP 50%',
        text: 'Kami buatkan desainnya. Setelah desain disetujui, bayar DP 50% untuk mulai produksi.',
    },
    {
        title: 'Produksi',
        text: 'Proses cetak, potong, dan jahit sekitar 1–2 minggu.',
    },
    {
        title: 'Pelunasan & Kirim',
        text: 'Lunasi sisa pembayaran, lalu jersey dikirim atau diambil di workshop.',
    },
];

export const PORTFOLIO = [
    { img: '/landing/web/pf-history-maker.webp', name: 'History Maker', tall: true },
    { img: '/landing/web/pf-stemsend.webp', name: 'Stemsend — SMKN 2 Klaten' },
    { img: '/landing/web/pf-aksara.webp', name: 'Aksara' },
    { img: '/landing/web/pf-musaka.webp', name: 'Musaka 1971', tall: true },
    { img: '/landing/web/pf-uny-back.webp', name: 'Stemsend × UNY' },
    { img: '/landing/web/pf-muhi.webp', name: 'MUHI' },
    { img: '/landing/web/pf-record.webp', name: 'Record Breaker', tall: true },
    { img: '/landing/web/pf-reborn.webp', name: 'Reborn' },
    { img: '/landing/web/pf-smaga.webp', name: 'SMAGA Klaten' },
    { img: '/landing/web/pf-musaka-action.webp', name: 'Musaka — Match Day', tall: true },
    { img: '/landing/web/pf-payp.webp', name: 'PAYP' },
    { img: '/landing/web/pf-match.webp', name: 'Turnamen Lokal' },
];

export const CLIENTS = [
    'SMKN 2 Klaten',
    'SMKN 1 Trucuk',
    'UNY',
    'Muhammadiyah',
    'Aksara',
    'Musaka 1971',
    'BRFC',
    'SMAGA Klaten',
    'Ulil Albab',
    'Bhayanghara',
];
