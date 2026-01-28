import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateOGImage() {
  // Create OG image 1200x630 with centered smaller logo
  const logoSize = 200;
  const logoBuffer = await sharp(join(publicDir, 'icon-512.png'))
    .resize(logoSize, logoSize)
    .toBuffer();

  // Create background with gradient effect (solid color for simplicity)
  const width = 1200;
  const height = 630;

  // Create a gradient-like background using SVG
  const svgBackground = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="${width/2}" y="${height - 100}"
            font-family="Arial, sans-serif"
            font-size="48"
            font-weight="bold"
            fill="white"
            text-anchor="middle">BP Cleaning</text>
      <text x="${width/2}" y="${height - 45}"
            font-family="Arial, sans-serif"
            font-size="28"
            fill="rgba(255,255,255,0.9)"
            text-anchor="middle">Gestione Magazzino</text>
    </svg>
  `;

  await sharp(Buffer.from(svgBackground))
    .composite([
      {
        input: logoBuffer,
        top: Math.floor((height - logoSize) / 2) - 50,
        left: Math.floor((width - logoSize) / 2),
      }
    ])
    .png()
    .toFile(join(publicDir, 'og-image.png'));

  console.log('✓ OG image created: public/og-image.png');
}

async function generateFavicon() {
  // Generate favicon.ico from the existing icon
  // Create multiple sizes for favicon
  const icon32 = await sharp(join(publicDir, 'icon-512.png'))
    .resize(32, 32)
    .png()
    .toBuffer();

  const icon16 = await sharp(join(publicDir, 'icon-512.png'))
    .resize(16, 16)
    .png()
    .toBuffer();

  // For simplicity, save as 32x32 PNG (browsers support PNG favicons)
  await sharp(join(publicDir, 'icon-512.png'))
    .resize(32, 32)
    .toFile(join(publicDir, 'favicon-32.png'));

  console.log('✓ Favicon PNG created: public/favicon-32.png');

  // Copy to src/app as well for Next.js
  await sharp(join(publicDir, 'icon-512.png'))
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '..', 'src', 'app', 'icon.png'));

  console.log('✓ App icon created: src/app/icon.png');
}

async function main() {
  try {
    await generateOGImage();
    await generateFavicon();
    console.log('\n✅ All images generated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
