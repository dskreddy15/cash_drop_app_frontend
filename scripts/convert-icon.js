const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise use a fallback
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Sharp library not found. Installing...');
  console.error('Please run: npm install sharp --save-dev');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const inputFile = path.join(publicDir, 'menchies-icon.jpg');
const output192 = path.join(publicDir, 'icon-192x192.png');
const output512 = path.join(publicDir, 'icon-512x512.png');

async function convertIcon() {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: ${inputFile} not found!`);
      process.exit(1);
    }

    console.log('Converting icon to PNG format...');
    
    // Create 192x192 PNG icon
    await sharp(inputFile)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(output192);
    
    console.log('✓ Created icon-192x192.png');

    // Create 512x512 PNG icon
    await sharp(inputFile)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(output512);
    
    console.log('✓ Created icon-512x512.png');
    
    console.log('\n✅ Icon conversion complete!');
    console.log('Icons created:');
    console.log('  - icon-192x192.png');
    console.log('  - icon-512x512.png');
    
  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

convertIcon();
