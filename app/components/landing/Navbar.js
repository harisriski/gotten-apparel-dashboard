'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../landing.module.css';
import { NAV_LINKS, waLink } from './data';
import OrderTrackerModal from './OrderTrackerModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={`${styles.container} ${styles.navContainer}`}>
          <Link href="/" className={styles.navLogo}>
            <Image
              src="/landing/web/logo-full-white.png"
              alt="Gotten Indonesia Logo"
              width={160}
              height={36}
              priority
              className={styles.navLogoImg}
            />
          </Link>

          <nav>
            <ul className={styles.navMenu}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.navLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.navActions}>
            <a
              href="/E-KATALOG%20JERSEY%20GOTTEN-1.pdf"
              download="E-KATALOG-JERSEY-GOTTEN-2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnNavStaff}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#dc2626',
                background: 'rgba(239, 68, 68, 0.06)',
                cursor: 'pointer',
                fontWeight: 700,
                textDecoration: 'none'
              }}
              title="Unduh E-Katalog Resmi Gotten Indonesia (PDF)"
            >
              <span className="material-icons-round" style={{ fontSize: '18px', color: '#dc2626' }}>
                picture_as_pdf
              </span>
              <span>E-Katalog</span>
            </a>

            <button
              type="button"
              onClick={() => setShowTracker(true)}
              className={styles.btnNavStaff}
              style={{
                borderColor: 'rgba(5, 150, 105, 0.4)',
                color: '#059669',
                background: 'rgba(5, 150, 105, 0.05)',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Lacak progres pesanan jersey Anda"
            >
              <span className="material-icons-round" style={{ fontSize: '18px', color: '#059669' }}>
                local_shipping
              </span>
              <span>Lacak Pesanan</span>
            </button>

            <Link href="/dashboard" className={styles.btnNavStaff}>
              <span className="material-icons-round" style={{ fontSize: '18px' }}>
                lock
              </span>
              <span>Login Staff</span>
            </Link>

            <a
              href={waLink('Halo Gotten Indonesia, saya ingin konsultasi order custom jersey.')}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
            >
              <span>Order Jersey</span>
            </a>
          </div>
        </div>
      </header>

      {/* Modal Lacak Pesanan */}
      <OrderTrackerModal
        isOpen={showTracker}
        onClose={() => setShowTracker(false)}
      />
    </>
  );
}
