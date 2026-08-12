/**
 * Brilla Brand Asset Generator
 *
 * Single source of truth for the brand mark: the "Brilla orb" —
 * a green → lime → gold → amber → orange gradient circle with a white
 * bold letterform, matching the founder-approved logo (brilla.png).
 *
 * Generates:
 *   - favicons, PWA icons, maskable icons, apple-touch-icons, shortcut icons
 *   - iOS splash screens (light, clean, on-brand)
 *   - Telegram channel profile images (platform + St John's pilot)
 *
 * Store screenshots in public/screenshots are intentionally NOT regenerated
 * here; they are marketing captures, not brand marks.
 *
 * Run: node scripts/generate-pwa-assets.cjs
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brilla brand palette
const BRAND = {
  green: '#3FAE4A',
  lime: '#8DC63F',
  gold: '#F6D123',
  amber: '#F9A825',
  orange: '#F5871F',
  deepGreen: '#14532D',   // wordmark / text on light
  softText: '#6B7F74',    // tagline on light
  paper: '#FFFDF7',       // light brand background (splash, loader, maskable)
  white: '#ffffff',
};

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');
const BRANDING_DIR = path.join(PUBLIC_DIR, 'branding');

[ICONS_DIR, SPLASH_DIR, BRANDING_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  // Apple touch icons: white tile, orb at 84% (iOS applies its own mask)
  { size: 180, name: 'apple-touch-icon.png', bg: BRAND.white, orbScale: 0.84 },
  { size: 167, name: 'apple-touch-icon-167x167.png', bg: BRAND.white, orbScale: 0.84 },
  { size: 152, name: 'apple-touch-icon-152x152.png', bg: BRAND.white, orbScale: 0.84 },
  { size: 120, name: 'apple-touch-icon-120x120.png', bg: BRAND.white, orbScale: 0.84 },
  // Maskable: paper background, orb at 60% (inside the 80% safe zone)
  { size: 192, name: 'icon-192x192-maskable.png', bg: BRAND.paper, orbScale: 0.6 },
  { size: 512, name: 'icon-512x512-maskable.png', bg: BRAND.paper, orbScale: 0.6 },
  // App shortcuts
  { size: 96, name: 'practice-icon.png', bg: BRAND.white, orbScale: 0.84 },
  { size: 96, name: 'dashboard-icon.png', bg: BRAND.white, orbScale: 0.84 },
  { size: 96, name: 'papers-icon.png', bg: BRAND.white, orbScale: 0.84 },
];

const SPLASH_SCREENS = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  { width: 828, height: 1792, name: 'splash-828x1792.png' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
  { width: 1080, height: 2340, name: 'splash-1080x2340.png' },
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  { width: 1620, height: 2160, name: 'splash-1620x2160.png' },
  { width: 1668, height: 2224, name: 'splash-1668x2224.png' },
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
];

const TELEGRAM_IMAGES = [
  // Platform community: full-bleed orb (Telegram crops a circle — the orb IS the circle)
  { name: 'telegram-channel-brilla.png', letter: 'B', bg: null, orbScale: 1 },
  // St John's pilot channel: orb on white with the school's monogram
  { name: 'telegram-channel-stjohns.png', letter: 'SJ', bg: BRAND.white, orbScale: 0.8 },
];

function gradientDefs() {
  return `
    <linearGradient id="orb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND.green}"/>
      <stop offset="30%" stop-color="${BRAND.lime}"/>
      <stop offset="55%" stop-color="${BRAND.gold}"/>
      <stop offset="80%" stop-color="${BRAND.amber}"/>
      <stop offset="100%" stop-color="${BRAND.orange}"/>
    </linearGradient>
    <radialGradient id="sheen" cx="32%" cy="26%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>`;
}

/**
 * The brand orb as a standalone SVG.
 * letter: 'B' (platform) or 'SJ' (St John's). bg: tile color or null (transparent).
 */
function orbSVG(size, { letter = 'B', bg = null, orbScale = 1 } = {}) {
  const c = size / 2;
  const r = (size / 2) * orbScale;
  const fs = letter.length > 1 ? r * 0.78 : r * 1.17;
  const y = c + fs * 0.35;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradientDefs()}</defs>
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#orb)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#sheen)"/>
  <text x="${c}" y="${y}"
        font-family="Poppins, Arial, Helvetica, sans-serif"
        font-size="${fs}"
        font-weight="800"
        fill="#ffffff"
        text-anchor="middle">${letter}</text>
