import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Board } from "../Board";
import { blockers, removable } from "../engine";
import {
  fresh,
  levels,
  parseSession,
  puzzleFor,
  Session,
  today,
} from "../session";
import { Brand, Button, C, Dialog, Icon, IconButton, s } from "../ui";
import { Celebration, Entrance, useMotionAllowed } from "../Motion";
import { useAds } from "../ads/useAds";
import { breakMilestone } from "../ads/controller";
const KEY = "arrow-room.progress.v1";
const names = [
  "A little room to begin",
  "Follow the open path",
  "Around the corner",
  "Let it all unravel",
  "A change of direction",
  "Find the quiet way",
  "One clear thought",
  "Room to breathe",
];
const hydrationSubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export default function Game() {
  const hydrated = useSyncExternalStore(
    hydrationSubscribe,
    clientSnapshot,
    serverSnapshot,
  );
  if (Platform.OS === "web" && !hydrated)
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.page}>
          <Brand />
          <Text style={s.heroTitle}>Find your way out.</Text>
          <Text style={s.body}>
            Sixty arrow puzzles and a fresh daily flow. Opening your saved game…
          </Text>
        </View>
      </SafeAreaView>
    );
  return <GameScreen />;
}
function GameScreen() {
  const [game, setGame] = useState<Session>(() => fresh());
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [escaping, setEscaping] = useState<number | null>(null),
    [hint, setHint] = useState<number | null>(null),
    [blocked, setBlocked] = useState<number[]>([]);
  const [message, setMessage] = useState(
    "Find an arrow with a clear way out. Tap to let it go.",
  );
  const [help, setHelp] = useState(false),
    [settings, setSettings] = useState(false),
    [collection, setCollection] = useState(false),
    [restart, setRestart] = useState(false),
    [win, setWin] = useState(false),
    [lost, setLost] = useState(false);
  const [switchMode, setSwitchMode] = useState<Session["mode"] | null>(null),
    [offer, setOffer] = useState<"hint" | "revive" | null>(null),
    [transition, setTransition] = useState(false);
  const alive = useRef(true),
    busy = useRef(false),
    queue = useRef(Promise.resolve()),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    breakDue = useRef(false);
  const [shake] = useState(() => new Animated.Value(0));
  const ads = useAds();
  const { mode, level, day } = game;
  const puzzle = useMemo(
    () => puzzleFor({ mode, level, day }),
    [mode, level, day],
  );
  const motion = useMotionAllowed(game.motion);
  const { width } = useWindowDimensions();
  const split = width >= 940,
    phone = width < 480;
  const boardWidth = Math.max(
    220,
    Math.min(500, split ? width - 460 : width - (phone ? 72 : 112)),
  );
  const count = Object.keys(game.completed).length,
    stars = game.revived ? Math.min(game.hearts, 2) : game.hearts;
  const unlocked = Math.min(
    levels.length - 1,
    Math.max(0, ...Object.keys(game.completed).map((k) => Number(k) + 1)),
  );
  const disabled = !ready || escaping !== null || transition || ads.showing;
  useEffect(() => {
    alive.current = true;
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!active) return;
        const saved = raw ? parseSession(raw) : fresh();
        setGame(saved);
        setWin(!saved.remaining.length);
        setLost(saved.hearts === 0 && !!saved.remaining.length);
        setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            "Saved progress could not be opened. Reopen Arlo to retry; your existing save has not been replaced.",
          );
      });
    return () => {
      active = false;
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      shake.stopAnimation();
    };
  }, [shake]);
  useEffect(() => {
    if (!ready) return;
    const value = JSON.stringify({ version: 1, game });
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, value))
      .then(() => {
        if (alive.current) setError("");
      })
      .catch(() => {
        if (alive.current)
          setError(
            "Progress could not be saved. Keep the game open and tap Retry.",
          );
      });
  }, [game, ready, retry]);
  function resetView() {
    setEscaping(null);
    setHint(null);
    setBlocked([]);
    setWin(false);
    setLost(false);
    busy.current = false;
    setMessage("Find an arrow with a clear way out. Tap to let it go.");
  }
  function openLevel(index: number) {
    if (disabled || index > unlocked) return;
    setGame((g) => fresh("journey", index, g));
    resetView();
    setCollection(false);
  }
  function changeMode(next: Session["mode"]) {
    if (
      disabled ||
      (next === game.mode && (next === "journey" || game.day === today()))
    )
      return;
    const partial =
      game.remaining.length > 0 &&
      (game.remaining.length < puzzle.arrows.length || game.hearts < 3);
    if (partial) {
      setSwitchMode(next);
      return;
    }
    applyMode(next);
  }
  function applyMode(next: Session["mode"]) {
    setGame((g) => fresh(next, next === "journey" ? unlocked : 0, g));
    resetView();
    setSwitchMode(null);
  }
  function tapArrow(id: number) {
    if (
      disabled ||
      busy.current ||
      game.hearts === 0 ||
      !game.remaining.includes(id)
    )
      return;
    const blocking = blockers(puzzle, game.remaining, id);
    setHint(null);
    if (blocking.length) {
      setBlocked([id, ...blocking]);
      setMessage("That path is blocked. Look for a tip with a clear way out.");
      setGame((g) => ({ ...g, hearts: g.hearts - 1 }));
      if (game.hearts === 1) setLost(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => {
        if (alive.current) setBlocked([]);
      }, 800);
      if (motion) {
        shake.stopAnimation();
        shake.setValue(0);
        Animated.sequence([
          Animated.timing(shake, {
            toValue: -5,
            duration: 55,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(shake, {
            toValue: 5,
            duration: 70,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(shake, {
            toValue: -3,
            duration: 65,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: 65,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]).start();
      }
      return;
    }
    busy.current = true;
    setBlocked([]);
    setEscaping(id);
  }
  function finishEscape(id: number) {
    if (!alive.current || escaping !== id) return;
    const remaining = game.remaining.filter((n) => n !== id),
      finished = remaining.length === 0;
    setGame((g) => ({
      ...g,
      remaining,
      completed:
        finished && g.mode === "journey"
          ? {
              ...g.completed,
              [g.level]: Math.max(g.completed[g.level] ?? 0, stars),
            }
          : g.completed,
      dailyBest:
        finished && g.mode === "daily"
          ? {
              ...g.dailyBest,
              [g.day]: Math.max(g.dailyBest[g.day] ?? 0, stars),
            }
          : g.dailyBest,
    }));
    setEscaping(null);
    busy.current = false;
    setMessage(
      finished
        ? "A little less tangled. Beautifully done."
        : remaining.length === 1
          ? "One last arrow. A clear finish."
          : "One clear path makes room for another.",
    );
    if (finished) {
      breakDue.current =
        game.mode === "journey" && breakMilestone(game.completed, game.level);
      setWin(true);
    }
  }
  function showHint(preview = false) {
    const freeHint = preview || Platform.OS === "web";
    if (disabled || !game.remaining.length || game.hearts === 0) return;
    if (hint !== null) {
      setMessage(`Arrow ${hint + 1} has a clear path. Tap its glowing tip.`);
      return;
    }
    if (!freeHint && game.hints === 0) {
      setOffer("hint");
      void ads.controller.start();
      return;
    }
    const id = removable(puzzle, game.remaining)[0];
    if (id === undefined) {
      setMessage("No clear path found. Restart this puzzle.");
      return;
    }
    if (!freeHint) setGame((g) => ({ ...g, hints: Math.max(0, g.hints - 1) }));
    setHint(id);
    setBlocked([]);
    setMessage(`Arrow ${id + 1} has a clear path. Tap its glowing tip.`);
  }
  function openRevive() {
    if (disabled || game.revived) return;
    setLost(false);
    if (Platform.OS === "web") {
      setGame((g) => ({ ...g, hearts: 3, revived: true }));
      setMessage(
        "Three hearts restored. Your puzzle is right where you left it.",
      );
      return;
    }
    setOffer("revive");
    void ads.controller.start();
  }
  function closeOffer() {
    setOffer(null);
    if (game.hearts === 0) setLost(true);
  }
  function previewReward() {
    const action = offer;
    setOffer(null);
    if (action === "hint") showHint(true);
    else {
      setGame((g) => ({ ...g, hearts: 3, revived: true }));
      setMessage("Preview revive: three hearts restored. Find a clear path.");
    }
  }
  function watchAd() {
    if (!ads.rewardedReady || disabled || !offer) return;
    const action = offer;
    setOffer(null);
    setTransition(true);
    timer.current = setTimeout(() => {
      const shown = ads.controller.watchReward(
        () => {
          if (alive.current)
            setGame((g) =>
              action === "hint"
                ? { ...g, hints: Math.min(10000, g.hints + 1) }
                : { ...g, hearts: 3, revived: true },
            );
        },
        (earned) => {
          if (!alive.current) return;
          setTransition(false);
          setMessage(
            earned
              ? action === "hint"
                ? "One hint added. Tap Hint when you need it."
                : "Three hearts restored. Your puzzle is right where you left it."
              : "Ad closed. No reward was added.",
          );
          if (action === "revive" && !earned) setLost(true);
        },
      );
      if (!shown && alive.current) {
        setTransition(false);
        setMessage("No test ad is ready. You can retry or restart for free.");
        if (action === "revive") setLost(true);
      }
    }, 350);
  }
  function nextPuzzle() {
    if (disabled) return;
    const eligible = breakDue.current;
    breakDue.current = false;
    setWin(false);
    setTransition(true);
    timer.current = setTimeout(
      () =>
        ads.controller.showBreak(eligible, () => {
          if (!alive.current) return;
          setTransition(false);
          if (game.mode === "journey" && game.level < levels.length - 1) {
            setGame((g) => fresh("journey", g.level + 1, g));
            resetView();
          } else if (game.mode === "daily") {
            setGame((g) => fresh("journey", unlocked, g));
            resetView();
          } else setCollection(true);
        }),
      350,
    );
  }
  const guide = (
    <>
      {[
        [
          "mouse-pointer",
          "Find a clear tip",
          "Check where the arrow points. Its path to the edge must be empty.",
        ],
        [
          "corner-up-right",
          "Tap and let it go",
          "An open arrow slides away, making space for the others.",
        ],
        [
          "heart",
          "Keep your three hearts",
          "Blocked arrows cost a heart. Clear the board with care.",
        ],
      ].map(([icon, title, body], i) => (
        <View key={title} style={s.guideStep}>
          <View style={s.step}>
            <Text style={[s.small, { fontWeight: "700" }]}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.progressTitle, { marginBottom: 5 }]}>{title}</Text>
            <Text style={s.small}>{body}</Text>
          </View>
        </View>
      ))}
    </>
  );
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.page, phone && { padding: 18 }]}>
        <View style={s.between}>
          <Brand />
          <View style={s.row}>
            <IconButton
              name="grid"
              label="Choose a puzzle"
              disabled={disabled}
              onPress={() => setCollection(true)}
            />
            <IconButton
              name="sliders"
              label="Preferences"
              disabled={disabled}
              onPress={() => setSettings(true)}
            />
          </View>
        </View>
        <View style={[s.hero, phone && { marginTop: 24, marginBottom: 18 }]}>
          <View
            style={[
              s.between,
              { flexWrap: "wrap", alignItems: "flex-end", gap: 18 },
            ]}
          >
            <View>
              <Text style={s.eyebrow}>A LITTLE LESS TANGLED.</Text>
              <Text
                style={[
                  s.heroTitle,
                  phone && {
                    fontSize: 29,
                    lineHeight: 35,
                    letterSpacing: -1.2,
                  },
                ]}
              >
                Find your way <Text style={{ color: "#72916C" }}>out.</Text>
              </Text>
              {!phone && (
                <Text style={s.subtitle}>
                  A little focus. A lot of satisfying escapes. Take it one arrow
                  at a time.
                </Text>
              )}
            </View>
            <View style={[s.modes, phone && { width: "100%" }]}>
              {(["journey", "daily"] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={
                    m === "daily" ? "Daily puzzle" : "Journey"
                  }
                  accessibilityState={{ selected: game.mode === m }}
                  disabled={disabled}
                  onPress={() => changeMode(m)}
                  style={[
                    s.mode,
                    phone && { flex: 1 },
                    game.mode === m && {
                      backgroundColor: "#FCFFF7",
                      boxShadow: "0px 2px 8px #30432B08",
                    },
                  ]}
                >
                  <Icon
                    name={m === "daily" ? "sun" : "map"}
                    size={15}
                    color={game.mode === m ? C.green : C.muted}
                  />
                  <Text
                    style={[s.modeText, game.mode === m && { color: C.green }]}
                  >
                    {m === "daily" ? "Daily flow" : "Your journey"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        {!!error && (
          <View style={s.notice}>
            <Text style={s.body}>{error}</Text>
            {ready && (
              <Button
                label="Retry save"
                secondary
                onPress={() => setRetry((n) => n + 1)}
              />
            )}
          </View>
        )}
        <View style={s.layout}>
          <View style={s.game}>
            <Entrance key={`${mode}-${level}-${day}`} motion={motion}>
              <View
                style={[s.panel, phone && { padding: 14, borderRadius: 26 }]}
              >
                <View style={s.between}>
                  <View>
                    <Text style={s.eyebrow}>
                      {mode === "daily"
                        ? `DAILY FLOW · ${day}`
                        : `CHAPTER ${String(Math.floor(level / 10) + 1).padStart(2, "0")} · PUZZLE ${String(level + 1).padStart(2, "0")}`}
                    </Text>
                    <Text style={[s.levelTitle, phone && { fontSize: 21 }]}>
                      {mode === "daily"
                        ? "A fresh path for today"
                        : (names[level] ?? "A clearer path")}
                    </Text>
                  </View>
                  <View style={[s.pill, width < 370 && { display: "none" }]}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: "#76975C",
                      }}
                    />
                    <Text style={s.pillText}>
                      {puzzle.arrows.length < 12
                        ? "Gentle"
                        : puzzle.arrows.length < 22
                          ? "Thoughtful"
                          : "Intricate"}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    s.stats,
                    phone && { marginTop: 16, paddingBottom: 13 },
                  ]}
                >
                  <View style={s.stat}>
                    <Text style={s.statLabel}>HEARTS</Text>
                    <View
                      style={s.hearts}
                      accessible
                      accessibilityLabel={`${game.hearts} of 3 hearts remaining`}
                    >
                      {[0, 1, 2].map((i) => (
                        <Icon
                          key={i}
                          name="heart"
                          size={17}
                          color={i < game.hearts ? "#C98D76" : "#DDE4D8"}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={[s.stat, { alignItems: "center" }]}>
                    <Text style={s.statLabel}>CLEARED</Text>
                    <Text style={s.statValue}>
                      {puzzle.arrows.length - game.remaining.length}
                      <Text style={{ fontSize: 12, color: C.muted }}>
                        {" "}
                        / {puzzle.arrows.length}
                      </Text>
                    </Text>
                  </View>
                  <View style={[s.stat, { alignItems: "flex-end" }]}>
                    <Text style={s.statLabel}>YOUR BEST</Text>
                    <View style={[s.row, { gap: 3, marginTop: 8 }]}>
                      {[0, 1, 2].map((i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={15}
                          color={
                            i <
                            (mode === "daily"
                              ? (game.dailyBest[day] ?? 0)
                              : (game.completed[level] ?? 0))
                              ? "#B59B53"
                              : "#DBE2D3"
                          }
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Animated.View
                  style={[
                    s.boardCenter,
                    { transform: [{ translateX: shake }] },
                  ]}
                >
                  <Board
                    puzzle={puzzle}
                    remaining={game.remaining}
                    width={boardWidth}
                    escaping={escaping}
                    hinted={hint}
                    blocked={blocked}
                    labels={game.labels}
                    motion={motion}
                    onTap={tapArrow}
                    onEscaped={finishEscape}
                    disabled={disabled || game.hearts === 0}
                  />
                </Animated.View>
                <Text accessibilityLiveRegion="polite" style={s.message}>
                  {!ready
                    ? "Opening your puzzle room…"
                    : transition
                      ? "A little pause between paths…"
                      : message}
                </Text>
              </View>
            </Entrance>
            <View style={s.tools}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Get a hint"
                disabled={
                  disabled || !game.remaining.length || game.hearts === 0
                }
                onPress={() => showHint()}
                style={[
                  s.tool,
                  {
                    backgroundColor: "#E0EABC",
                    opacity:
                      disabled || !game.remaining.length || game.hearts === 0
                        ? 0.4
                        : 1,
                  },
                ]}
              >
                <Icon name="sun" size={17} color="#607445" />
                <Text style={s.toolText}>
                  {Platform.OS === "web" ? "Hint" : `Hint · ${game.hints}`}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restart puzzle"
                disabled={disabled}
                onPress={() => setRestart(true)}
                style={[s.tool, { opacity: disabled ? 0.4 : 1 }]}
              >
                <Icon name="rotate-ccw" size={16} />
                <Text style={s.toolText}>Restart</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="How to play"
                disabled={disabled}
                onPress={() => setHelp(true)}
                style={s.tool}
              >
                <Icon name="help-circle" size={16} />
                <Text style={s.toolText}>How to play</Text>
              </Pressable>
            </View>
            <View style={s.progress}>
              <View style={s.between}>
                <Text style={s.progressTitle}>
                  Your little moments of clarity
                </Text>
                <Text style={s.small}>
                  {count} / {levels.length}
                </Text>
              </View>
              <View style={s.track}>
                <View
                  style={{
                    height: 5,
                    width: `${(count / levels.length) * 100}%`,
                    backgroundColor: "#8AA46D",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
          {split && (
            <View style={s.guide}>
              <Icon name="wind" size={27} color="#829969" />
              <Text style={[s.guideTitle, { marginTop: 18 }]}>
                One clear path{"\n"}changes everything.
              </Text>
              <Text style={[s.body, { marginTop: 12 }]}>
                No timer. Just a tangled little puzzle and a fresh way to see
                it.
              </Text>
              {guide}
              <View style={s.divider} />
              <View style={s.milestone}>
                <View style={s.flower}>
                  <Icon name="award" color="#779251" />
                </View>
                <View>
                  <Text style={s.progressTitle}>
                    {Object.values(game.completed).reduce((a, b) => a + b, 0)}{" "}
                    stars collected
                  </Text>
                  <Text style={s.small}>A journey worth taking slowly.</Text>
                </View>
              </View>
              <View style={s.dailyCard}>
                <View style={s.row}>
                  <Icon name="sun" color="#A38F5A" />
                  <Text style={s.progressTitle}>A new daily flow</Text>
                </View>
                <Text style={[s.small, { marginTop: 8 }]}>
                  One shared puzzle for each date. Come back tomorrow for a
                  fresh arrangement.
                </Text>
              </View>
              <View style={s.note}>
                <Text style={s.small}>
                  {Platform.OS === "web"
                    ? "Hints and one second chance per round are included. No timers, no sign-up. Just play."
                    : "Three starter hints. Optional test ads add hints or restore hearts in the Android preview. Restarting is always free."}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={s.footer}>
          <Icon name="feather" size={13} color="#9AA58F" />
          <Text style={[s.small, { fontSize: 10 }]}>
            Make a little room for a clearer mind.
          </Text>
        </View>
      </ScrollView>
      <Dialog visible={collection} onClose={() => setCollection(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>Your journey.</Text>
          <IconButton
            name="x"
            label="Close puzzle collection"
            onPress={() => setCollection(false)}
          />
        </View>
        <Text style={[s.body, { marginTop: 12 }]}>
          Sixty little tangles. A little more space with every solve.
        </Text>
        <View style={s.levelGrid}>
          {levels.map((p, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Play puzzle ${i + 1}${i > unlocked ? ", locked" : ""}`}
              disabled={disabled || i > unlocked}
              onPress={() => openLevel(i)}
              style={[
                s.levelCell,
                i === level &&
                  mode === "journey" && {
                    backgroundColor: "#E6EDCE",
                    borderColor: "#A5BA83",
                  },
                i > unlocked && { opacity: 0.4 },
              ]}
            >
              {i > unlocked ? (
                <Icon name="lock" size={17} color={C.muted} />
              ) : (
                <Text style={s.levelNumber}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
              )}
              <View style={[s.row, { gap: 2 }]}>
                {[0, 1, 2].map((j) => (
                  <Icon
                    key={j}
                    name="star"
                    size={8}
                    color={j < (game.completed[i] ?? 0) ? "#B59B53" : "#DAE1D4"}
                  />
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      </Dialog>
      <Dialog visible={help} onClose={() => setHelp(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>A few clear steps.</Text>
          <IconButton
            name="x"
            label="Close how to play"
            onPress={() => setHelp(false)}
          />
        </View>
        {guide}
        <Text style={[s.body, { marginTop: 22, marginBottom: 22 }]}>
          You can tap anywhere along an arrow. If another arrow lies ahead of
          its tip, it cannot escape yet. Clear the board without losing hearts
          for three stars. A revived round earns up to two stars.
        </Text>
        <Button label="Find my first path" onPress={() => setHelp(false)} />
      </Dialog>
      <Dialog visible={settings} onClose={() => setSettings(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>Make it your space.</Text>
          <IconButton
            name="x"
            label="Close preferences"
            onPress={() => setSettings(false)}
          />
        </View>
        <View style={s.setting}>
          <View style={{ flex: 1 }}>
            <Text style={s.progressTitle}>Animations</Text>
            <Text style={s.small}>Smooth escapes and gentle feedback.</Text>
          </View>
          <Switch
            accessibilityLabel="Animations"
            value={game.motion}
            onValueChange={(v) => setGame((g) => ({ ...g, motion: v }))}
            disabled={disabled}
            trackColor={{ true: "#87A36B" }}
          />
        </View>
        <View style={s.setting}>
          <View style={{ flex: 1 }}>
            <Text style={s.progressTitle}>Numbered arrows</Text>
            <Text style={s.small}>Make hints easier to follow.</Text>
          </View>
          <Switch
            accessibilityLabel="Numbered arrows"
            value={game.labels}
            onValueChange={(v) => setGame((g) => ({ ...g, labels: v }))}
            disabled={!ready}
            trackColor={{ true: "#87A36B" }}
          />
        </View>
        <View style={s.note}>
          <Icon name="shield" color="#859A71" />
          <Text style={s.small}>
            {Platform.OS === "web"
              ? "Progress is saved in this browser. No login, purchases or ads. Clearing site data removes your progress."
              : "Progress stays on this device. No login or purchases. The Android preview uses Google test ads, which earn no money. Clearing app data removes your progress."}
          </Text>
        </View>
        {Platform.OS !== "web" && (
          <View style={[s.note, { marginBottom: 20 }]}>
            <Text style={s.progressTitle}>Test ads only</Text>
            <Text style={s.small}>{ads.message}</Text>
            {ads.supported && (
              <Button
                label="Retry test ads"
                secondary
                onPress={() => {
                  void ads.controller.start();
                }}
              />
            )}
          </View>
        )}
        <View style={{ height: 20 }} />
        <Button label="Back to my puzzle" onPress={() => setSettings(false)} />
      </Dialog>
      <Dialog visible={restart} onClose={() => setRestart(false)}>
        <Text style={s.dialogTitle}>A fresh perspective?</Text>
        <Text style={[s.body, { marginVertical: 20 }]}>
          Restart this board with three hearts. Your best stars and remaining
          hint credits stay saved.
        </Text>
        <Button
          label="Restart for free"
          icon="rotate-ccw"
          onPress={() => {
            setGame((g) => fresh(g.mode, g.level, g, g.day));
            resetView();
            setRestart(false);
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Keep my puzzle"
          secondary
          onPress={() => setRestart(false)}
        />
      </Dialog>
      <Dialog visible={switchMode !== null} onClose={() => setSwitchMode(null)}>
        <Text style={s.dialogTitle}>Try a different path?</Text>
        <Text style={[s.body, { marginVertical: 20 }]}>
          Your current board will restart when you switch puzzles. Your
          completed puzzles, stars and hint credits stay saved.
        </Text>
        <Button
          label="Switch puzzle"
          onPress={() => {
            if (switchMode) applyMode(switchMode);
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Stay here"
          secondary
          onPress={() => setSwitchMode(null)}
        />
      </Dialog>
      <Dialog visible={lost} onClose={() => setLost(false)}>
        <View style={s.winMark}>
          <Icon name="heart" size={32} color="#BC8268" />
        </View>
        <Text style={[s.dialogTitle, { textAlign: "center" }]}>
          There’s still a way out.
        </Text>
        <Text
          style={[
            s.body,
            { marginTop: 12, marginBottom: 22, textAlign: "center" },
          ]}
        >
          Your hearts ran out.{" "}
          {!game.revived
            ? "Get three more to continue this exact board, or take a fresh start for free."
            : "This round has already been revived. A fresh start gives you three hearts again."}
        </Text>
        {!game.revived && (
          <>
            <Button
              label={
                Platform.OS === "web" ? "Restore 3 hearts" : "Get 3 more hearts"
              }
              icon="heart"
              onPress={openRevive}
            />
            <View style={{ height: 10 }} />
          </>
        )}
        <Button
          label="Restart for free"
          secondary
          onPress={() => {
            setGame((g) => fresh(g.mode, g.level, g, g.day));
            resetView();
          }}
        />
      </Dialog>
      <Dialog visible={offer !== null} onClose={closeOffer}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>
            {offer === "revive" ? "A second wind?" : "A little nudge?"}
          </Text>
          <IconButton
            name="x"
            label="Close reward offer"
            onPress={closeOffer}
          />
        </View>
        <Text style={[s.body, { marginTop: 14, marginBottom: 20 }]}>
          {offer === "revive"
            ? "Complete an optional test ad to restore three hearts and keep this board. One revive per round."
            : "Complete an optional test ad to add one hint. Playing and restarting stay free."}
        </Text>
        {ads.supported ? (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={[s.small, { marginBottom: 15 }]}
            >
              {ads.message}
            </Text>
            <Button
              label={
                offer === "revive"
                  ? "Watch test ad · +3 hearts"
                  : "Watch test ad · +1 hint"
              }
              icon="play"
              disabled={!ads.rewardedReady || disabled}
              onPress={watchAd}
            />
            {!ads.rewardedReady && (
              <View style={{ marginTop: 10 }}>
                <Button
                  label="Retry loading test ad"
                  secondary
                  onPress={() => {
                    void ads.controller.start();
                  }}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[s.small, { marginBottom: 16 }]}>
              AdMob test ads run in the Android APK. No video or ad reward is
              simulated in this browser.
            </Text>
            <Button
              label={
                offer === "revive"
                  ? "Use a free preview revive"
                  : "Use a free preview hint"
              }
              onPress={previewReward}
            />
          </>
        )}
        <View style={{ height: 10 }} />
        <Button
          label={
            offer === "revive" ? "Back to restart options" : "Keep playing"
          }
          secondary
          onPress={closeOffer}
        />
      </Dialog>
      <Dialog visible={win} onClose={() => setWin(false)}>
        {win && <Celebration motion={motion} />}
        <View style={s.winMark}>
          <Icon name="wind" size={34} color="#718D54" />
        </View>
        <Text style={[s.dialogTitle, { textAlign: "center" }]}>
          Room to breathe.
        </Text>
        <Text style={[s.body, { marginTop: 10, textAlign: "center" }]}>
          Every arrow found its way. A little less tangled, a little more clear.
        </Text>
        <View style={s.stars}>
          {[0, 1, 2].map((i) => (
            <Icon
              key={i}
              name="star"
              size={29}
              color={i < stars ? "#B29C56" : "#D9E1D0"}
            />
          ))}
        </View>
        <Button
          label={
            mode === "daily"
              ? "Back to my journey"
              : level < levels.length - 1
                ? "Next puzzle"
                : "Explore my journey"
          }
          icon="arrow-right"
          onPress={nextPuzzle}
          disabled={disabled}
        />
        <View style={{ height: 10 }} />
        <Button label="Stay a moment" secondary onPress={() => setWin(false)} />
      </Dialog>
    </SafeAreaView>
  );
}
