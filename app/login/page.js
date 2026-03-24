'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Apply dark theme
        const theme = localStorage.getItem('gotten-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Login gagal');
            }
        } catch (err) {
            setError('Terjadi kesalahan. Coba lagi.');
        }

        setLoading(false);
    }

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb login-bg-orb-1"></div>
                <div className="login-bg-orb login-bg-orb-2"></div>
                <div className="login-bg-orb login-bg-orb-3"></div>
                <div className="login-bg-grid"></div>
            </div>

            <div className={`login-container ${mounted ? 'login-mounted' : ''}`}>
                {/* Logo Section */}
                <div className="login-logo-section">
                    <div className="login-logo-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <defs>
                                <linearGradient id="loginGrad" x1="0" y1="0" x2="48" y2="48">
                                    <stop offset="0%" stopColor="#a78bfa" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            <rect width="48" height="48" rx="14" fill="url(#loginGrad)" opacity="0.15" />
                            <path d="M14 34V14h4l6 10 6-10h4v20h-4V21l-6 10-6-10v13h-4z" fill="url(#loginGrad)" />
                        </svg>
                    </div>
                    <h1 className="login-brand">GOTTEN INDONESIA</h1>
                    <p className="login-brand-sub">APPAREL & CONVECTION</p>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <div className="login-card-header">
                        <h2>Selamat Datang</h2>
                        <p>Masuk ke dashboard untuk melanjutkan</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error">
                                <span className="material-icons-round">error_outline</span>
                                {error}
                            </div>
                        )}

                        <div className="login-field">
                            <label htmlFor="username">Username</label>
                            <div className="login-input-wrapper">
                                <span className="material-icons-round login-input-icon">person</span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                    required
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <div className="login-input-wrapper">
                                <span className="material-icons-round login-input-icon">lock</span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="login-toggle-pw"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    <span className="material-icons-round">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round">login</span>
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="login-footer">
                    &copy; 2026 Gotten Indonesia. All rights reserved.
                </p>
            </div>
        </div>
    );
}