</svg>`;
}

/**
 * iOS splash screen: light paper background, brand orb, wordmark, tagline,
 * faint concentric rings and soft color blooms. Matches the in-app initial
 * loader so the PWA launch handoff is seamless.
 */
function splashSVG(width, height) {
  const min = Math.min(width, height);
  const cx = width / 2;
  const cy = height * 0.42;
  const R = min * 0.13;                 // orb radius
  const fs = R * 1.17;                  // B font size
  const wordmarkY = cy + R + min * 0.105;
  const taglineY = wordmarkY + min * 0.052;
  const barY = taglineY + min * 0.055;
  const barW = min * 0.24;
  const barH = Math.max(min * 0.008, 5);
  const blur = min * 0.02;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientDefs()}
    <radialGradient id="warmGlow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${BRAND.gold}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${BRAND.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${BRAND.green}"/>
      <stop offset="50%" stop-color="${BRAND.gold}"/>
      <stop offset="100%" stop-color="${BRAND.orange}"/>
    </linearGradient>
    <filter id="soft" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="${blur}"/>
    </filter>
  </defs>

  <!-- Paper background + warm center glow -->
  <rect width="${width}" height="${height}" fill="${BRAND.paper}"/>
  <rect width="${width}" height="${height}" fill="url(#warmGlow)"/>

  <!-- Soft color blooms -->
  <circle cx="${width * 0.12}" cy="${height * 0.16}" r="${min * 0.14}" fill="${BRAND.green}" opacity="0.10" filter="url(#soft)"/>
  <circle cx="${width * 0.9}" cy="${height * 0.3}" r="${min * 0.11}" fill="${BRAND.gold}" opacity="0.12" filter="url(#soft)"/>
  <circle cx="${width * 0.18}" cy="${height * 0.82}" r="${min * 0.12}" fill="${BRAND.orange}" opacity="0.09" filter="url(#soft)"/>
  <circle cx="${width * 0.86}" cy="${height * 0.88}" r="${min * 0.1}" fill="${BRAND.lime}" opacity="0.10" filter="url(#soft)"/>

  <!-- Faint concentric rings -->
  <circle cx="${cx}" cy="${cy}" r="${R * 1.45}" fill="none" stroke="${BRAND.green}" stroke-opacity="0.16" stroke-width="${min * 0.003}"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 1.8}" fill="none" stroke="${BRAND.amber}" stroke-opacity="0.12" stroke-width="${min * 0.0025}"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 2.15}" fill="none" stroke="${BRAND.orange}" stroke-opacity="0.08" stroke-width="${min * 0.002}"/>

  <!-- Brand orb -->
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#orb)"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#sheen)"/>
  <text x="${cx}" y="${cy + fs * 0.35}"
        font-family="Poppins, Arial, Helvetica, sans-serif"
        font-size="${fs}"
        font-weight="800"
        fill="#ffffff"
        text-anchor="middle">B</text>

  <!-- Wordmark + tagline -->
  <text x="${cx}" y="${wordmarkY}"
        font-family="Poppins, Arial, Helvetica, sans-serif"
        font-size="${min * 0.068}"
        font-weight="800"
        fill="${BRAND.deepGreen}"
        text-anchor="middle"
        letter-spacing="${min * 0.002}">Brilla Prep</text>
  <text x="${cx}" y="${taglineY}"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="${min * 0.026}"
        fill="${BRAND.softText}"
        text-anchor="middle"
        letter-spacing="${min * 0.004}">Learn. Practice. Shine.</text>

  <!-- Brand bar -->
  <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="url(#bar)"/>
</svg>`;
}

async function svgToPng(svg, outputPath, width, height) {
  try {
    await sharp(Buffer.from(svg)).resize(width, height).png().toFile(outputPath);
    console.log(`  ✓ ${path.relative(PUBLIC_DIR, outputPath)}`);
  } catch (error) {
    console.error(`  ✗ ${path.basename(outputPath)} - ${error.message}`);
    process.exitCode = 1;
  }
}

async function generateAssets() {
  console.log('\n🎨 Brilla brand asset generation (orb identity)\n');

  console.log('📱 Icons');
  for (const icon of ICON_SIZES) {
    const svg = orbSVG(icon.size, { bg: icon.bg ?? null, orbScale: icon.orbScale ?? 1 });
    await svgToPng(svg, path.join(ICONS_DIR, icon.name), icon.size, icon.size);
  }

  console.log('\n🌅 Splash screens');
  for (const s of SPLASH_SCREENS) {
    await svgToPng(splashSVG(s.width, s.height), path.join(SPLASH_DIR, s.name), s.width, s.height);
  }

  console.log('\n✈️  Telegram channel images');
  for (const t of TELEGRAM_IMAGES) {
    const svg = orbSVG(1024, { letter: t.letter, bg: t.bg, orbScale: t.orbScale });
    await svgToPng(svg, path.join(BRANDING_DIR, t.name), 1024, 1024);
  }

  console.log(`\n✨ Done: ${ICON_SIZES.length} icons, ${SPLASH_SCREENS.length} splash screens, ${TELEGRAM_IMAGES.length} Telegram images\n`);
}

generateAssets().catch(err => { console.error(err); process.exit(1); });
