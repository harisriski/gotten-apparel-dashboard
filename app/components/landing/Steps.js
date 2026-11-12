import styles from '../../landing.module.css';
import { STEPS } from './data';

export default function Steps() {
  return (
    <section id="cara-pesan" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              route
            </span>
            <span>Alur Praktis</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Cara Pesan <span>Mudah & Cepat</span>
          </h2>
          <p className={styles.sectionDesc}>
            Proses pemesanan transparan dari konsultasi awal hingga jersey siap pakai di lapangan.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((step, idx) => (
            <div key={idx} className={styles.stepCard}>
              <div className={styles.stepNumber}>0{idx + 1}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
