/**
 * PWA Asset Generator for Brilla Prep
 * Generates all required icons, splash screens, and screenshots
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brilla brand colors
const COLORS = {
  primary: '#1e3a8a',
  primaryDark: '#0f172a',
  secondary: '#fbbf24',
  emerald: '#10b981',
  white: '#ffffff'
};

// Directory setup
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');

// Ensure directories exist
[ICONS_DIR, SPLASH_DIR, SCREENSHOTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Icon sizes for various platforms
const ICON_SIZES = [
  // Favicons
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },

  // Android/PWA icons
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },

  // Apple Touch Icons
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 152, name: 'apple-touch-icon-152x152.png' }, // iPad
  { size: 120, name: 'apple-touch-icon-120x120.png' }, // iPhone Retina

  // Maskable icons (with padding)
  { size: 192, name: 'icon-192x192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512x512-maskable.png', maskable: true },

  // Shortcut icons
  { size: 96, name: 'practice-icon.png' },
  { size: 96, name: 'dashboard-icon.png' },
  { size: 96, name: 'papers-icon.png' },
];

// iOS Splash Screen sizes (portrait only for simplicity)
const SPLASH_SCREENS = [
  // iPhone SE, 5s
  { width: 640, height: 1136, name: 'splash-640x1136.png', device: 'iPhone SE' },
  // iPhone 6, 7, 8
  { width: 750, height: 1334, name: 'splash-750x1334.png', device: 'iPhone 8' },
  // iPhone 6+, 7+, 8+
  { width: 1242, height: 2208, name: 'splash-1242x2208.png', device: 'iPhone 8 Plus' },
  // iPhone X, XS, 11 Pro
  { width: 1125, height: 2436, name: 'splash-1125x2436.png', device: 'iPhone X/11 Pro' },
  // iPhone XR, 11
  { width: 828, height: 1792, name: 'splash-828x1792.png', device: 'iPhone XR/11' },
  // iPhone XS Max, 11 Pro Max
  { width: 1242, height: 2688, name: 'splash-1242x2688.png', device: 'iPhone XS Max' },
  // iPhone 12 mini, 13 mini
  { width: 1080, height: 2340, name: 'splash-1080x2340.png', device: 'iPhone 12/13 mini' },
  // iPhone 12, 12 Pro, 13, 13 Pro, 14
  { width: 1170, height: 2532, name: 'splash-1170x2532.png', device: 'iPhone 12/13/14' },
  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  { width: 1284, height: 2778, name: 'splash-1284x2778.png', device: 'iPhone 12/13 Pro Max' },
  // iPhone 14 Pro, 15, 15 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556.png', device: 'iPhone 14 Pro/15' },
  // iPhone 14 Pro Max, 15 Plus, 15 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796.png', device: 'iPhone 14/15 Pro Max' },
  // iPad Mini, iPad 9.7"
  { width: 1536, height: 2048, name: 'splash-1536x2048.png', device: 'iPad Mini' },
  // iPad 10.2"
  { width: 1620, height: 2160, name: 'splash-1620x2160.png', device: 'iPad 10.2' },
  // iPad Pro 10.5"
  { width: 1668, height: 2224, name: 'splash-1668x2224.png', device: 'iPad Pro 10.5' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388.png', device: 'iPad Pro 11' },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732.png', device: 'iPad Pro 12.9' },
];

// Screenshot sizes
const SCREENSHOTS = [
  { width: 1280, height: 720, name: 'desktop.png', formFactor: 'wide' },
  { width: 750, height: 1334, name: 'mobile.png', formFactor: 'narrow' },
];

/**
 * Generate the base icon SVG with orbital design matching loading screen
 */
function generateIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const center = size / 2;
  const logoSize = innerSize * 0.5;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1628"/>
          <stop offset="50%" stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#0d2447"/>
        </linearGradient>
        <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="50%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <linearGradient id="logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#a7f3d0"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${size * 0.02}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.2}" fill="url(#bg)"/>

      <!-- Outer orbital ring -->
      <circle cx="${center}" cy="${center}" r="${innerSize * 0.38}" fill="none" stroke="url(#ring)" stroke-width="${size * 0.015}" opacity="0.3"/>

      <!-- Inner orbital ring -->
      <circle cx="${center}" cy="${center}" r="${innerSize * 0.28}" fill="none" stroke="url(#ring)" stroke-width="${size * 0.01}" opacity="0.2"/>

      <!-- Orbital dots -->
      <circle cx="${center}" cy="${center - innerSize * 0.38}" r="${size * 0.025}" fill="#10b981" filter="url(#glow)"/>
      <circle cx="${center + innerSize * 0.28}" cy="${center}" r="${size * 0.02}" fill="#6366f1" filter="url(#glow)"/>
      <circle cx="${center}" cy="${center + innerSize * 0.28}" r="${size * 0.015}" fill="#22d3ee" filter="url(#glow)"/>

      <!-- Center circle -->
      <circle cx="${center}" cy="${center}" r="${innerSize * 0.22}" fill="#0f172a" stroke="rgba(255,255,255,0.1)" stroke-width="${size * 0.005}"/>

      <!-- Logo B -->
      <text x="${center}" y="${center + logoSize * 0.15}"
            font-family="Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${logoSize}"
            font-weight="700"
            fill="url(#logo)"
            text-anchor="middle">B</text>

      <!-- Sparkle -->
      <circle cx="${center + innerSize * 0.25}" cy="${center - innerSize * 0.25}" r="${size * 0.02}" fill="#fbbf24" filter="url(#glow)"/>
    </svg>
  `;
}

/**
 * Generate splash screen SVG with animated-style design
 */
function generateSplashSVG(width, height) {
  const centerX = width / 2;
  const centerY = height / 2 - height * 0.05;
  const logoRadius = Math.min(width, height) * 0.12;
  const orbitRadius1 = logoRadius * 1.8;
  const orbitRadius2 = logoRadius * 1.5;
  const orbitRadius3 = logoRadius * 1.2;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1628"/>
          <stop offset="50%" stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#0d2447"/>
        </linearGradient>
        <linearGradient id="splashLogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#a7f3d0"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(16, 185, 129, 0.3)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(99, 102, 241, 0.3)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(6, 182, 212, 0.2)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <filter id="splashGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${Math.min(width, height) * 0.005}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${Math.min(width, height) * 0.02}"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#splashBg)"/>

      <!-- Floating orbs -->
      <ellipse cx="${width * 0.15}" cy="${height * 0.25}" rx="${width * 0.15}" ry="${width * 0.15}" fill="url(#orb1)" filter="url(#blur)"/>
      <ellipse cx="${width * 0.85}" cy="${height * 0.35}" rx="${width * 0.12}" ry="${width * 0.12}" fill="url(#orb2)" filter="url(#blur)"/>
      <ellipse cx="${width * 0.3}" cy="${height * 0.75}" rx="${width * 0.14}" ry="${width * 0.14}" fill="url(#orb3)" filter="url(#blur)"/>

      <!-- Outer orbital ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${orbitRadius1}" fill="none" stroke="rgba(16, 185, 129, 0.2)" stroke-width="${Math.min(width, height) * 0.003}"/>
      <circle cx="${centerX}" cy="${centerY - orbitRadius1}" r="${Math.min(width, height) * 0.012}" fill="#10b981" filter="url(#splashGlow)"/>

      <!-- Middle orbital ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${orbitRadius2}" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="${Math.min(width, height) * 0.0025}"/>
      <circle cx="${centerX + orbitRadius2}" cy="${centerY}" r="${Math.min(width, height) * 0.01}" fill="#818cf8" filter="url(#splashGlow)"/>
      <circle cx="${centerX - orbitRadius2}" cy="${centerY}" r="${Math.min(width, height) * 0.008}" fill="#22d3ee" filter="url(#splashGlow)"/>

      <!-- Inner orbital ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${orbitRadius3}" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="${Math.min(width, height) * 0.002}"/>
      <circle cx="${centerX}" cy="${centerY + orbitRadius3}" r="${Math.min(width, height) * 0.008}" fill="#fbbf24" filter="url(#splashGlow)"/>

      <!-- Center glow -->
      <circle cx="${centerX}" cy="${centerY}" r="${logoRadius * 0.9}" fill="rgba(99, 102, 241, 0.15)" filter="url(#blur)"/>

      <!-- Center circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${logoRadius}" fill="#0f172a" stroke="rgba(255,255,255,0.1)" stroke-width="${Math.min(width, height) * 0.002}"/>

      <!-- Logo B -->
      <text x="${centerX}" y="${centerY + logoRadius * 0.35}"
            font-family="Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${logoRadius * 1.1}"
            font-weight="700"
            fill="url(#splashLogo)"
            text-anchor="middle">B</text>

      <!-- Twinkling stars -->
      ${generateStars(width, height, centerX, centerY, orbitRadius1 * 1.3)}

      <!-- Brand text -->
      <text x="${centerX}" y="${centerY + logoRadius * 2.2}"
            font-family="Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${Math.min(width, height) * 0.04}"
            font-weight="700"
            fill="rgba(255,255,255,0.9)"
            text-anchor="middle"
            letter-spacing="${Math.min(width, height) * 0.003}">BRILLA</text>

      <!-- Tagline -->
      <text x="${centerX}" y="${centerY + logoRadius * 2.7}"
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${Math.min(width, height) * 0.018}"
            fill="rgba(255,255,255,0.5)"
            text-anchor="middle">Preparing your learning journey...</text>

      <!-- Loading bar background -->
      <rect x="${centerX - width * 0.12}" y="${centerY + logoRadius * 3.2}"
            width="${width * 0.24}" height="${Math.min(width, height) * 0.006}"
            rx="${Math.min(width, height) * 0.003}"
            fill="rgba(255,255,255,0.1)"/>

      <!-- Loading bar gradient -->
      <defs>
        <linearGradient id="loadingBar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="50%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
      <rect x="${centerX - width * 0.12}" y="${centerY + logoRadius * 3.2}"
            width="${width * 0.12}" height="${Math.min(width, height) * 0.006}"
            rx="${Math.min(width, height) * 0.003}"
            fill="url(#loadingBar)"/>

      <!-- Bottom wave -->
      <path d="M0,${height * 0.92} C${width * 0.25},${height * 0.95} ${width * 0.5},${height * 0.88} ${width * 0.75},${height * 0.92} C${width},${height * 0.96} ${width},${height} ${width},${height} L0,${height} Z"
            fill="rgba(16, 185, 129, 0.1)"/>
      <path d="M0,${height * 0.94} C${width * 0.3},${height * 0.97} ${width * 0.6},${height * 0.91} ${width * 0.85},${height * 0.95} C${width},${height * 0.98} ${width},${height} ${width},${height} L0,${height} Z"
            fill="rgba(99, 102, 241, 0.08)"/>
    </svg>
  `;
}

