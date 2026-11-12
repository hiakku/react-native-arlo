# Arlo

The game is branded **Arlo**, with a public browser version and an Android preview build.

- Web: all 60 campaign puzzles, daily flow, saved browser progress, free unlimited hints and one free revive per round. No account, purchases or ads.
- Run `npm run build:web` to generate the static `dist/` website. `vercel.json` supports source-based builds; the tested compiled files can also be deployed directly as static assets.
- `src/app/+html.tsx` includes the Expo SDK 58 server document nodes required to load fonts and JavaScript.
- The game mounts after hydration to keep browser-size-dependent markup consistent with the static document.
- The existing progress key and internal Android package remain unchanged so the display-name change does not discard local saves.
- Public hosting uses Cloudflare Pages; see the website deployment section below.

The earlier prototype notes below describe the Android test-ad path, which is retained for later and disabled on the website.

# Arrow Room

An independent React Native / Expo arrow-escape puzzle game. This project does not change Huedrop, Cue Teleprompter or Kira Avatar.

## Play

Tap any part of an arrow whose tip has an empty route to the board edge. It unwinds along its bends and escapes. Arrows in its way must leave first. Empty-space taps do nothing; blocked arrows cost one heart.

- 60 verified campaign boards with increasing size/density and progressive unlocks.
- A deterministic daily puzzle based on the device's local calendar date. The same date produces the same board; a resumed game retains its original date.
- Three hearts, stars, saved progress, numbered-arrow preference and reduced-motion support.
- Three starter hint credits; only a new successful hint spends one. Restarting remains free and retains credits/best stars.
- One optional revive per round restores three hearts on the same board. A revived finish earns at most two stars.
- Android test-ad integration: explicit rewarded ads for hints or a revive; an occasional interstitial at a new-completion milestone, with cooldowns. Test ads earn nothing.
- The browser does not load native ads or simulate rewarded-video completion. Its free preview hint/revive is clearly labelled.

## Run

Node 22.13+ LTS, 24.3+ or 26+.

```sh
npm ci
npm run web -- --port 8084
npm run check
npx expo-doctor@1.21.6
```

Expo SDK 58. Dependencies come from SDK-compatible Expo installs. The current expo-doctor 1.21.7 package failed before running its checks (`@expo/env` / boolish); 1.21.6 successfully ran all 20 checks. Lint, TypeScript, 15 tests and an Android/Hermes export pass.

## Android

`eas.json` contains a preview APK profile. The project is linked to `@chit20/arrow-room` (Expo project `5b2add17-0bc1-4cf3-8fc8-7f3d8b7dd4a9`). Preview builds produce a signed APK for direct Android installation. Phone testing and store submission remain separate steps.

```sh
npx eas-cli@latest login
npm run build:preview
```

The AdMob module requires this custom native build. It does not run in Expo Go or the browser. The application ID is `com.chit20.arrowroom`. App name/package availability must be checked before a public release.

## Sources

- `src/engine.ts`: collision rays, geometry validation, deterministic generator, solver and escape-window animation geometry.
- `src/levels.json`: committed campaign boards and verified solution orders.
- `src/session.ts`: independent versioned saves under `arrow-room.progress.v1`.
- `src/app/index.tsx`: puzzle flow, hearts, hints, daily mode and rewards.
- `src/Board.tsx`: rounded SVG arrows and their touch targets. Every arrow cell is tappable; only each head enters accessibility order.
- `src/ads/`: reusable test-ad lifecycle controller and native/web adapters.
- `scripts/generate-levels.mjs`: deterministic campaign generation. Preserve existing boards/IDs if updating a released campaign.
- `scripts/render-icon.mjs`: render the original SVG arrow mark into app-icon PNGs.

Progress is local. Uninstalling/clearing data removes it. Corrupt/unsupported saves are preserved and produce an error rather than being overwritten. There is no account, purchase system, leaderboard or backend. The native test-ad SDK contacts Google; the browser does not.

## Revenue status

The monetisation mechanics are implemented with Google demonstration IDs. They currently generate no revenue. Before live ads, the owner must configure their AdMob app/unit IDs, consent and privacy handling, complete store/ad-network requirements and perform device QA. The production build profile deliberately blocks this test-only configuration. See MONETIZATION.md.

## Website deployment

Public website: https://hiakku-arlo.pages.dev/

Build with Node 22.13+ and deploy the compiled website to Cloudflare Pages:

```sh
npm run build:web
npx wrangler@4.160.1 pages deploy dist --project-name hiakku-arlo --branch main
```

The post-export script moves Expo dependency assets out of `assets/node_modules/` because Cloudflare excludes directories with that name. Only compiled website assets are uploaded. This is a direct upload deployment; GitHub pushes do not automatically redeploy it.

### Current Android preview

Build: https://expo.dev/accounts/chit20/projects/arrow-room/builds/f2811b36-7e72-4582-a32b-f460663f61ab

Version `0.1.0` (Android version code `1`), package `com.chit20.arrowroom`. This preview includes Google demonstration ads, which generate no revenue. Android signing credentials are managed by Expo and are not committed to GitHub.

Download the signed Android APK: https://expo.dev/artifacts/eas/NCpY26qCUWH40V4xYf2Eq1tXs3H2KQGsfcZsKwzPnnQ.apk

Build status: finished. APK archive integrity, package identity and signing-block presence were verified. Installation and gameplay on a physical Android device still need testing.
