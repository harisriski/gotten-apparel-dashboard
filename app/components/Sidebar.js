'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activePage, onPageChange, isOpen, onClose }) {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const navSections = [
        {
            label: 'Menu Utama',
            items: [
                { page: 'overview', icon: 'dashboard', label: 'Ringkasan' },
                { page: 'orders', icon: 'receipt_long', label: 'Pesanan' },
            ]
        },
        {
            label: 'Operasional',
            items: [
                { page: 'production', icon: 'precision_manufacturing', label: 'Produksi' },
                { page: 'inventory', icon: 'inventory_2', label: 'Inventaris' },
            ]
        },
        {
            label: 'Keuangan',
            items: [
                { page: 'finance', icon: 'account_balance_wallet', label: 'Arus Kas' },
                { page: 'customers', icon: 'groups', label: 'Pelanggan' },
            ]
        }
    ];

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (err) {
            console.error('Logout error:', err);
        }
        setLoggingOut(false);
    }

    return (
        <>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 40 40" fill="none">
                                <defs>
                                    <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                                        <stop offset="0%" stopColor="#a78bfa" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                                <rect width="40" height="40" rx="10" fill="url(#logoGrad)" opacity="0.15" />
                                <path d="M12 14 L20 10 L28 14 L28 22 L24 26 L20 22 L16 26 L12 22 Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
                                <path d="M20 16 L20 22" stroke="url(#logoGrad)" strokeWidth="2" />
                                <circle cx="20" cy="28" r="2" fill="url(#logoGrad)" />
                            </svg>
                        </div>
                        <div className="logo-text">
                            <h1>GOTTEN INDONESIA</h1>
                            <span>Apparel &amp; Convection</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navSections.map((section, i) => (
                        <div className="nav-section" key={i}>
                            <span className="nav-label">{section.label}</span>
                            {section.items.map(item => (
                                <button
                                    key={item.page}
                                    className={`nav-item ${activePage === item.page ? 'active' : ''}`}
                                    onClick={() => { onPageChange(item.page); onClose(); }}
                                >
                                    <span className="material-icons-round">{item.icon}</span>
                                    {item.label}
                                    {item.badge && (
                                        <span className={`nav-badge ${item.badgeType || ''}`}>{item.badge}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ position: 'relative' }}>
                    <div className="user-card" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="user-avatar">
                            <span className="material-icons-round">person</span>
                        </div>
                        <div className="user-info">
                            <span className="user-name">Admin</span>
                            <span className="user-role">Manager</span>
                        </div>
                        <span className="material-icons-round user-menu-icon">more_horiz</span>
                    </div>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <button className="user-dropdown-item logout" onClick={handleLogout} disabled={loggingOut}>
                                <span className="material-icons-round">logout</span>
                                {loggingOut ? 'Keluar...' : 'Keluar'}
                            </button>
                        </div>
                    )}
                </div>
            </aside>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            {showUserMenu && <div className="user-dropdown-overlay" onClick={() => setShowUserMenu(false)} />}
        </>
    );
}

