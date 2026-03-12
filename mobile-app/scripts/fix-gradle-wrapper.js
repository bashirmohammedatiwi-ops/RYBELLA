/**
 * Fix gradle-wrapper.jar - ClassNotFoundException: GradleWrapperMain
 * Downloads Gradle distribution and extracts gradle-wrapper.jar using Node (no PowerShell).
 * Run: node scripts/fix-gradle-wrapper.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');

const GRADLE_URL = 'https://services.gradle.org/distributions/gradle-8.3-bin.zip';
const MIN_ZIP_BYTES = 50 * 1024 * 1024; // ~50 MB - real file is ~100MB
const WRAPPER_DIR = path.join(__dirname, '..', 'android', 'gradle', 'wrapper');
const TEMP_DIR = path.join(os.tmpdir(), 'gradle-wrapper-fix');

function download(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const protocol = url.protocol === 'https:' ? https : http;
    const file = path.join(TEMP_DIR, 'gradle.zip');
    const stream = fs.createWriteStream(file);

    const req = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        const loc = res.headers.location;
        if (loc) {
          stream.close();
          fs.unlink(file, () => {});
          download(loc).then(resolve).catch(reject);
          return;
        }
      }
      if (res.statusCode !== 200) {
        stream.close();
        fs.unlink(file, () => {});
        reject(new Error('Download failed: HTTP ' + res.statusCode));
        return;
      }
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        const stat = fs.statSync(file);
        if (stat.size < MIN_ZIP_BYTES) {
          fs.unlink(file, () => {});
          reject(new Error('Download too small (' + stat.size + ' bytes). Check your connection.'));
          return;
        }
        resolve(file);
      });
    });
    req.on('error', (err) => {
      stream.close();
      try { fs.unlinkSync(file); } catch (_) {}
      reject(err);
    });
  });
}

function extractZip(zipPath) {
  const extractTo = path.join(TEMP_DIR, 'extracted');
  if (!fs.existsSync(extractTo)) fs.mkdirSync(extractTo, { recursive: true });
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
  return extractTo;
}

function findWrapperJar(dir) {
  const gradleDir = fs.readdirSync(dir).find((n) => n.startsWith('gradle-'));
  if (!gradleDir) return null;
  const libPath = path.join(dir, gradleDir, 'lib');
  if (!fs.existsSync(libPath)) return null;
  const jar = fs.readdirSync(libPath).find((n) => n.startsWith('gradle-wrapper'));
  return jar ? path.join(libPath, jar) : null;
}

async function main() {
  console.log('Fixing gradle-wrapper.jar...');
  if (!fs.existsSync(WRAPPER_DIR)) {
    console.error('android/gradle/wrapper not found. Run npx expo prebuild first.');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    console.log('Downloading Gradle 8.3 (this may take a few minutes)...');
    const zipPath = await download(GRADLE_URL);
    const stat = fs.statSync(zipPath);
    console.log('Downloaded', Math.round(stat.size / 1024 / 1024) + ' MB');

    console.log('Extracting...');
    const extracted = extractZip(zipPath);
    const wrapperJar = findWrapperJar(extracted);
    if (!wrapperJar) {
      console.error('Could not find gradle-wrapper in distribution');
      process.exit(1);
    }
    const destPath = path.join(WRAPPER_DIR, 'gradle-wrapper.jar');
    fs.copyFileSync(wrapperJar, destPath);
    console.log('gradle-wrapper.jar updated successfully.');
  } catch (err) {
    console.error('Fix failed:', err.message);
    process.exit(1);
  } finally {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (_) {}
  }
}

main();
