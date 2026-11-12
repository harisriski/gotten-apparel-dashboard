import Image from 'next/image';
import styles from '../../landing.module.css';
import { waLink } from './data';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroBg}>
        <Image
          src="/landing/web/hero.webp"
          alt="Jersey Gotten Detail Fabric & Print"
          fill
          priority
          className={styles.heroBgImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGridLines} />
      </div>

      <div className={`${styles.container} ${styles.heroContent}`}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          <span>Klaten Sportswear Specialist • Est. 2018</span>
        </div>

        <div className={styles.heroTagline}>
          <span>Record Breaker • History Maker</span>
        </div>

        <h1 className={styles.heroHeadline}>
          Custom Jersey <br />
          <span className={styles.heroHeadlineGradient}>Dri-Fit 1 Stel</span>
        </h1>

        <p className={styles.heroDescription}>
          Spesialis pembuatan jersey olahraga full printing berkualitas premium untuk tim, sekolah, kampus, dan instansi.
          Bahan <strong>dri-fit original</strong>, jahitan rapi, dan warna tahan lama langsung dari workshop Klaten.
        </p>

        <div className={styles.heroCtas}>
          <a
            href={waLink('Halo Gotten Indonesia, saya ingin pesan jersey tim kami.')}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPrimary}
          >
            <span className="material-icons-round">chat</span>
            <span>Pesan via WhatsApp</span>
          </a>

          <a href="#harga" className={styles.btnSecondary}>
            <span className="material-icons-round">sports_soccer</span>
            <span>Lihat 4 Model & Harga</span>
          </a>
        </div>
      </div>
    </section>
  );
}
