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
                            <img
                                src="/logo gotten fix.png"
                                alt="Gotten Logo"
                                style={{ borderRadius: '8px' }}
                            />
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

