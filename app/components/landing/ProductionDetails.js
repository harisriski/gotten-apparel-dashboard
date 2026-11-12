import Image from 'next/image';
import styles from '../../landing.module.css';
import { DETAILS } from './data';

export default function ProductionDetails() {
  return (
    <section id="produksi" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              verified
            </span>
            <span>Standar Kualitas</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Detail Produksi <span>Gotten</span>
          </h2>
          <p className={styles.sectionDesc}>
            Fokus kami pada presisi setiap jahitan, kepekatan warna sublimasi, serta kenyamanan bahan jersey saat dipakai bertanding.
          </p>
        </div>

        <div className={styles.detailsGrid}>
          {DETAILS.map((detail, idx) => (
            <div
              key={idx}
              className={`${styles.detailCard} ${detail.big ? styles.detailCardBig : styles.detailCardSmall}`}
            >
              <div className={styles.detailCardImageWrapper}>
                <Image
                  src={detail.img}
                  alt={detail.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.detailCardImg}
                />
                <span className={styles.detailCardTag}>{detail.tag}</span>
              </div>
              <div className={styles.detailCardBody}>
                <h3 className={styles.detailCardTitle}>{detail.title}</h3>
                <p className={styles.detailCardText}>{detail.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
