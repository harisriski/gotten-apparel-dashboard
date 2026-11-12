'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../landing.module.css';
import { NAV_LINKS, waLink } from './data';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
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
  );
}
