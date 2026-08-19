# AGENTS.md

## Project Shape
- This is a small static browser game, not a packaged app: no `package.json`, lockfile, bundler, or build step is present.
- The current product identity is `GLITCH DUEL`; avoid reintroducing previous branding in active UI or docs.
- Main entrypoint is `src/index.html`; open or serve that path, not the old deleted `stick_game.html`.
- Code is split across `src/index.html`, `src/styles.css`, `src/i18n.js`, `src/config.js`, `src/input.js`, `src/audio.js`, `src/effects.js`, `src/ai.js`, `src/fighter_render.js`, `src/fighter.js`, `src/arena_render.js`, `src/hud_render.js`, and `src/game.js`; keep new gameplay logic in the closest existing file.
- Unit tests live in `tests/game.test.js` and use Node's built-in `node:test` with DOM/canvas/audio mocks; no npm install is needed.

## Run And Verify
- Quick local run: open `src/index.html` in a browser.
- Preferred local run from the repository root: `python -m http.server 8000`, then browse to `http://localhost:8000/src/`.
- Node alternative from the repository root: `npx http-server . -p 8000`, then browse to `http://localhost:8000/src/`.
- GitHub Pages uses `.github/workflows/pages.yml`: pull requests and pushes validate every `src/*.js` file plus `tests/game.test.js`, and deployment publishes `src/` only after validation passes; keep this no-build gate unless the project architecture changes.
- JS syntax check: run `node --check` for each `src\*.js` file.
- Unit tests: `node --test tests\game.test.js`.
- Browser, hardware, assistive-technology, performance and player validation evidence is recorded only in `plans/plan_0043_validacion_humana_consolidada.md`; do not duplicate or claim those checks from mocks.

## Runtime Notes
- `gameState` in `src/game.js` controls simulation: `menu`, `paused`, `roundOver`, and `gameOver` stop updates; only `playing` advances physics, AI, and combat.
- Combat uses bounded fixed 60 Hz simulation steps accumulated from `requestAnimationFrame(timestamp)`; movement, round timer, cooldowns, combo windows, hit-stun, hit-stop, and AI timing advance only in those steps. Reset the clock on pause, resume, round start, and hidden-page return to avoid catch-up.
- `?debug=1` or backtick enables developer combat diagnostics; `?seed=<uint32>` seeds simulation RNG for reproducible matches. Training reuses the normal simulation and must not duplicate fighter or combat rules.
- Mobile controls and the pause button are hidden outside `playing`; call `updateControlsVisibility()` when changing state.
- Web Audio is created lazily after user interaction via `initAudio()` to satisfy browser autoplay policies.
- `src/input.js` aggregates keyboard, pointer, and standard gamepad sources into actions; persisted keyboard mappings use physical `KeyboardEvent.code`, while Escape, Tab, backtick, browser shortcuts, and modifier combinations remain reserved.
- Gameplay keyboard focus is `#game`; Tab connects it with the pause button. Ctrl/Alt/Meta combinations and native editing/navigation targets must not become combat actions, while only Enter/Space are reserved on buttons, links, and summaries.
- Grounded combo follow-ups use one fixed-step `pendingComboInput`; interruption clears the full combo sequence, and taps that begin and end between simulation ticks are not queued.
- Touch controls keep localized child labels; `renderTouchSpecialState()` is the only writer of special readiness state and updates DOM only when its cached signature changes.
- Debug timing and audio lifecycle diagnostics are opt-in, bounded, in-memory, and never persisted or sent over the network. Web Audio tone graphs must disconnect idempotently after ending.
- `#combat-status` is a non-live DOM summary; `Digit0`, a remapped status edge, gamepad button 8, or opening its details can query a localized snapshot without per-frame announcements. Binding storage v2 migrates v1 without stealing user keys.
- Training trials are a substate of `gameMode === 'training'`: `free`, `combos`, `crouchPunish`, `blockCounter`, and `specialSpend`; `glitchCancel` is a separate experimental Training option outside `n/4`. Progress is session-only, uses real combat events, and must not update stats/history.
- Trial cues and response windows advance only in fixed simulation ticks; reset, pause, hidden-page return, KO and trial changes clear temporary progress without persisting it.
- GLITCH CANCEL is Training-experiment-only and P1-only: after post-decrement recovery remains on a grounded punch/kick whiff, a new Special edge spends exactly 25, clears recovery/pending combo, and consumes that offensive tick. It never applies to hit/block, combos, air, Special, CPU, Versus, or Arcade; neutral Special still costs 100.
- `getSpecialActionState()` is authoritative for touch/Canvas/status feedback. Native touch-button click activation is held through one input snapshot for assistive technology, while pointer/keyboard/gamepad sources still aggregate without double spending.
- Help/onboarding guidance keeps keyboard, touch, and standard gamepad visible; `recentInputMethod`, `guidanceInputMethod`, and `pendingStartMode` are session-only, and onboarding completion/skip starts the requested mode.
- Contextual CPU tactics remain rule-based: one observed attack sequence can trigger one whiff opportunity, crouch only answers dominant punch patterns, bait reuses retreat away from walls, and air attacks use real hitboxes once per jump.
- Canvas simulation uses fixed logical dimensions `1000x500`; `resizeCanvas()` maps that space to a responsive CSS size and DPR-aware backing store. Keep hitboxes in logical coordinates.

## Conventions
- Preserve the current no-dependency setup: use browser/Node native APIs only, unless an explicit architecture decision justifies external libraries.
- If proposing an external dependency, document why it is needed and how it changes local run/test commands before adding it.
- Keep Spanish as the default/fallback UI language; English strings live in `src/i18n.js`.
- Update `Readme.md` when changing run instructions, controls, game states, or implemented backlog items.

## ExecPlans
- Follow `PLANS.md` for any substantial implementation plan.
- Store plans in `plans/` using `plans/plan_<nnnn>_<objetivo>.md`, with zero-padded incremental numbers.
- Validate proposed ExecPlans with the `karpathy-guidelines` skill before finalizing them.
- Keep plans current when scope, validation, or implementation details change.
