# Arrow Room revenue preparation

## Implemented mechanics

The Android preview uses Google test app/ad-unit IDs in all build modes, rather than switching to live units based on __DEV__.

- Optional rewarded ad: one hint credit, or three restored hearts on the current board, once per round.
- Rewards are granted only once after EARNED_REWARD. Closing early or resolving show() does not grant a reward.
- Interstitials are attempted only at Next after each fifth newly completed campaign puzzle. Replays and daily puzzles do not advance that milestone. Session spacing: at least 180 seconds between breaks, and no break within 90 seconds of a rewarded presentation.
- No ad opens at app launch or on an arrow tap. Unavailable or rejected interstitials skip straight to normal play. No late-loaded ad interrupts a puzzle.
- Retry/load-state guards, stale-inventory checks and listener cleanup are covered by automated tests.

## Still needed for live earnings

1. An owner-controlled AdMob account and the Arrow Room Android app ID plus rewarded/interstitial unit IDs. Huedrop's app IDs must not be reused for this independent app.
2. UMP consent before SDK initialization/ad requests, appropriate privacy-options controls, and invalidation of loaded ads when privacy choices change. Non-personalized requests alone do not replace consent requirements. The current adapter is explicitly demo-only and contains no live-ad path.
3. Hosted privacy policy, accurate store data-safety/contains-ads/target-audience declarations and any required app-ads.txt setup. The SDK content-rating cap is not a target-audience declaration.
4. Supported-store listing, account/app approval, and physical-device tests of ad completion, early exit, offline/no-fill, app backgrounding and recovery.
5. Replace the production-profile guard only after the live configuration and privacy flow are reviewed. Build a store AAB separately from a preview APK.

This is ordinary ad-supported entertainment, not a play-to-earn product. There are no cash prizes, withdrawable balances or purchases. Downloads and test ads generate no revenue. A popular game format is evidence of demand, not a guarantee that this app will be discovered or earn.
