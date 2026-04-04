/**
 * Fix for Expo "node:sea" Windows path error
 * Colon (:) is invalid in Windows folder names
 * Run: node scripts/fix-node-sea-windows.js
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const nodeModules = path.join(rootDir, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('node_modules not found - skipping fix');
  process.exit(0);
}

function findAndPatch(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findAndPatch(full);
    } else if ((e.name === 'externals.js' || e.name === 'externals.ts' || e.name.endsWith('externals.js')) && full.includes('expo') || full.includes('metro')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('node:sea') && !content.includes('node_sea')) {
        content = content.replace(/node:sea/g, 'node_sea');
        fs.writeFileSync(full, content);
        console.log('Patched:', full);
      }
    }
  }
}

try {
  findAndPatch(nodeModules);
  console.log('Fix applied. Try building again.');
} catch (err) {
  console.error('Fix failed:', err.message);
  process.exit(1);
}
