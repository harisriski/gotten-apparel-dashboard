import styles from '../../landing.module.css';
import { STATS } from './data';

export default function Stats() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {STATS.map((item, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.statValue}>
                <span className={styles.statValueAccent}>{item.prefix}</span>
                <span>{item.value}</span>
                <span className={styles.statValueAccent}>{item.suffix}</span>
              </div>
              <div className={styles.statLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
