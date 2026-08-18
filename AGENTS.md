# AGENTS.md

## Project Shape
- This is a small static browser game, not a packaged app: no `package.json`, lockfile, bundler, or build step is present.
- The current product identity is `GLITCH DUEL`; avoid reintroducing previous branding in active UI or docs.
- Main entrypoint is `src/index.html`; open or serve that path, not the old deleted `stick_game.html`.
- Code is split across `src/index.html`, `src/styles.css`, `src/i18n.js`, `src/config.js`, `src/input.js`, `src/audio.js`, `src/effects.js`, `src/ai.js`, `src/fighter_render.js`, `src/fighter.js`, `src/arena_render.js`, `src/hud_render.js`, and `src/game.js`; keep new gameplay logic in the closest existing file.
- Unit tests live in `tests/game.test.js` and use Node's built-in `node:test` with DOM/canvas/audio mocks; no npm install is needed.

## Run And Verify
- Quick local run: open `C:\tmp\game\src\index.html` in a browser.
- Preferred local run from `C:\tmp\game`: `python -m http.server 8000`, then browse to `http://localhost:8000/src/`.
- Node alternative from `C:\tmp\game`: `npx http-server . -p 8000`, then browse to `http://localhost:8000/src/`.
- GitHub Pages uses `.github/workflows/pages.yml`: pull requests and pushes validate every `src/*.js` file plus `tests/game.test.js`, and deployment publishes `src/` only after validation passes; keep this no-build gate unless the project architecture changes.
- JS syntax check: run `node --check` for each `src\*.js` file.
- Unit tests: `node --test tests\game.test.js`.
- Manual smoke test: menu appears with balanced text layout, a compact desktop card, a dominant start action, one-row secondary actions when width allows, and a unified shortcut/GitHub footer, `CARRERA ARCADE` starts a five-fight fixed run with click-to-continue intermissions and a final summary, menu selections restore after leaving a run, language selector switches Spanish/English and persists, `Tab` shows visible focus including native touch buttons, help/onboarding/pause/game-over/controls dialogs contain and restore focus, browser zoom remains usable at 200%, difficulty selector changes CPU behavior, arena selector changes background, fighter style selector changes player tuning, rival selector changes CPU badge/color/VS phrase without changing difficulty behavior, `Reducir movimiento` follows the system preference when unset and persists manual choice while reducing impact shake, `CONTROLES`/`CONTROLS` captures a free key, rejects conflicts/reserved keys, persists after reload, and restores defaults, a standard gamepad controls combat and confirm/cancel navigation, gamepad disconnect and blur release input, `AYUDA`/`HELP` opens help, `VOLVER`/`BACK` returns, `Esc` closes help but does not dismiss onboarding or game over, `INICIAR JUEGO`/`START GAME` starts, default or remapped actions work, arrow keys move/jump/crouch, air attacks work once per jump, combos show distinct visual feedback, `P`/`Esc` and gamepad Start pause/resume with summary, timer and combat recovery stay consistent at 30/60/120 FPS, changing window or hiding the page clears input and pauses until explicit resume, health bars animate after damage, style/air victory phrases can appear after game over, stats update after game over, mobile landscape shows toolbar/HUD/arena/pause/touch controls without critical overlap, simultaneous touch controls work and cancelled gestures release, portrait phone shows orientation warning with usable degraded layout, low-height menu/help/pause/game-over/controls overlays remain vertically scrollable, long rival badges and feedback text stay inside the canvas corners, canvas stays proportional after resize, game over appears at `0%`, `REINICIAR`/`RESTART` restarts, `MENU` returns to menu.

## Phase 1 Smoke Additions
- Canvas receives focus after start/restart/resume, Tab bridges Canvas and pause, Ctrl/Alt/Meta shortcuts pass through, and Enter/Space preserve native button/link/summary activation.
- Combo follow-ups work across real cooldown boundaries; toolbar/pause show mode/progress; touch Special exposes charging/ready text and ARIA state; ES/EN labels survive changes; debug metrics remain opt-in and in memory.

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
- Training trials are a substate of `gameMode === 'training'`: `free`, `combos`, `crouchPunish`, `blockCounter`, and `specialSpend`; progress is session-only, uses real `attackResolved`/`energyReady` events, and must not update stats/history.
- Trial cues and response windows advance only in fixed simulation ticks; reset, pause, hidden-page return, KO and trial changes clear temporary progress without persisting it.
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
