import styles from '../../landing.module.css';
import { SIZE_FEES, BONUS_EXAMPLES } from './data';
import ModelShowcase from './ModelShowcase';

export default function Pricing() {
  return (
    <section id="harga" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              sports_soccer
            </span>
            <span>4 Pilihan Model Jersey Gotten</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Pilih Model <span>Jersey Tim Anda</span>
          </h2>
          <p className={styles.sectionDesc}>
            Tersedia 4 pilihan model jersey sesuai kebutuhan dan anggaran tim Anda. Semua sudah termasuk setelan baju + celana siap tanding, bahan dryfit premium, dan gratis desain.
          </p>
        </div>

        {/* 4 Models Showcase (tabs + split panel) */}
        <ModelShowcase />

        {/* Additional Info Cards: Bonus Promo & Sizes & Terms */}
        <div className={styles.pricingExtrasGrid}>
          {/* Bonus Promo Box */}
          <div className={styles.bonusPromoBoxWide}>
            <div className={styles.bonusPromoHeader}>
              <span className={`material-icons-round ${styles.bonusPromoIcon}`}>card_giftcard</span>
              <div>
                <h4>Bonus Berlaku Kelipatan untuk Semua Model!</h4>
                <p>Minimal order 12 pcs langsung dapat bonus 1 pcs gratis:</p>
              </div>
            </div>
            <div className={styles.bonusPillList}>
              {BONUS_EXAMPLES.map((b, i) => (
                <span key={i} className={styles.bonusPill}>
                  Order {b.order} pcs → Dapat {b.get} pcs
                </span>
              ))}
            </div>
          </div>

          <div className={styles.pricingExtrasColumns}>
            {/* Size Table Card */}
            <div className={styles.pricingInfoCard}>
              <h3 className={styles.infoCardTitle}>
                <span className={`material-icons-round ${styles.infoCardTitleIcon}`}>straighten</span>
                <span>Biaya Ukuran</span>
              </h3>
              <table className={styles.sizeTable}>
                <tbody>
                  {SIZE_FEES.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.sizeName}>{row.size}</td>
                      <td className={`${styles.sizeFee} ${idx === 0 ? styles.sizeFeeNormal : ''}`}>
                        {row.fee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.sizeNote}>
                * Biaya tambahan +Rp10.000 berlaku kelipatan untuk setiap kenaikan satu tingkat di atas XL. Berlaku untuk seluruh model jersey.
              </div>
            </div>

            {/* Quick Terms & DP */}
            <div className={styles.pricingInfoCard}>
              <h3 className={styles.infoCardTitle}>
                <span className={`material-icons-round ${styles.infoCardTitleIcon}`}>verified</span>
                <span>Ketentuan Order & Garansi</span>
              </h3>
              <ul className={styles.quickTermsList}>
                <li className={styles.quickTermItem}>
                  <span className={`material-icons-round ${styles.checkIcon}`}>savings</span>
                  <span>
                    <strong>Sistem DP 50%:</strong> Pembayaran uang muka sebesar 50% di awal setelah acc desain untuk mulai proses produksi.
                  </span>
                </li>
                <li className={styles.quickTermItem}>
                  <span className={`material-icons-round ${styles.checkIcon}`}>schedule</span>
                  <span>
                    <strong>Estimasi Produksi Cepat:</strong> Pengerjaan sekitar <strong>1–2 minggu</strong> sejak DP diterima dan detail ukuran fix.
                  </span>
                </li>
                <li className={styles.quickTermItem}>
                  <span className={`material-icons-round ${styles.checkIcon}`}>local_shipping</span>
                  <span>
                    <strong>Pelunasan & Pengiriman:</strong> Sisa 50% dilunasi saat pesanan selesai. Siap kirim ke seluruh Indonesia atau ambil langsung di workshop Klaten.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
