const db = require('../config/database');
const { sendStaffPush, sendStaffReminderPush } = require('./pushService');

const REMINDER_INTERVAL_MS = parseInt(process.env.STAFF_REMINDER_INTERVAL_MIN || '5', 10) * 60 * 1000;
const MIN_REMINDER_GAP_MS = parseInt(process.env.STAFF_REMINDER_GAP_MIN || '8', 10) * 60 * 1000;

let lastReminderAt = 0;
let reminderRunning = false;

async function countPendingOrders() {
  const [rows] = await db.query(
    `SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'`
  );
  return rows[0]?.count ?? 0;
}

async function runOrderReminderJob() {
  if (reminderRunning) return;
  reminderRunning = true;
  try {
    const now = Date.now();
    if (now - lastReminderAt < MIN_REMINDER_GAP_MS) return;

    const pending = await countPendingOrders();
    if (pending <= 0) return;

    lastReminderAt = now;
    const result = await sendStaffReminderPush(pending);
    if (result.sent > 0) {
      console.log(`[staff-reminder] ${pending} pending orders — push sent to ${result.sent} devices`);
    }
  } catch (err) {
    console.error('[staff-reminder] error:', err.message);
  } finally {
    reminderRunning = false;
  }
}

function startOrderReminderJob() {
  if (process.env.STAFF_REMINDER_ENABLED === '0') {
    console.log('Staff order reminders: disabled');
    return;
  }
  setTimeout(runOrderReminderJob, 30000);
  setInterval(runOrderReminderJob, REMINDER_INTERVAL_MS);
  console.log(`Staff order reminders every ${REMINDER_INTERVAL_MS / 60000} min`);
}

module.exports = {
  startOrderReminderJob,
  countPendingOrders,
};
