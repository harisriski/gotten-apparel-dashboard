'use client';

import { useState } from 'react';
import styles from '../../landing.module.css';
import { ADULT_SIZE_CHART, KIDS_SIZE_CHART } from './data';

export default function SizeChart() {
  const [activeTab, setActiveTab] = useState('dewasa'); // 'dewasa' | 'anak'

  return (
    <div id="size-chart" className={styles.sizeChartCard}>
      {/* Header Size Chart */}
      <div className={styles.sizeChartHeader}>
        <div className={styles.sizeChartHeaderLeft}>
          <div className={styles.badgeHeader} style={{ marginBottom: '0.6rem' }}>
            <span className="material-icons-round" style={{ fontSize: '16px' }}>straighten</span>
            <span>Standar Pola Gotten</span>
          </div>
          <h3 className={styles.sizeChartTitle}>
            Panduan Ukuran <span>(Size Chart Resmi)</span>
          </h3>
          <p className={styles.sizeChartSubtitle}>
            Gunakan panduan lebar dada dan panjang baju di bawah ini untuk memastikan setiap anggota tim mendapatkan ukuran yang pas dan nyaman saat bertanding.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.sizeChartTabs}>
          <button
            type="button"
            className={`${styles.sizeTabBtn} ${activeTab === 'dewasa' ? styles.sizeTabBtnActive : ''}`}
            onClick={() => setActiveTab('dewasa')}
          >
            <span className="material-icons-round">person</span>
            <span>Ukuran Dewasa</span>
          </button>
          <button
            type="button"
            className={`${styles.sizeTabBtn} ${activeTab === 'anak' ? styles.sizeTabBtnActive : ''}`}
            onClick={() => setActiveTab('anak')}
          >
            <span className="material-icons-round">child_care</span>
            <span>Ukuran Anak</span>
          </button>
        </div>
      </div>

      {/* Content Layout: Visual Diagram (Left) & Interactive Table (Right) */}
      <div className={styles.sizeChartBody}>
        {/* Left Column: Visual Diagram */}
        <div className={styles.sizeVisualCard}>
          <div className={styles.sizeVisualTitle}>
            <span className="material-icons-round">design_services</span>
            <span>Titik Ukur Jersey</span>
          </div>

          <div className={styles.svgWrapper}>
            <svg
              viewBox="0 0 400 420"
              className={styles.jerseySvg}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Jersey Body Background */}
              <defs>
                <linearGradient id="jerseyGrad" x1="200" y1="40" x2="200" y2="385" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" />
                  <stop offset="1" stopColor="#f1f5f9" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#059669" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* Jersey Silhouette Path */}
              <path
                d="M 165 44 
                   L 80 85 
                   L 40 160 
                   L 90 185 
                   L 120 160 
                   L 120 375 
                   Q 200 388 280 375 
                   L 280 160 
                   L 310 185 
                   L 360 160 
                   L 320 85 
                   L 235 44 
                   Q 200 56 165 44 Z"
                fill="url(#jerseyGrad)"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Collar Back & V-Neck Detail */}
              <path
                d="M 165 44 Q 200 56 235 44"
                stroke="#94a3b8"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 165 44 L 200 100 L 235 44"
                stroke="#94a3b8"
                strokeWidth="2.5"
                fill="#f8fafc"
              />

              {/* Inner Seam Lines */}
              <path d="M 120 160 L 80 85" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 280 160 L 320 85" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* ── MEASUREMENT LINE: LEBAR DADA (Horizontal) ── */}
              <g filter="url(#glowEffect)">
                {/* Horizontal guide line across armpits */}
                <line
                  x1="120"
                  y1="175"
                  x2="280"
                  y2="175"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
                {/* End Markers */}
                <circle cx="120" cy="175" r="4" fill="#10b981" />
                <circle cx="280" cy="175" r="4" fill="#10b981" />
                <path d="M 126 170 L 120 175 L 126 180" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M 274 170 L 280 175 L 274 180" stroke="#10b981" strokeWidth="2" fill="none" />
              </g>

              {/* Badge Label Lebar Dada */}
              <rect x="150" y="158" width="100" height="32" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
              <text x="200" y="178" fill="#059669" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
                LEBAR DADA
              </text>

              {/* ── MEASUREMENT LINE: PANJANG BADAN (Vertical) ── */}
              <g filter="url(#glowEffect)">
                {/* Vertical guide line from high shoulder point down to hem */}
                <line
                  x1="200"
                  y1="108"
                  x2="200"
                  y2="380"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
                {/* End Markers */}
                <circle cx="200" cy="108" r="4" fill="#0284c7" />
                <circle cx="200" cy="380" r="4" fill="#0284c7" />
                <path d="M 195 114 L 200 108 L 205 114" stroke="#0284c7" strokeWidth="2" fill="none" />
                <path d="M 195 374 L 200 380 L 205 374" stroke="#0284c7" strokeWidth="2" fill="none" />
              </g>

              {/* Badge Label Panjang Badan */}
              <rect x="140" y="240" width="120" height="32" rx="6" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
              <text x="200" y="260" fill="#0284c7" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
                PANJANG BADAN
              </text>
            </svg>
          </div>

          <div className={styles.sizeGuideNotes}>
            <div className={styles.guideStep}>
              <span className={styles.guideStepDot} style={{ background: '#10b981' }} />
              <div>
                <strong>Lebar:</strong> Ukur mendatar dari ketiak kiri ke ketiak kanan.
              </div>
            </div>
            <div className={styles.guideStep}>
              <span className={styles.guideStepDot} style={{ background: '#38bdf8' }} />
              <div>
                <strong>Panjang:</strong> Ukur lurus dari titik pundak leher ke ujung bawah kaos.
              </div>
            </div>
            <div className={styles.guideTolerance}>
              <span className="material-icons-round" style={{ fontSize: '15px', color: '#f59e0b' }}>info</span>
              <span>Toleransi ukuran jahitan konveksi ±1 s/d 1.5 cm.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Size Table with Active Tab */}
        <div className={styles.sizeTableCard}>
          <div className={styles.tableCategoryHeader}>
            <div className={styles.categoryInfo}>
              <span className="material-icons-round" style={{ color: '#10b981' }}>
                {activeTab === 'dewasa' ? 'sports_kabaddi' : 'escalator_warning'}
              </span>
              <div>
                <h4 className={styles.tableCategoryTitle}>
                  {activeTab === 'dewasa' ? 'Tabel Ukuran Jersey Dewasa' : 'Tabel Ukuran Jersey Anak'}
                </h4>
                <p className={styles.tableCategorySubtitle}>
                  {activeTab === 'dewasa'
                    ? 'Pola standar atletik Indonesia, nyaman untuk gerak aktif & tanding.'
                    : 'Pola khusus anak usia balita hingga remaja (2 s/d 13 tahun).'}
                </p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className={styles.tableResponsive}>
            {activeTab === 'dewasa' ? (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Size</th>
                    <th style={{ width: '26%' }}>Lebar Dada</th>
                    <th style={{ width: '26%' }}>Panjang</th>
                    <th style={{ width: '26%', textAlign: 'right' }}>Biaya Kain</th>
                  </tr>
                </thead>
                <tbody>
                  {ADULT_SIZE_CHART.map((row, idx) => (
                    <tr key={idx} className={row.fee !== 'Normal' ? styles.jumboRow : ''}>
                      <td className={styles.colSize}>
                        <span className={styles.sizeTag}>{row.size}</span>
                      </td>
                      <td className={styles.colVal}>
                        <strong>{row.width}</strong> <span className={styles.unit}>cm</span>
                      </td>
                      <td className={styles.colVal}>
                        <strong>{row.length}</strong> <span className={styles.unit}>cm</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {row.fee === 'Normal' ? (
                          <span className={styles.feeNormalBadge}>Harga Normal</span>
                        ) : (
                          <span className={styles.feeJumboBadge}>{row.fee}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Size</th>
                    <th style={{ width: '32%' }}>Estimasi Usia</th>
                    <th style={{ width: '24%' }}>Lebar Dada</th>
                    <th style={{ width: '24%' }}>Panjang</th>
                  </tr>
                </thead>
                <tbody>
                  {KIDS_SIZE_CHART.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.colSize}>
                        <span className={`${styles.sizeTag} ${styles.sizeTagKids}`}>{row.size}</span>
                      </td>
                      <td className={styles.colAge}>
                        <span className="material-icons-round" style={{ fontSize: '14px', color: '#38bdf8', marginRight: '4px', verticalAlign: 'middle' }}>
                          cake
                        </span>
                        <span>{row.age}</span>
                      </td>
                      <td className={styles.colVal}>
                        <strong>{row.width}</strong> <span className={styles.unit}>cm</span>
                      </td>
                      <td className={styles.colVal}>
                        <strong>{row.length}</strong> <span className={styles.unit}>cm</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Bottom Footnote */}
          <div className={styles.tableFootnote}>
            <span className="material-icons-round" style={{ fontSize: '16px', color: '#10b981' }}>verified</span>
            <span>
              {activeTab === 'dewasa'
                ? 'Ukuran di atas 4XL (5XL, 6XL, dst.) tetap dilayani dengan kenaikan pola standar +2 cm dan kelipatan biaya +Rp10.000.'
                : 'Tips: Jika anak bertubuh lebih berisi atau tinggi, disarankan memilih 1 tingkat ukuran di atas estimasi usianya.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
