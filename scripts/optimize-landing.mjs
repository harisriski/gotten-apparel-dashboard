/**
 * Optimize landing page images.
 * Reads curated originals from public/landing and writes compressed WebP
 * copies to public/landing/web. Originals are never modified.
 *
 * Usage: node scripts/optimize-landing.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('public/landing');
const OUT = path.resolve('public/landing/web');

// [source (relative to public/landing), output name, max width]
const IMAGES = [
    // Hero & backgrounds
    ['gotten/fix/slide-1.JPG', 'hero', 2000],
    ['gotten/IMG-20230116-WA0004.jpg', 'team', 1800],

    // Production details
    ['gotten/fix/wooven.jpg', 'detail-badge', 1000],
    ['gotten/Untitled-1-04.jpg', 'detail-label', 1000],
    ['gotten/Untitled-1-02.jpg', 'detail-fabric', 1000],
    ['gotten/fix/kontak-download-tentang.jpg', 'detail-print', 1000],
    ['gotten/IMG_9619.JPG', 'detail-rack', 1000],

    // Portfolio
    ['gotten/01. History Maker_Cover.jpg', 'pf-history-maker', 900],
    ['gotten/02. Record_Cover.jpg', 'pf-record', 900],
    ['gotten/2_stemsend_black.jpg', 'pf-stemsend', 900],
    ['gotten/2_stemsend_uny.jpg', 'pf-uny-back', 900],
    ['gotten/fix/banner-01.jpg', 'pf-aksara', 900],
    ['gotten/fix/banner-02.jpg', 'pf-reborn', 900],
    ['gotten/fix/banner-03.jpg', 'pf-green', 900],
    ['gotten/MUHI BB_white.jpg', 'pf-muhi', 900],
    ['gotten/Musaka 1971.jpg', 'pf-musaka', 900],
    ['gotten/Musaka-02.jpg', 'pf-musaka-action', 900],
    ['gotten/IMG_20220827_184430_515.jpg', 'pf-smaga', 900],
    ['gotten/fix/IMG_20201027_185829.jpg', 'pf-payp', 900],
    ['gotten/Edit_RECORD BREAKER HISTORY MAKER_01-01.jpg', 'pf-record-breaker', 900],
    ['gotten/IMG_20220808_073714_199.jpg', 'pf-match', 900],
];

fs.mkdirSync(OUT, { recursive: true });

for (const [src, name, width] of IMAGES) {
    const input = path.join(SRC, src);
    const output = path.join(OUT, `${name}.webp`);
    const info = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 74 })
        .toFile(output);
    console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

// White logo for dark backgrounds (invert RGB, keep alpha)
for (const [src, name] of [
    ['GOTTEN LOGO & TEKS HITAM.png', 'logo-full-white'],
    ['GOTTEN LOGO HITAM.png', 'logo-mark-white'],
]) {
    const info = await sharp(path.join(SRC, src))
        .resize({ width: 600, withoutEnlargement: true })
        .negate({ alpha: false })
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT, `${name}.png`));
    console.log(`${name}.png  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
