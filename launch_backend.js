/**
 * Rybella Backend Launcher - uses __dirname so no Arabic path issues in CMD
 */
const path = require('path');
const { spawnSync } = require('child_process');

const backendDir = path.join(__dirname, 'backend');
require('child_process').spawnSync('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});
