const db = require('../config/database');
const { getPublicKey, sendPushForNotification } = require('../services/pushService');

async function fanOutToCustomers(notificationId) {
  const [users] = await db.query("SELECT id FROM users WHERE role = 'customer'");
  for (const user of users) {
    await db.query(
      'INSERT OR IGNORE INTO user_notifications (user_id, notification_id) VALUES (?, ?)',
      [user.id, notificationId]
    );
  }
}

exports.getAll = async (req, res) => {
  try {
    const [notifications] = await db.query(`
      SELECT n.*,
        (SELECT COUNT(*) FROM user_notifications un WHERE un.notification_id = n.id) AS recipient_count,
        (SELECT COUNT(*) FROM user_notifications un WHERE un.notification_id = n.id AND un.read_at IS NOT NULL) AS read_count
      FROM notifications n
      ORDER BY n.created_at DESC
      LIMIT 100
    `);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.id, n.title, n.message, n.created_at, un.read_at,
        CASE WHEN un.read_at IS NULL THEN 0 ELSE 1 END AS is_read
      FROM user_notifications un
      JOIN notifications n ON n.id = un.notification_id
      WHERE un.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Get my notifications error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM user_notifications WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    );
    res.json({ count: rows[0]?.count ?? 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    if (!title || !message) {
      return res.status(400).json({ message: 'العنوان والرسالة مطلوبان' });
    }

    const [result] = await db.query(
      'INSERT INTO notifications (title, message) VALUES (?, ?)',
      [title, message]
    );
    const notificationId = result.insertId;
    await fanOutToCustomers(notificationId);

    let pushStats = { total: 0, sent: 0, failed: 0, web: 0, mobile: 0 };
    try {
      pushStats = await sendPushForNotification(title, message, notificationId);
    } catch (pushErr) {
      console.error('Push notification error:', pushErr);
    }

    const [users] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
    res.status(201).json({
      message: 'تم إرسال الإشعار للزبائن بنجاح',
      id: notificationId,
      recipient_count: users[0]?.count ?? 0,
      push_sent: pushStats.sent,
      push_devices: pushStats.total,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    if (!notificationId) {
      return res.status(400).json({ message: 'معرّف الإشعار غير صالح' });
    }
    await db.query(
      `UPDATE user_notifications SET read_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND notification_id = ? AND read_at IS NULL`,
      [req.user.id, notificationId]
    );
    res.json({ message: 'تم تعليم الإشعار كمقروء' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE user_notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    );
    res.json({ message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    if (!notificationId) {
      return res.status(400).json({ message: 'معرّف الإشعار غير صالح' });
    }
    await db.query('DELETE FROM user_notifications WHERE notification_id = ?', [notificationId]);
    await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);
    res.json({ message: 'تم حذف الإشعار' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getVapidPublicKey = async (req, res) => {
  try {
    res.json({ publicKey: getPublicKey() });
  } catch (error) {
    console.error('VAPID public key error:', error);
    res.status(500).json({ message: 'إشعارات الهاتف غير مهيّأة على الخادم' });
  }
};

exports.subscribePush = async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = String(req.body.platform || 'web').toLowerCase();

    if (platform === 'web') {
      const subscription = req.body.subscription;
      if (!subscription?.endpoint || !subscription?.keys) {
        return res.status(400).json({ message: 'بيانات الاشتراك غير صالحة' });
      }
      const token = JSON.stringify(subscription);
      const endpoint = subscription.endpoint;
      await db.query('DELETE FROM push_tokens WHERE user_id = ? AND platform = ? AND endpoint = ?', [userId, 'web', endpoint]);
      await db.query(
        'INSERT INTO push_tokens (user_id, token, platform, endpoint) VALUES (?, ?, ?, ?)',
        [userId, token, 'web', endpoint]
      );
      return res.json({ message: 'تم تفعيل إشعارات الهاتف بنجاح' });
    }

    const expoToken = String(req.body.token || '').trim();
    if (!expoToken) {
      return res.status(400).json({ message: 'رمز الإشعار مطلوب' });
    }
    const mobilePlatform = ['android', 'ios', 'expo'].includes(platform) ? platform : 'expo';
    await db.query('DELETE FROM push_tokens WHERE user_id = ? AND token = ?', [userId, expoToken]);
    await db.query(
      'INSERT INTO push_tokens (user_id, token, platform, endpoint) VALUES (?, ?, ?, ?)',
      [userId, expoToken, mobilePlatform, expoToken]
    );
    res.json({ message: 'تم تفعيل إشعارات الهاتف بنجاح' });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.unsubscribePush = async (req, res) => {
  try {
    const userId = req.user.id;
    const endpoint = req.body?.endpoint ? String(req.body.endpoint) : null;
    const token = req.body?.token ? String(req.body.token) : null;

    if (endpoint) {
      await db.query('DELETE FROM push_tokens WHERE user_id = ? AND endpoint = ?', [userId, endpoint]);
    } else if (token) {
      await db.query('DELETE FROM push_tokens WHERE user_id = ? AND token = ?', [userId, token]);
    } else {
      await db.query('DELETE FROM push_tokens WHERE user_id = ?', [userId]);
    }
    res.json({ message: 'تم إيقاف إشعارات الهاتف' });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
