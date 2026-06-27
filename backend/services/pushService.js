const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const db = require('../config/database');

const VAPID_FILE = path.join(__dirname, '../data/vapid.json');

function loadVapidKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  try {
    if (fs.existsSync(VAPID_FILE)) {
      return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[push] Failed reading VAPID file:', e.message);
  }
  const keys = webpush.generateVAPIDKeys();
  fs.mkdirSync(path.dirname(VAPID_FILE), { recursive: true });
  fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
  console.warn('[push] Generated VAPID keys at', VAPID_FILE, '- set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in production');
  return keys;
}

let vapidKeys = null;

function ensureVapid() {
  if (!vapidKeys) {
    vapidKeys = loadVapidKeys();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@rybella.iq',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
  return vapidKeys;
}

function getPublicKey() {
  return ensureVapid().publicKey;
}

async function sendWebPush(subscriptionJson, payload) {
  ensureVapid();
  const subscription = typeof subscriptionJson === 'string'
    ? JSON.parse(subscriptionJson)
    : subscriptionJson;
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

async function sendExpoPush(tokens, title, body, data = {}) {
  if (!tokens.length) return { sent: 0, failed: 0 };
  const unique = [...new Set(tokens.filter(Boolean))];
  const messages = unique.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  let sent = 0;
  let failed = 0;
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    const json = await res.json().catch(() => ({}));
    const tickets = Array.isArray(json.data) ? json.data : [];
    for (const ticket of tickets) {
      if (ticket.status === 'ok') sent += 1;
      else failed += 1;
    }
    if (!tickets.length && !res.ok) failed += chunk.length;
  }
  return { sent, failed };
}

async function sendPushForNotification(title, message, notificationId) {
  const [rows] = await db.query('SELECT id, token, platform, endpoint FROM push_tokens');
  if (!rows.length) {
    return { total: 0, sent: 0, failed: 0, web: 0, mobile: 0 };
  }

  const payload = {
    title,
    message,
    body: message,
    notificationId,
    url: '/notifications',
  };

  let webSent = 0;
  let webFailed = 0;
  const expoTokens = [];

  for (const row of rows) {
    if (row.platform === 'web') {
      try {
        await sendWebPush(row.token, payload);
        webSent += 1;
      } catch (err) {
        webFailed += 1;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.query('DELETE FROM push_tokens WHERE id = ?', [row.id]);
        }
      }
    } else {
      expoTokens.push(row.token);
    }
  }

  const expoResult = await sendExpoPush(expoTokens, title, message, {
    notificationId,
    url: '/notifications',
  });

  return {
    total: rows.length,
    sent: webSent + expoResult.sent,
    failed: webFailed + expoResult.failed,
    web: webSent,
    mobile: expoResult.sent,
  };
}

module.exports = {
  getPublicKey,
  sendPushForNotification,
};
