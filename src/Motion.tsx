import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Platform,
  View,
} from "react-native";
const native = Platform.OS !== "web";
export function useMotionAllowed(enabled: boolean) {
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {});
    const setting = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const lifecycle = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => {
      alive = false;
      setting.remove();
      lifecycle.remove();
    };
  }, []);
  return enabled && !reduced && active;
}
export function Entrance({
  children,
  motion,
}: {
  children: React.ReactNode;
  motion: boolean;
}) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const entry = Animated.timing(value, {
      toValue: 1,
      duration: motion ? 600 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    entry.start();
    return () => entry.stop();
  }, [value, motion]);
  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
export function Celebration({ motion }: { motion: boolean }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(value, {
      toValue: 1,
      duration: motion ? 1600 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    a.start();
    return () => a.stop();
  }, [value, motion]);
  return (
    <View pointerEvents="none" style={{ height: 0, alignItems: "center" }}>
      {Array.from({ length: 12 }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: i % 2 ? 5 : 8,
            height: i % 2 ? 12 : 8,
            borderRadius: i % 2 ? 2 : 5,
            backgroundColor: ["#AFA0FF", "#7BE1C5", "#FFB48D"][i % 3],
            opacity: motion
              ? value.interpolate({
                  inputRange: [0, 0.15, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                })
              : 0,
            transform: [
              {
                translateX: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos((i * Math.PI) / 6) * 135],
                }),
              },
              {
                translateY: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, Math.sin((i * Math.PI) / 6) * 100 + 60],
                }),
              },
              {
                rotate: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${i * 73}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