/**
 * Generate twinkling stars around the orbit
 */
function generateStars(width, height, cx, cy, radius) {
  const stars = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * Math.PI / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const size = (i % 2 === 0 ? 3 : 2) * Math.min(width, height) / 1000;
    stars.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="0.6"/>`);
  }
  return stars.join('\n      ');
}

/**
 * Generate screenshot placeholder SVG
 */
function generateScreenshotSVG(width, height, formFactor) {
  const isWide = formFactor === 'wide';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="headerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#screenBg)"/>

      <!-- Header -->
      <rect width="${width}" height="${height * 0.08}" fill="url(#headerBg)"/>
      <text x="${width * 0.05}" y="${height * 0.05}"
            font-family="Poppins, sans-serif"
            font-size="${height * 0.025}"
            font-weight="700"
            fill="white">Brilla Prep</text>

      <!-- Content cards simulation -->
      ${isWide ? generateDesktopContent(width, height) : generateMobileContent(width, height)}

      <!-- Brilla logo watermark -->
      <text x="${width / 2}" y="${height / 2}"
            font-family="Poppins, sans-serif"
            font-size="${height * 0.15}"
            font-weight="800"
            fill="rgba(30, 58, 138, 0.05)"
            text-anchor="middle">B</text>
    </svg>
  `;
}

