import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateOGImage() {
  // Create OG image 1200x630 with just the droplet logo and minimal white border
  const width = 1200;
  const height = 630;

  // Logo fills most of the height with minimal padding
  const padding = 40; // minimal border
  const logoSize = height - (padding * 2); // ~550px

  const logoBuffer = await sharp(join(publicDir, 'icon-512.png'))
    .resize(logoSize, logoSize)
    .toBuffer();

  // Create white background
  const svgBackground = `
    <svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
    </svg>
  `;

  await sharp(Buffer.from(svgBackground))
    .composite([
      {
        input: logoBuffer,
        top: padding,
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
