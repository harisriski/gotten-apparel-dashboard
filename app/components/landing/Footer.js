import Link from 'next/link';
import Image from 'next/image';
import styles from '../../landing.module.css';
import { NAV_LINKS } from './data';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <Image
              src="/landing/web/logo-full-white.png"
              alt="Gotten Indonesia Logo"
              width={140}
              height={32}
              className={styles.footerLogo}
            />
            <p className={styles.footerTagline}>
              Record Breaker, History Maker. Konveksi dan spesialis custom jersey olahraga Klaten sejak 2018.
            </p>
          </div>

          <ul className={styles.footerLinks}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li>
              <Link href="/lacak" style={{ color: '#059669', fontWeight: 600 }}>
                Lacak Pesanan
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: '#64748b' }}>
                Dashboard Staff
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerBottom}>
          <div>
            &copy; {new Date().getFullYear()} Gotten Indonesia (Gotten Apparel). All rights reserved.
          </div>
          <div>Klaten, Jawa Tengah — Made with Dedication</div>
        </div>
      </div>
    </footer>
  );
}
