import Image from 'next/image';
import styles from '../../landing.module.css';
import { PORTFOLIO, CLIENTS } from './data';

export default function Portfolio() {
  return (
    <section id="portofolio" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              sports_soccer
            </span>
            <span>Hasil Produksi</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Portofolio <span>Jersey Tim</span>
          </h2>
          <p className={styles.sectionDesc}>
            Beberapa jersey tim olahraga, sekolah, dan komunitas yang telah kami produksi di workshop Gotten Klaten.
          </p>
        </div>

        {/* Athletic Mosaic Grid */}
        <div className={styles.portfolioGrid}>
          {PORTFOLIO.map((item, idx) => (
            <div
              key={idx}
              className={`${styles.portfolioItem} ${item.tall ? styles.portfolioItemTall : ''}`}
            >
              <Image
                src={item.img}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className={styles.portfolioImg}
              />
              <div className={styles.portfolioOverlay}>
                <h3 className={styles.portfolioName}>{item.name}</h3>
                <span className={styles.portfolioClientBadge}>Custom Dri-Fit</span>
              </div>
            </div>
          ))}
        </div>

        {/* Client pills list */}
        <div className={styles.clientsWrapper}>
          <div className={styles.clientsTitle}>Klien & Komunitas yang Telah Mempercayakan Produksinya:</div>
          <div className={styles.clientPills}>
            {CLIENTS.map((client, i) => (
              <span key={i} className={styles.clientPill}>
                {client}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
