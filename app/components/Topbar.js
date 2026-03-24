'use client';

import { useEffect, useState } from 'react';

const pageTitles = {
    overview: { title: 'Ringkasan Keuangan', subtitle: 'Selamat datang kembali! Berikut ringkasan keuangan bisnis Anda.' },
    orders: { title: 'Pesanan', subtitle: 'Kelola pesanan dan lacak status pembayaran.' },
    finance: { title: 'Arus Kas', subtitle: 'Pantau pemasukan, pengeluaran, dan profit bisnis Anda.' },
    customers: { title: 'Pelanggan', subtitle: 'Data pelanggan dan riwayat transaksi.' },
    production: { title: 'Produksi', subtitle: 'Pantau pipeline produksi dari desain hingga packing.' },
    inventory: { title: 'Inventaris', subtitle: 'Kelola stok bahan baku dan produk jadi.' },
};

export default function Topbar({ activePage, onMenuToggle, onSearch }) {
    const [dateStr, setDateStr] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const now = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    }, []);

    function toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('gotten-theme', next);
    }

    function handleSearch(e) {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.length >= 2 && onSearch) {
            onSearch(value);
        }
    }

    const info = pageTitles[activePage] || pageTitles.overview;

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="menu-toggle" onClick={onMenuToggle}>
                    <span className="material-icons-round">menu</span>
                </button>
                <div className="page-title-area">
                    <h2>{info.title}</h2>
                    <p className="page-subtitle">{info.subtitle}</p>
                </div>
            </div>

            <div className="topbar-right">
                <div className="search-box">
                    <span className="material-icons-round">search</span>
                    <input
                        type="text"
                        placeholder="Cari pesanan..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>

                <button className="topbar-btn">
                    <span className="material-icons-round">notifications</span>
                    <span className="notif-dot"></span>
                </button>

                <div className="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
                    <span className="material-icons-round theme-icon dark">dark_mode</span>
                    <div className="toggle-track">
                        <div className="toggle-thumb"></div>
                    </div>
                    <span className="material-icons-round theme-icon light">light_mode</span>
                </div>

                <div className="date-display">
                    <span className="material-icons-round">calendar_today</span>
                    <span>{dateStr}</span>
                </div>
            </div>
        </header>
    );
}
