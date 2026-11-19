'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/image';
import NextLink from 'next/link';
import Image from 'next/image';
import OrderTracker from '../components/landing/OrderTracker';
import Footer from '../components/landing/Footer';
import FloatingWA from '../components/landing/FloatingWA';
import styles from '../landing.module.css';

function LacakContent() {
    const searchParams = useSearchParams();
    const idFromUrl = searchParams.get('id') || '';

    return (
        <div style={{ minHeight: '80vh', padding: '2rem 1rem 4rem' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto 2rem', textAlign: 'center' }}>
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 1rem',
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: '#059669',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem'
                }}>
                    <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>verified</span>
                    Sistem Pelacakan Resmi Gotten Apparel
                </span>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '-0.02em'
                }}>
                    Pantau Progres Pesanan Jersey Tim Anda
                </h1>
                <p style={{
                    fontSize: '0.95rem',
                    color: '#64748b',
                    maxWidth: '560px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    Transparansi penuh mulai dari antrean bahan, cutting, printing, jahit hingga jersey selesai dipacking dan dikirim ke lokasi Anda.
                </p>
            </div>

            <OrderTracker initialOrderId={idFromUrl} />
        </div>
    );
}

export default function LacakPage() {
    return (
        <main className={styles.landingRoot} style={{ background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Mini / Navbar untuk Halaman Lacak */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0.85rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <NextLink href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <Image
                            src="/landing/web/logo-full-white.png"
                            alt="Gotten Indonesia Logo"
                            width={140}
                            height={32}
                            priority
                            style={{
                                filter: 'invert(1) grayscale(1) contrast(100)',
                                height: 'auto',
                                width: '130px'
                            }}
                        />
                    </NextLink>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <NextLink
                            href="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.5rem 0.95rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#475569',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff'
                            }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>arrow_back</span>
                            Kembali ke Beranda
                        </NextLink>

                        <NextLink
                            href="/dashboard"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.5rem 0.95rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#0f172a',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc'
                            }}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.1rem' }}>lock</span>
                            Login Staff
                        </NextLink>
                    </div>
                </div>
            </header>

            {/* Konten Utama dengan Suspense */}
            <Suspense fallback={
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <span className="material-icons-round" style={{ fontSize: '2.5rem', animation: 'spin 1s infinite linear', color: '#059669' }}>
                            sync
                        </span>
                        <div style={{ marginTop: '0.75rem', fontWeight: 600 }}>Memuat pelacakan pesanan...</div>
                    </div>
                </div>
            }>
                <LacakContent />
            </Suspense>

            <Footer />
            <FloatingWA />
        </main>
    );
}
