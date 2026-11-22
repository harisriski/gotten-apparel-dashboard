import styles from '../../landing.module.css';
import { SIZE_FEES, BONUS_EXAMPLES } from './data';
import ModelShowcase from './ModelShowcase';
import SizeChart from './SizeChart';

export default function Pricing() {
  return (
    <section id="harga" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              sports_soccer
            </span>
            <span>5 Pilihan Model Jersey Gotten</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Pilih Model <span>Jersey Tim Anda</span>
          </h2>
          <p className={styles.sectionDesc}>
            Tersedia 5 pilihan model jersey sesuai kebutuhan dan anggaran tim Anda. Semua sudah termasuk setelan baju + celana siap tanding, bahan dryfit premium, dan gratis desain.
          </p>
        </div>

        {/* Banner E-Katalog Download Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 320px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}>
              <span className="material-icons-round" style={{ fontSize: '28px', color: '#ffffff' }}>
                picture_as_pdf
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  Official Catalog 2026
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PDF</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                E-Katalog Lengkap Jersey Gotten Indonesia
              </h3>
            </div>
          </div>

          <a
            href="/E-KATALOG%20JERSEY%20GOTTEN-1.pdf"
            download="E-KATALOG-JERSEY-GOTTEN-2025.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.75rem 1.4rem',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <span className="material-icons-round" style={{ fontSize: '20px', color: '#ef4444' }}>
              file_download
            </span>
            <span>Download E-Katalog (PDF)</span>
          </a>
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

          {/* Interactive Official Size Chart (Dewasa & Anak) */}
          <SizeChart />
        </div>
      </div>
    </section>
  );
}
