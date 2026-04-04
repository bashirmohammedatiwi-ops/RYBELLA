/**
 * Generates placeholder assets for Expo - downloads from placehold.co (no extra deps)
 * Run: node scripts/generate-assets.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Color #E91E63 (Rybella pink)
const COLOR = 'E91E63';

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, { headers: { 'User-Agent': 'Node' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
  });
}

async function generate() {
  const files = [
    { url: `https://placehold.co/1024x1024/${COLOR}/FFFFFF.png`, name: 'icon.png' },
    { url: `https://placehold.co/1024x1024/${COLOR}/FFFFFF.png`, name: 'adaptive-icon.png' },
    { url: `https://placehold.co/1284x2778/${COLOR}/FFFFFF.png`, name: 'splash.png' },
  ];
  for (const f of files) {
    await download(f.url, path.join(assetsDir, f.name));
    console.log('Created', f.name);
  }
  console.log('All assets created successfully!');
}

generate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
