# Arrow Room prototype validation · 11 November 2026

- `npm run check`: ESLint, TypeScript and all 15 tests pass.
- Tests cover 60 valid/nonoverlapping solvable campaign boards, replayable solutions, collision rays, arbitrary valid removal order, deterministic daily generation, bend-following escape geometry, malformed saves, persisted progress/credits, rewarded-ad idempotency, early exit, SDK errors, no inventory, retries, stale inventory, cooldowns and controller cleanup.
- `npx expo-doctor@1.21.6`: 20/20 checks. The 1.21.7 CLI had a package/runtime failure before checking the project; this is documented in README.
- `npx expo export --platform android --output-dir ../../work/arrow-room-android-export`: successful Hermes export including the native ads adapter. This does not prove native build/install/ad serving.
- Browser test at isolated 127.0.0.1 origin: blocked arrow consumes a heart without removal; three failures reach game-over; optional free preview revive restores three hearts on the same board; successful escape removes the correct arrow; hints decrement only for a new hint; all five tutorial arrows clear; revived finish records two stars; Next unlocks puzzle 2; reload restores its board/preferences/balance; Daily Flow creates a 19-arrow puzzle for the current date.
- Mobile layout checked at 319px and 390×844, desktop at 1280px. No horizontal page overflow at desktop. Duplicate screen-reader targets and an invalid SVG accessibility prop were fixed. Final isolated browser console has no warnings/errors.
- User-facing localhost origin was left on the fresh first puzzle. Test data uses a separate browser origin. Viewport override reset and test tab closed.
- React review: expensive daily generation is memoised by primitive puzzle identity; ad SDK stays out of web bundles; transient animation callbacks use refs; persisted state is schema-validated; timers/listeners/animations clean up; empty-space taps have no handler; every arrow cell is tappable but only heads appear in accessibility order. Motion respects device reduced-motion settings and the in-game toggle.
- Native APK, on-device behavior, live ads, store listing and public release remain pending.

## Arlo website preparation

- Renamed visible branding, document title and app display name to Arlo. Internal save key retained.
- Web hints are unlimited and a single free revive restores three hearts; Android test-ad mechanics are held for later. Public web settings do not advertise test ads.
- Static build verified on 127.0.0.1:8085: page startup, preferences, five free hints, full tutorial win and three-star award.
- Fixed missing SDK 58 document nodes and browser-size-dependent hydration mismatch. Fresh post-fix browser console has no errors/warnings.
- ESLint/TypeScript and all 15 unit tests pass; static export succeeds.
- Compiled public artifact: 27 files, approximately 1.5 MB; no source maps or environment credentials.
- Vercel connector still returned 403 after team approval. Direct CLI login approval is pending. Native app work is on hold.
