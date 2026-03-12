/**
 * Rybella - تشغيل Backend ولوحة التحكم محلياً
 * يشغّل عبر Node.js لتفادي مشاكل الأحرف العربية في المسار
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const root = __dirname;
const backendDir = path.join(root, 'backend');
const adminDir = path.join(root, 'admin-dashboard');

console.log('\n============================================');
console.log('  Rybella - التشغيل المحلي');
console.log('============================================\n');

if (!fs.existsSync(backendDir)) {
  console.error('خطأ: مجلد backend غير موجود');
  process.exit(1);
}
if (!fs.existsSync(adminDir)) {
  console.error('خطأ: مجلد admin-dashboard غير موجود');
  process.exit(1);
}

const dbDir = path.join(backendDir, 'database');
const uploadsDir = path.join(backendDir, 'uploads');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const envPath = path.join(backendDir, '.env');
const envExample = path.join(backendDir, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envPath);
  console.log('تم إنشاء backend/.env');
}

// تحرير المنفذ 5000 إن كان مشغولاً (إغلاق عملية سابقة)
if (os.platform() === 'win32') {
  try {
    const { execSync } = require('child_process');
    const out = execSync('netstat -ano', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const line = out.split('\n').find((l) => l.includes(':5000') && l.includes('LISTENING'));
    const match = line ? line.match(/(\d+)\s*$/) : null;
    if (match) {
      execSync(`taskkill /F /PID ${match[1]}`, { stdio: 'ignore' });
      console.log('تم إيقاف العملية السابقة على المنفذ 5000\n');
    }
  } catch (e) {}
}

// تثبيت الحزم إن لم تكن منصبة
if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
  console.log('تثبيت Backend...');
  require('child_process').spawnSync('npm', ['install'], { cwd: backendDir, stdio: 'inherit', shell: true });
}
if (!fs.existsSync(path.join(adminDir, 'node_modules'))) {
  console.log('تثبيت لوحة التحكم...');
  require('child_process').spawnSync('npm', ['install'], { cwd: adminDir, stdio: 'inherit', shell: true });
}

// على Windows: استخدام launchers داخل المشروع (لا نمرر المسار لـ CMD)
if (os.platform() === 'win32') {
  const backendLauncher = path.join(root, 'launch_backend.js');
  const adminLauncher = path.join(root, 'launch_admin.js');
  spawn('cmd', ['/c', 'start', 'Rybella Backend', 'cmd', '/k', 'node', backendLauncher], { cwd: root, shell: false });
  setTimeout(() => {
    spawn('cmd', ['/c', 'start', 'Rybella Admin', 'cmd', '/k', 'node', adminLauncher], { cwd: root, shell: false });
  }, 2500);
  setTimeout(() => {
    spawn('cmd', ['/c', 'start', 'http://localhost:3001'], { shell: true });
    console.log('\nتم فتح نافذتين: Backend + لوحة التحكم');
    console.log('لوحة التحكم: http://localhost:3001');
    console.log('API: http://localhost:5000/api/health\n');
  }, 6000);
} else {
  const backend = spawn('node', ['server.js'], { cwd: backendDir, stdio: 'inherit', shell: true });
  setTimeout(() => {
    spawn('npm', ['run', 'dev'], { cwd: adminDir, stdio: 'inherit', shell: true });
  }, 3000);
}
