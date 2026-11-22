'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '../../landing.module.css';
import { JERSEY_MODELS, waLink } from './data';

// Pick a Material icon based on the spec label.
function specIcon(label) {
  const l = label.toLowerCase();
  if (l.includes('paket') || l.includes('setelan')) return 'inventory_2';
  if (l.includes('bahan')) return 'texture';
  if (l.includes('kerah') || l.includes('collar')) return 'dry_cleaning';
  if (l.includes('celana')) return 'checkroom';
  if (l.includes('pengemasan') || l.includes('packing')) return 'redeem';
  if (l.includes('logo')) return 'verified';
  if (l.includes('sponsor') || l.includes('nama')) return 'badge';
  if (l.includes('desain') || l.includes('kustomisasi')) return 'auto_awesome';
  if (l.includes('warna')) return 'color_lens';
  if (l.includes('cetak') || l.includes('atasan') || l.includes('print')) return 'brush';
  return 'palette';
}

export default function ModelShowcase() {
  const defaultModel = JERSEY_MODELS.find((m) => m.isPopular) || JERSEY_MODELS[0];
  const [activeId, setActiveId] = useState(defaultModel.id);

  const model = JERSEY_MODELS.find((m) => m.id === activeId) || defaultModel;
  const isPremium = Boolean(model.isPremium);

  return (
    <div className={styles.showcase}>
      {/* Model Tabs (5 Packages) */}
      <div className={styles.modelTabs} role="tablist" aria-label="Pilih model jersey">
        {JERSEY_MODELS.map((m) => {
          const active = m.id === activeId;
          const cls = [
            styles.modelTab,
            active ? styles.modelTabActive : '',
            active && m.isPremium ? styles.modelTabActivePremium : '',
          ].join(' ');
          return (
            <button
              key={m.id}
              id={`tab-${m.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="model-panel"
              className={cls}
              onClick={() => setActiveId(m.id)}
            >
              {m.isPopular && <span className={styles.modelTabFlag}>Populer</span>}
              {m.isPremium && (
                <span className={`${styles.modelTabFlag} ${styles.modelTabFlagPremium}`}>Eksklusif</span>
              )}
              <span className={styles.modelTabName}>{m.name}</span>
              <span className={styles.modelTabPrice}>Rp {m.priceFormatted}</span>
            </button>
          );
        })}
      </div>

      {/* Showcase Panel */}
      <div
        id="model-panel"
        role="tabpanel"
        aria-labelledby={`tab-${model.id}`}
        className={`${styles.showcasePanel} ${isPremium ? styles.showcasePanelPremium : ''}`}
      >
        {/* Left: Photo Stage */}
        <div className={styles.stage}>
          <span className={styles.stageBadge}>
            <span className="material-icons-round">
              {model.isPremium ? 'workspace_premium' : model.isPopular ? 'local_fire_department' : 'sell'}
            </span>
            {model.badge}
          </span>

          <div className={styles.stageImageWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              key={model.id}
              src={model.image}
              alt={`${model.name} Setelan Jersey Gotten Indonesia`}
              fill
              sizes="(max-width: 1024px) 90vw, 45vw"
              style={{
                objectFit: 'contain',
                objectPosition: 'center center',
                padding: '1.5rem',
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.08))'
              }}
              priority
            />
          </div>

          {/* Indicator Info Setelan Lengkap */}
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0f172a' }}>
              👕 Tampak Depan
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0f172a' }}>
              🔄 Tampak Belakang
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0f172a' }}>
              🩳 Celana Lengkap
            </span>
          </div>
        </div>

        {/* Right: Info */}
        <div className={styles.info} key={model.id}>
          <span className={styles.infoTier}>{model.tier}</span>
          <h3 className={styles.infoName}>{model.name}</h3>
          <p className={styles.infoTagline}>{model.tagline}</p>

          <div className={styles.infoPrice}>
            <span className={styles.infoCurrency}>Rp</span>
            <span className={styles.infoPriceNumber}>{model.priceFormatted}</span>
            <span className={styles.infoPriceUnit}>{model.unit}</span>
            <span className={styles.infoPriceNote}>
              Baju + celana
              <br />
              siap tanding
            </span>
          </div>

          <ul className={styles.specGrid}>
            {model.specs.map((s) => (
              <li key={s.label} className={styles.specItem}>
                <span className={`material-icons-round ${styles.specIcon}`}>{specIcon(s.label)}</span>
                <div>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.infoActions}>
            <a
              id={`order-${model.id}`}
              href={waLink(model.waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnPrimary} ${isPremium ? styles.btnPremium : ''}`}
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
            >
              <span className="material-icons-round">chat</span>
              <span>Pesan {model.name} via WhatsApp</span>
            </a>
            <div className={styles.infoMeta}>
              <span><span className="material-icons-round">check</span>Gratis desain</span>
              <span><span className="material-icons-round">check</span>Nama &amp; nomor punggung</span>
              <span><span className="material-icons-round">check</span>Bonus tiap 12 pcs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
