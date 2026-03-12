import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

export default function AnimatedCard({ children, style, onPress, delay = 0, ...props }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
