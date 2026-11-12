import React, { memo, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import {
  Arrow,
  Direction,
  DIRECTIONS,
  Point,
  Puzzle,
  direction,
  escapePoints,
} from "./engine";
export const PALETTE = ["#527E67", "#C47D5C", "#8E7EAD", "#6589A9"];
function curve(points: Point[]): string {
  if (!points.length) return "";
  const ps = points.map(([x, y]) => [x + 1, y + 1] as Point);
  let d = `M${ps[0][0]} ${ps[0][1]}`;
  for (let i = 1; i < ps.length; i++) {
    const p = ps[i],
      prev = ps[i - 1],
      next = ps[i + 1];
    if (!next) {
      d += ` L${p[0]} ${p[1]}`;
      continue;
    }
    const before: Point = [
      p[0] - Math.sign(p[0] - prev[0]) * 0.23,
      p[1] - Math.sign(p[1] - prev[1]) * 0.23,
    ];
    const after: Point = [
      p[0] + Math.sign(next[0] - p[0]) * 0.23,
      p[1] + Math.sign(next[1] - p[1]) * 0.23,
    ];
    if (
      (p[0] - prev[0]) * (next[1] - p[1]) ===
      (p[1] - prev[1]) * (next[0] - p[0])
    )
      d += ` L${p[0]} ${p[1]}`;
    else
      d += ` L${before[0]} ${before[1]} Q${p[0]} ${p[1]} ${after[0]} ${after[1]}`;
  }
  return d;
}
function headPath(head: Point, dir: Direction) {
  const [dx, dy] = DIRECTIONS[dir],
    x = head[0] + 1,
    y = head[1] + 1;
  return `M${x - dx * 0.28 - dy * 0.23} ${y - dy * 0.28 + dx * 0.23} L${x} ${y} L${x - dx * 0.28 + dy * 0.23} ${y - dy * 0.28 - dx * 0.23}`;
}
const ArrowInk = memo(function ArrowInk({
  arrow,
  size,
  escaping,
  hinted,
  blocked,
  labels,
  motion,
  onEscaped,
}: {
  arrow: Arrow;
  size: number;
  escaping: boolean;
  hinted: boolean;
  blocked: boolean;
  labels: boolean;
  motion: boolean;
  onEscaped: () => void;
}) {
  const [travel, setTravel] = useState(0),
    [value] = useState(() => new Animated.Value(0));
  const done = useRef(onEscaped);
  useEffect(() => {
    done.current = onEscaped;
  }, [onEscaped]);
  useEffect(() => {
    if (!escaping) return;
    const listener = value.addListener(({ value: v }) => setTravel(v));
    const animation = Animated.timing(value, {
      toValue: size + arrow.points.length + 3,
      duration: motion ? 460 : 0,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) done.current();
    });
    return () => {
      animation.stop();
      value.removeListener(listener);
    };
  }, [escaping, motion, size, value, arrow.points.length]);
  const points = escaping
    ? escapePoints(arrow, travel, size + arrow.points.length * 2 + 5)
    : arrow.points;
  if (points.length < 2) return null;
  const color = blocked ? "#C85850" : PALETTE[arrow.color],
    head = points.at(-1)!;
  return (
    <G>
      {hinted && (
        <Path
          d={curve(points)}
          stroke="#D9ECAA"
          strokeWidth={0.48}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <Path
        d={curve(points)}
        stroke={color}
        strokeWidth={hinted ? 0.17 : 0.14}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={headPath(head, direction(arrow))}
        stroke={color}
        strokeWidth={0.14}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={points[0][0] + 1}
        cy={points[0][1] + 1}
        r={0.07}
        fill={color}
      />
    </G>
  );
});
export function Board({
  puzzle,
  remaining,
  width,
  escaping,
  hinted,
  blocked,
  labels,
  motion,
  onTap,
  onEscaped,
  disabled,
}: {
  puzzle: Puzzle;
  remaining: number[];
  width: number;
  escaping: number | null;
  hinted: number | null;
  blocked: number[];
  labels: boolean;
  motion: boolean;
  onTap: (id: number) => void;
  onEscaped: (id: number) => void;
  disabled: boolean;
}) {
  const unit = width / (puzzle.size + 1);
  return (
    <View
      style={{ width, height: width, overflow: "hidden", borderRadius: 24 }}
    >
      <Svg
        width={width}
        height={width}
        viewBox={`0 0 ${puzzle.size + 1} ${puzzle.size + 1}`}
        aria-hidden={true}
      >
        {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => (
          <Circle
            key={i}
            cx={(i % puzzle.size) + 1}
            cy={Math.floor(i / puzzle.size) + 1}
            r={0.022}
            fill="#DBE2D8"
          />
        ))}
        {puzzle.arrows
          .filter((a) => remaining.includes(a.id))
          .map((a) => (
            <ArrowInk
              key={a.id}
              arrow={a}
              size={puzzle.size}
              escaping={escaping === a.id}
              hinted={hinted === a.id}
              blocked={blocked.includes(a.id)}
              labels={labels}
              motion={motion}
              onEscaped={() => onEscaped(a.id)}
            />
          ))}
      </Svg>
      {puzzle.arrows
        .filter((a) => remaining.includes(a.id))
        .map((a) => {
          const head = a.points.at(-1)!,
            hit = Math.min(unit * 0.9, 36);
          return (
            <React.Fragment key={a.id}>
              {/* Every arrow cell is tappable; only the head participates in accessibility order. */}
              {a.points.map(([x, y], i) => (
                <Pressable
                  key={i}
                  accessibilityRole={
                    i === a.points.length - 1 ? "button" : undefined
                  }
                  accessibilityLabel={
                    i === a.points.length - 1
                      ? `Arrow ${a.id + 1}, pointing ${direction(a)}`
                      : undefined
                  }
                  accessible={i === a.points.length - 1}
                  aria-hidden={i !== a.points.length - 1}
                  importantForAccessibility={
                    i === a.points.length - 1 ? "yes" : "no-hide-descendants"
                  }
                  disabled={disabled}
                  onPress={() => onTap(a.id)}
                  style={{
                    position: "absolute",
                    left: (x + 1) * unit - hit / 2,
                    top: (y + 1) * unit - hit / 2,
                    width: hit,
                    height: hit,
                    borderRadius: hit / 2,
                  }}
                />
              ))}
              {labels && (
                <Text
                  pointerEvents="none"
                  style={[
                    style.number,
                    {
                      left: (head[0] + 1) * unit + 5,
                      top: (head[1] + 1) * unit + 4,
                    },
                  ]}
                >
                  {a.id + 1}
                </Text>
              )}
            </React.Fragment>
          );
        })}
    </View>
  );
}
const style = StyleSheet.create({
  number: {
    position: "absolute",
    fontSize: 8,
    fontWeight: "600",
    color: "#4C6155",
  },
});
