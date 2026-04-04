import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  const show = (msg, duration = 2500) => {
    setMessage(msg);
    setVisible(true);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const error = (msg) => show(msg, 3000);
  const success = (msg) => show(msg, 2500);

  return (
    <ToastContext.Provider value={{ show, error, success }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { opacity }]}>
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { show: () => {}, error: () => {}, success: () => {} };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(235,139,161,0.95)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
