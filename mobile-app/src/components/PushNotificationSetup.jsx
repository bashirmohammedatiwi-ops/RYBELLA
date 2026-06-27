import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotifications } from '../services/pushNotifications';
import { PUSH_PERMISSION_COPY as copy } from '../constants/pushCopy';
import { colors, borderRadius, spacing, typography } from '../theme';

const DISMISS_KEY = 'push_prompt_dismissed';

export default function PushNotificationSetup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setVisible(false);
      return;
    }

    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        registerForPushNotifications().catch(() => {});
        setVisible(false);
        return;
      }
      if (status === 'denied') {
        setVisible(false);
        return;
      }
      const dismissed = await AsyncStorage.getItem(DISMISS_KEY);
      setVisible(!dismissed);
    })();
  }, [user?.id]);

  const handleAccept = async () => {
    setLoading(true);
    const result = await registerForPushNotifications();
    setLoading(false);
    if (result.ok) {
      await AsyncStorage.removeItem(DISMISS_KEY);
    }
    setVisible(false);
  };

  const handleLater = async () => {
    await AsyncStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleLater}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Text style={styles.highlight}>{copy.highlight}</Text>
          <Text style={styles.reassurance}>{copy.reassurance}</Text>
          {loading && (
            <Text style={styles.hint}>اضغطي «سماح» في نافذة الهاتف لإكمال التفعيل...</Text>
          )}

          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptText}>{copy.accept}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={handleLater} disabled={loading}>
            <Text style={styles.laterText}>{copy.later}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.body,
  },
  icon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  highlight: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: 'rgba(232, 93, 122, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  reassurance: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  laterText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
