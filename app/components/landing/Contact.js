import styles from '../../landing.module.css';
import { ADDRESS, MAPS_LINK, MAPS_EMBED, HOURS, WA_DISPLAY, waLink, INSTAGRAM } from './data';

export default function Contact() {
  return (
    <section id="kontak" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badgeHeader}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>
              location_on
            </span>
            <span>Workshop & Kontak</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Hubungi <span>Gotten</span>
          </h2>
          <p className={styles.sectionDesc}>
            Konsultasikan ide desain jersey Anda secara online via WhatsApp atau langsung kunjungi workshop kami di Klaten.
          </p>
        </div>

        <div className={styles.contactGrid}>
          {/* Info Card */}
          <div className={styles.contactInfoCard}>
            <div>
              <h3 className={styles.contactBlockTitle}>Informasi Workshop</h3>

              <div className={styles.contactDetailsList}>
                <div className={styles.contactRow}>
                  <div className={styles.contactRowIcon}>
                    <span className="material-icons-round">place</span>
                  </div>
                  <div>
                    <div className={styles.contactRowLabel}>Alamat Workshop</div>
                    <div className={styles.contactRowValue}>{ADDRESS}</div>
                  </div>
                </div>

                <div className={styles.contactRow}>
                  <div className={styles.contactRowIcon}>
                    <span className="material-icons-round">schedule</span>
                  </div>
                  <div>
                    <div className={styles.contactRowLabel}>Jam Operasional</div>
                    <div className={styles.contactRowValue}>{HOURS}</div>
                  </div>
                </div>

                <div className={styles.contactRow}>
                  <div className={styles.contactRowIcon}>
                    <span className="material-icons-round">chat</span>
                  </div>
                  <div>
                    <div className={styles.contactRowLabel}>WhatsApp Pemesanan</div>
                    <div className={styles.contactRowValue}>
                      <a
                        href={waLink('Halo Gotten Indonesia, saya ingin bertanya tentang pemesanan jersey.')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {WA_DISPLAY}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instagram links */}
            <div className={styles.igBlock}>
              <div className={styles.igTitle}>Akun Media Sosial Resmi:</div>
              <div className={styles.igList}>
                {INSTAGRAM.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.igCard}
                  >
                    <span className="material-icons-round" style={{ color: '#e1306c', fontSize: '24px' }}>
                      photo_camera
                    </span>
                    <div>
                      <div className={styles.igCardHandle}>{item.handle}</div>
                      <div className={styles.igCardRole}>{item.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Google Map */}
          <div className={styles.contactMapCard}>
            <iframe
              src={MAPS_EMBED}
              className={styles.mapIframe}
              loading="lazy"
              title="Peta Lokasi Gotten Apparel Klaten"
            />
            <div className={styles.mapCardFooter}>
              <span className={styles.mapAddressShort}>Kecamatan Wedi, Klaten, Jawa Tengah</span>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnOpenMaps}
              >
                <span>Buka di Google Maps</span>
                <span className="material-icons-round" style={{ fontSize: '16px' }}>
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
