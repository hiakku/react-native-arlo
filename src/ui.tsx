import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Path } from "react-native-svg";
export const C = {
  bg: "#F3F5ED",
  ink: "#273E34",
  muted: "#7C8D80",
  green: "#315C46",
  line: "#E0E6DB",
  lime: "#D9E9AB",
  coral: "#C47D5C",
};
export function Icon({
  name,
  size = 19,
  color = C.ink,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function Brand() {
  return (
    <View style={s.row}>
      <View style={s.logo}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M5 18V8Q5 5 8 5H19M14 1L19 5L14 9"
            fill="none"
            stroke="#F2F5E8"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={s.brand}>
        arlo<Text style={{ color: C.coral }}>.</Text>
      </Text>
    </View>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        {
          opacity: disabled ? 0.35 : 1,
          transform: [{ scale: pressed ? 0.93 : 1 }],
        },
      ]}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        {
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {icon && (
        <Icon name={icon} size={17} color={secondary ? C.ink : "#fff"} />
      )}
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}
export function Dialog({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <ScrollView
          style={{ width: "100%", maxWidth: 460, maxHeight: "90%" }}
          contentContainerStyle={s.dialog}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: {
    padding: 28,
    paddingBottom: 32,
    maxWidth: 1150,
    width: "100%",
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: C.green,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 23, fontWeight: "800", letterSpacing: -1, color: C.ink },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFBF7",
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.1,
    color: C.muted,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -1.9,
    color: C.ink,
    marginTop: 10,
  },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 22, marginTop: 10 },
  hero: { marginTop: 36, marginBottom: 26 },
  modes: {
    flexDirection: "row",
    gap: 8,
    padding: 5,
    backgroundColor: "#E8EDE1",
    borderRadius: 17,
  },
  mode: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  modeText: { fontSize: 11, fontWeight: "600", color: C.muted },
  layout: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  game: { flex: 1, minWidth: 0 },
  panel: {
    backgroundColor: "#FEFFFB",
    borderWidth: 1,
    borderColor: "#E0E6DA",
    borderRadius: 30,
    padding: 22,
    boxShadow: "0px 14px 40px #243D3308",
  },
  levelTitle: {
    fontSize: 23,
    color: C.ink,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginTop: 5,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EEF2E5",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: { fontSize: 10, color: C.green, fontWeight: "600" },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEFE5",
  },
  stat: { flex: 1 },
  statLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  statValue: { fontSize: 19, color: C.ink, fontWeight: "700", marginTop: 6 },
  hearts: { flexDirection: "row", gap: 5, marginTop: 8 },
  boardCenter: { alignItems: "center", justifyContent: "center" },
  message: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    lineHeight: 18,
    minHeight: 36,
    marginTop: 5,
  },
  tools: { flexDirection: "row", gap: 10, marginTop: 14 },
  tool: {
    flex: 1,
    backgroundColor: "#FDFFF9",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  toolText: { fontSize: 11, fontWeight: "600", color: C.ink },
  progress: {
    backgroundColor: "#E9EEDF",
    borderRadius: 18,
    padding: 17,
    marginTop: 18,
  },
  small: { fontSize: 11, lineHeight: 18, color: C.muted },
  body: { fontSize: 13, lineHeight: 22, color: C.muted },
  progressTitle: { fontSize: 12, color: C.ink, fontWeight: "600" },
  track: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "#D8E1CE",
    marginTop: 12,
    overflow: "hidden",
  },
  guide: {
    width: 265,
    padding: 25,
    borderRadius: 25,
    backgroundColor: "#E8EEDF",
    borderWidth: 1,
    borderColor: "#DDE5D3",
  },
  guideTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.7,
  },
  guideStep: { flexDirection: "row", gap: 10, marginTop: 22 },
  step: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F7FAF1",
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#F6F8EF",
    marginTop: 23,
    gap: 9,
  },
  divider: { height: 1, backgroundColor: "#D8E1D0", marginTop: 24 },
  footer: {
    alignItems: "center",
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#1D342ACA",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  dialog: {
    backgroundColor: "#F8FAF3",
    borderRadius: 27,
    padding: 26,
    borderWidth: 1,
    borderColor: "#DAE5D2",
  },
  dialogTitle: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: -0.9,
    color: C.ink,
    flexShrink: 1,
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: { fontSize: 12, color: "white", fontWeight: "700" },
  secondary: { backgroundColor: "#E8EEDF" },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 24 },
  levelCell: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  levelNumber: { fontSize: 18, fontWeight: "600", color: C.ink },
  setting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 24,
  },
  winMark: {
    width: 70,
    height: 70,
    borderRadius: 25,
    backgroundColor: "#E0EDC4",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 23,
  },
  notice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F6E5DA",
    marginVertical: 14,
  },
  dailyCard: {
    backgroundColor: "#F1EADB",
    padding: 18,
    borderRadius: 17,
    marginTop: 18,
  },
  mini: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, color: C.muted },
  milestone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  flower: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#DBE9BD",
    alignItems: "center",
    justifyContent: "center",
  },
});
