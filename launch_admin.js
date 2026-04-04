/**
 * Rybella Admin Launcher - uses __dirname so no Arabic path issues in CMD
 */
const path = require('path');
const { spawnSync } = require('child_process');

const adminDir = path.join(__dirname, 'admin-dashboard');
require('child_process').spawnSync('npm', ['run', 'dev'], {
  cwd: adminDir,
  stdio: 'inherit',
  shell: true,
});
