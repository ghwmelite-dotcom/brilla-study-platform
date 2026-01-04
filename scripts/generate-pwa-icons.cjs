const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

// Maskable icons need extra padding (safe zone is 80% of icon)
const maskableSizes = [
  { name: 'icon-192x192-maskable.png', size: 192 },
  { name: 'icon-512x512-maskable.png', size: 512 },
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons with Ghana colors...\n');

  // Generate regular icons
  for (const { name, size } of sizes) {
    const outputPath = path.join(iconsDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate maskable icons with padding
  for (const { name, size } of maskableSizes) {
    const outputPath = path.join(iconsDir, name);
    const innerSize = Math.round(size * 0.8); // 80% for safe zone
    const padding = Math.round((size - innerSize) / 2);

    // Create icon with padding for maskable
    const resizedIcon = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 5, g: 8, b: 7, alpha: 1 } // #050807 background
      }
    })
      .composite([{
        input: resizedIcon,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${name} (${size}x${size} maskable)`);
  }

  // Also generate apple-touch-icon
  const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log(`✓ Generated apple-touch-icon.png (180x180)`);

  console.log('\n✨ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
