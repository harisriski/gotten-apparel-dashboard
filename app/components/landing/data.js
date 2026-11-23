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
    { href: '#size-chart', label: 'Size Chart' },
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
        id: 'classical-one',
        name: 'Classical One',
        badge: 'Retro & Minimalis',
        tier: 'Value Choice',
        price: 100000,
        priceFormatted: '100.000',
        unit: '/ 1 Stel',
        tagline: 'Setelan atas bawah atasan kain non-print warna dengan kombinasi elegan.',
        image: '/landing/gotten/fix/Landing Page/Package Option/CLASSICAL ONE.png',
        highlights: [
            'Setelan Atas Bawah',
            'Bahan Dryfit Grade A (Milano Grade A / Micro)',
            'Atasan Kain Non Print (Warna Kain Max. 3)',
            'Collar (Krah) Tipe B',
            'Celana Kain Warna & Polyflex',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'SETELAN ATAS BAWAH' },
            { label: 'Pilihan Bahan', value: 'BAHAN DRYFIT GRADE A (MILANO GRADE A / MICRO)' },
            { label: 'Cetak Atasan', value: 'ATASAN KAIN NON PRINT' },
            { label: 'Warna Kain', value: 'WARNA KAIN MAX. 3' },
            { label: 'Model Kerah', value: 'COLLAR (KRAH) TIPE B' },
            { label: 'Celana Olahraga', value: 'CELANA KAIN WARNA & POLYFLEX' },
            { label: 'Pengemasan', value: 'PACKING PLASTIC ZIPPER' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Classical One (Rp 100.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'half-print',
        name: 'Half Print',
        badge: 'Best Value',
        tier: 'Popular Choice',
        price: 120000,
        priceFormatted: '120.000',
        unit: '/ 1 Stel',
        tagline: 'Badan depan full print bebas motif dengan kombinasi badan belakang kain warna.',
        image: '/landing/gotten/fix/Landing Page/Package Option/HALF PRINT.png',
        highlights: [
            'Setelan Atas Bawah',
            'Bahan Dryfit Grade A (Milano Grade A / Micro)',
            'Badan Depan Print (Motif & Desain Bebas)',
            'Badan Belakang Kain Warna',
            'Nama dan Nomor Polyflex',
            'Collar (Krah) Tipe B',
            'Celana Kain Warna & Polyflex',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'SETELAN ATAS BAWAH' },
            { label: 'Pilihan Bahan', value: 'BAHAN DRYFIT GRADE A (MILANO GRADE A / MICRO)' },
            { label: 'Badan Depan', value: 'BADAN DEPAN PRINT' },
            { label: 'Badan Belakang', value: 'BADAN BELAKANG KAIN WARNA' },
            { label: 'Nama & Nomor', value: 'NAMA DAN NOMOR POLYFLEX' },
            { label: 'Kustomisasi Desain', value: 'MOTIF, WARNA, DAN DESAIN SESUAI KEINGINAN' },
            { label: 'Model Kerah', value: 'COLLAR (KRAH) TIPE B' },
            { label: 'Celana Olahraga', value: 'CELANA KAIN WARNA & POLYFLEX' },
            { label: 'Pengemasan', value: 'PACKING PLASTIC ZIPPER' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Half Print (Rp 120.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'full-print-atasan',
        name: 'Full Print Atasan',
        badge: 'Paling Populer',
        tier: 'Best Seller',
        isPopular: true,
        price: 140000,
        priceFormatted: '140.000',
        unit: '/ 1 Stel',
        tagline: 'Atasan full print depan belakang bebas motif dan warna. Pilihan nomor satu turnamen & tim.',
        image: '/landing/gotten/fix/Landing Page/Package Option/FULL PRINT ATASAN.png',
        highlights: [
            'Setelan Atas Bawah',
            'Bahan Dryfit Grade A (Milano Grade A / Micro)',
            'Atasan Full Print (Depan, Belakang, Lengan, Krah)',
            'Motif, Warna, & Desain 100% Bebas',
            'Collar (Krah) Tipe B',
            'Celana Kain Warna & Polyflex',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'SETELAN ATAS BAWAH' },
            { label: 'Pilihan Bahan', value: 'BAHAN DRYFIT GRADE A (MILANO GRADE A / MICRO)' },
            { label: 'Cetak Atasan', value: 'ATASAN FULL PRINT' },
            { label: 'Kustomisasi Desain', value: 'MOTIF, WARNA, DAN DESAIN SESUAI KEINGINAN' },
            { label: 'Model Kerah', value: 'COLLAR (KRAH) TIPE B' },
            { label: 'Celana Olahraga', value: 'CELANA KAIN WARNA & POLYFLEX' },
            { label: 'Pengemasan', value: 'PACKING PLASTIC ZIPPER' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Full Print Atasan (Rp 140.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'full-print-atas-bawah',
        name: 'Full Print Atas Bawah',
        badge: 'Full Graphic',
        tier: 'Full Graphic Set',
        price: 170000,
        priceFormatted: '170.000',
        unit: '/ 1 Stel',
        tagline: 'Atasan dan celana full printing menyeluruh dengan motif menyatu sempurna.',
        image: '/landing/gotten/fix/Landing Page/Package Option/FULL PRINT ATAS BAWAH.png',
        highlights: [
            'Setelan Atas Bawah',
            'Bahan Dryfit Grade A (Milano Grade A / Micro)',
            'Atasan Full Print',
            'Celana Full Print',
            'Motif, Warna, & Desain 100% Bebas',
            'Collar (Krah) Tipe B',
            'Celana Kain Warna & Polyflex',
            'Packing Plastic Zipper',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'SETELAN ATAS BAWAH' },
            { label: 'Pilihan Bahan', value: 'BAHAN DRYFIT GRADE A (MILANO GRADE A / MICRO)' },
            { label: 'Cetak Atasan', value: 'ATASAN FULL PRINT' },
            { label: 'Cetak Celana', value: 'CELANA FULL PRINT' },
            { label: 'Kustomisasi Desain', value: 'MOTIF, WARNA, DAN DESAIN SESUAI KEINGINAN' },
            { label: 'Model Kerah', value: 'COLLAR (KRAH) TIPE B' },
            { label: 'Celana Olahraga', value: 'CELANA KAIN WARNA & POLYFLEX' },
            { label: 'Pengemasan', value: 'PACKING PLASTIC ZIPPER' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Paket Full Print Atas Bawah (Rp 170.000/stel). Mohon info konsultasi desain dan pemesanannya.',
    },
    {
        id: 'premium-package',
        name: 'Premium Package',
        badge: 'Eksklusif • Pro Edition',
        tier: 'Flagship Edition',
        isPremium: true,
        price: 200000,
        priceFormatted: '200.000',
        unit: '/ 1 Stel',
        tagline: 'Bahan Dryfit Jacquard timbul mewah, Logo 3D (Rubber/Tatami/Woven), dan Kardus Eksklusif.',
        image: '/landing/gotten/fix/Landing Page/Package Option/PREMIUM PACKAGE.png',
        highlights: [
            'Setelan Atas Bawah',
            'Bahan Dryfit Jacquard Premium (Timbul)',
            'Atasan Full Print (Celana Opsional)',
            'Logo 3D (Rubber, Tatami, Woven)',
            'Sponsor, Nama, Nomor Polyprint',
            'Collar (Krah) Tipe B',
            'Packing Plastic Zipper + Kardus Exclusive',
        ],
        specs: [
            { label: 'Tipe Paket', value: 'SETELAN ATAS BAWAH' },
            { label: 'Pilihan Bahan', value: 'BAHAN DRYFIT JACQUARD PREMIUM (BAHAN SEDIKIT TIMBUL DENGAN MOTIF JACQUARD)' },
            { label: 'Cetak Atasan', value: 'ATASAN FULL PRINT' },
            { label: 'Cetak Celana', value: 'CELANA FULL PRINT (OPSIONAL)' },
            { label: 'Logo Badge', value: 'LOGO 3D (RUBBER, TATAMI, WOVEN)' },
            { label: 'Sponsor & Nameset', value: 'SPONSOR, NAMA, NOMOR POLYPRINT' },
            { label: 'Kustomisasi Desain', value: 'MOTIF, WARNA, DAN DESAIN SESUAI KEINGINAN' },
            { label: 'Model Kerah', value: 'COLLAR (KRAH) TIPE B' },
            { label: 'Pengemasan', value: 'PACKING PLASTIC ZIPPER+KARDUS EXCLUSIF' },
        ],
        waMessage: 'Halo Gotten Indonesia, saya ingin pesan Premium Package (Rp 200.000/stel). Mohon info konsultasi desain dan pemesanannya.',
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

export const ADULT_SIZE_CHART = [
    { size: 'S', width: 48, length: 66, fee: 'Normal' },
    { size: 'M', width: 50, length: 68, fee: 'Normal' },
    { size: 'L', width: 52, length: 70, fee: 'Normal' },
    { size: 'XL', width: 54, length: 72, fee: 'Normal' },
    { size: '2XL', width: 56, length: 74, fee: '+Rp10.000' },
    { size: '3XL', width: 58, length: 76, fee: '+Rp20.000' },
    { size: '4XL', width: 60, length: 78, fee: '+Rp30.000' },
];

export const KIDS_SIZE_CHART = [
    { size: 'XS', age: '2 – 3 Tahun', width: 32, length: 38 },
    { size: 'S', age: '4 – 5 Tahun', width: 34, length: 42 },
    { size: 'M', age: '6 – 7 Tahun', width: 36, length: 49 },
    { size: 'L', age: '8 – 9 Tahun', width: 39, length: 52 },
    { size: 'XL', age: '10 – 11 Tahun', width: 42, length: 55 },
    { size: 'XXL', age: '12 – 13 Tahun', width: 44, length: 58 },
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
