'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '../../landing.module.css';
import { JERSEY_MODELS, waLink } from './data';

const ANGLES = [
  { key: 'front', label: 'Depan' },
  { key: 'side', label: 'Samping' },
  { key: 'back', label: 'Belakang' },
];

// Pick a Material icon based on the spec label.
function specIcon(label) {
  const l = label.toLowerCase();
  if (l.includes('paket')) return 'inventory_2';
  if (l.includes('bahan')) return 'texture';
  if (l.includes('kerah')) return 'dry_cleaning';
  if (l.includes('celana')) return 'checkroom';
  if (l.includes('pengemasan') || l.includes('packaging')) return 'redeem';
  if (l.includes('logo')) return 'verified';
  return 'palette';
}

export default function ModelShowcase() {
  const defaultModel = JERSEY_MODELS.find((m) => m.isPopular) || JERSEY_MODELS[0];
  const [activeId, setActiveId] = useState(defaultModel.id);
  const [angle, setAngle] = useState('front');

  const model = JERSEY_MODELS.find((m) => m.id === activeId);
  const isPremium = Boolean(model.isPremium);

  const selectModel = (id) => {
    setActiveId(id);
    setAngle('front');
  };

  return (
    <div className={styles.showcase}>
      {/* Model Tabs */}
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
              onClick={() => selectModel(m.id)}
            >
              {m.isPopular && <span className={styles.modelTabFlag}>Populer</span>}
              {m.isPremium && (
                <span className={`${styles.modelTabFlag} ${styles.modelTabFlagPremium}`}>Eksklusif</span>
              )}
              <span className={styles.modelTabName}>{m.name.replace('Jersey ', '')}</span>
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

          <div className={styles.stageImageWrap}>
            <Image
              key={`${model.id}-${angle}`}
              src={model.images[angle]}
              alt={`${model.name} tampak ${ANGLES.find((a) => a.key === angle).label.toLowerCase()}`}
              fill
              sizes="(max-width: 1024px) 90vw, 45vw"
              className={styles.stageImage}
              priority
            />
          </div>

          <div className={styles.angleThumbs}>
            {ANGLES.map((a) => (
              <button
                key={a.key}
                id={`angle-${a.key}`}
                type="button"
                className={`${styles.angleThumb} ${angle === a.key ? styles.angleThumbActive : ''}`}
                onClick={() => setAngle(a.key)}
                aria-label={`Lihat tampak ${a.label.toLowerCase()}`}
                aria-pressed={angle === a.key}
              >
                <span className={styles.angleThumbImg}>
                  <Image src={model.images[a.key]} alt="" fill sizes="56px" className={styles.angleThumbImgEl} />
                </span>
                <span className={styles.angleThumbLabel}>{a.label}</span>
              </button>
            ))}
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