function generateDesktopContent(width, height) {
  return `
    <!-- Sidebar -->
    <rect x="0" y="${height * 0.08}" width="${width * 0.18}" height="${height * 0.92}" fill="#1e293b"/>

    <!-- Main content area -->
    <rect x="${width * 0.2}" y="${height * 0.12}" width="${width * 0.35}" height="${height * 0.25}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
    <rect x="${width * 0.57}" y="${height * 0.12}" width="${width * 0.35}" height="${height * 0.25}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
    <rect x="${width * 0.2}" y="${height * 0.4}" width="${width * 0.72}" height="${height * 0.35}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>

    <!-- Card accents -->
    <rect x="${width * 0.2}" y="${height * 0.12}" width="${width * 0.35}" height="4" rx="2" fill="#10b981"/>
    <rect x="${width * 0.57}" y="${height * 0.12}" width="${width * 0.35}" height="4" rx="2" fill="#6366f1"/>
    <rect x="${width * 0.2}" y="${height * 0.4}" width="${width * 0.72}" height="4" rx="2" fill="#f59e0b"/>
  `;
}

function generateMobileContent(width, height) {
  return `
    <!-- Stats cards -->
    <rect x="${width * 0.05}" y="${height * 0.12}" width="${width * 0.43}" height="${height * 0.12}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
    <rect x="${width * 0.52}" y="${height * 0.12}" width="${width * 0.43}" height="${height * 0.12}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>

    <!-- Main card -->
    <rect x="${width * 0.05}" y="${height * 0.26}" width="${width * 0.9}" height="${height * 0.25}" rx="12" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>

    <!-- List items -->
    <rect x="${width * 0.05}" y="${height * 0.54}" width="${width * 0.9}" height="${height * 0.08}" rx="8" fill="white" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"/>
    <rect x="${width * 0.05}" y="${height * 0.64}" width="${width * 0.9}" height="${height * 0.08}" rx="8" fill="white" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"/>
    <rect x="${width * 0.05}" y="${height * 0.74}" width="${width * 0.9}" height="${height * 0.08}" rx="8" fill="white" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"/>

    <!-- Card accents -->
    <rect x="${width * 0.05}" y="${height * 0.12}" width="${width * 0.43}" height="3" rx="1.5" fill="#10b981"/>
    <rect x="${width * 0.52}" y="${height * 0.12}" width="${width * 0.43}" height="3" rx="1.5" fill="#6366f1"/>
    <rect x="${width * 0.05}" y="${height * 0.26}" width="${width * 0.9}" height="3" rx="1.5" fill="#f59e0b"/>

    <!-- Bottom nav -->
    <rect x="0" y="${height * 0.92}" width="${width}" height="${height * 0.08}" fill="white" filter="drop-shadow(0 -2px 4px rgba(0,0,0,0.1))"/>
  `;
}

/**
 * Convert SVG to PNG using sharp
 */
async function svgToPng(svg, outputPath, width, height) {
  try {
    await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Generated: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed: ${path.basename(outputPath)} - ${error.message}`);
  }
}

/**
 * Main generation function
 */
async function generateAssets() {
  console.log('\n🎨 Generating PWA Assets for Brilla Prep\n');
  console.log('=' .repeat(50));

  // Generate icons
  console.log('\n📱 Generating App Icons...\n');
  for (const icon of ICON_SIZES) {
    const svg = generateIconSVG(icon.size, icon.maskable);
    const outputPath = path.join(ICONS_DIR, icon.name);
    await svgToPng(svg, outputPath, icon.size, icon.size);
  }

  // Generate splash screens
  console.log('\n🌊 Generating Splash Screens...\n');
  for (const splash of SPLASH_SCREENS) {
    const svg = generateSplashSVG(splash.width, splash.height);
    const outputPath = path.join(SPLASH_DIR, splash.name);
    await svgToPng(svg, outputPath, splash.width, splash.height);
  }

  // Generate screenshots
  console.log('\n📸 Generating Screenshots...\n');
  for (const screenshot of SCREENSHOTS) {
    const svg = generateScreenshotSVG(screenshot.width, screenshot.height, screenshot.formFactor);
    const outputPath = path.join(SCREENSHOTS_DIR, screenshot.name);
    await svgToPng(svg, outputPath, screenshot.width, screenshot.height);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✨ PWA Asset Generation Complete!\n');
  console.log(`Icons: ${ICON_SIZES.length} files`);
  console.log(`Splash screens: ${SPLASH_SCREENS.length} files`);
  console.log(`Screenshots: ${SCREENSHOTS.length} files`);
  console.log(`\nTotal: ${ICON_SIZES.length + SPLASH_SCREENS.length + SCREENSHOTS.length} assets\n`);
}

// Run the generator
generateAssets().catch(console.error);
