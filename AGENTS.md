# AGENTS.md

## Project Shape
- This is a small static browser game, not a packaged app: no `package.json`, lockfile, bundler, or build step is present.
- The current product identity is `GLITCH DUEL`; avoid reintroducing previous branding in active UI or docs.
- Main entrypoint is `src/index.html`; open or serve that path, not the old deleted `stick_game.html`.
- Code is split across `src/index.html`, `src/styles.css`, `src/i18n.js`, `src/config.js`, `src/audio.js`, `src/effects.js`, `src/ai.js`, `src/fighter_render.js`, `src/fighter.js`, `src/arena_render.js`, `src/hud_render.js`, and `src/game.js`; keep new gameplay logic in the closest existing file.
- Unit tests live in `tests/game.test.js` and use Node's built-in `node:test` with DOM/canvas/audio mocks; no npm install is needed.

## Run And Verify
- Quick local run: open `C:\tmp\game\src\index.html` in a browser.
- Preferred local run from `C:\tmp\game`: `python -m http.server 8000`, then browse to `http://localhost:8000/src/`.
- Node alternative from `C:\tmp\game`: `npx http-server . -p 8000`, then browse to `http://localhost:8000/src/`.
- GitHub Pages deploy uses `.github/workflows/pages.yml` and publishes `src/` as the site root via GitHub Actions; keep this no-build workflow unless the project architecture changes.
- JS syntax check: run `node --check` for each `src\*.js` file.
- Unit tests: `node --test tests\game.test.js`.
- Manual smoke test: menu appears with balanced text layout, language selector switches Spanish/English and persists, `Tab` shows visible focus, difficulty selector changes CPU behavior, arena selector changes background, fighter style selector changes player tuning, `Reducir movimiento` persists and reduces impact shake, `AYUDA`/`HELP` opens help, `VOLVER`/`BACK` returns, `INICIAR JUEGO`/`START GAME` starts, `A/D/W/S/I/J/K/L` work, arrow keys move/jump/crouch, `C` crouches, `S` and `I` block, air `J`/`K` work once per jump, combos `J,J`, `J,K`, and `K,K` work and show distinct visual feedback, `P`/`Esc` pause and resume with round/score/time/difficulty/arena summary, timer counts down in real seconds during play, health bars animate after damage, style/air victory phrases can appear after game over, stats update after game over, mobile landscape shows HUD/arena/pause/touch controls without critical overlap, portrait phone shows orientation warning with usable degraded layout, low-height overlays remain scrollable, canvas stays proportional after resize, game over appears at `0%`, `REINICIAR`/`RESTART` restarts, `MENU` returns to menu.

## Runtime Notes
- `gameState` in `src/game.js` controls simulation: `menu`, `paused`, `roundOver`, and `gameOver` stop updates; only `playing` advances physics, AI, and combat.
- Round timer uses delta time from `requestAnimationFrame(timestamp)`; cooldowns, combo windows, hit-stun, hit-stop, and visual timers remain frame-based.
- Mobile controls and the pause button are hidden outside `playing`; call `updateControlsVisibility()` when changing state.
- Web Audio is created lazily after user interaction via `initAudio()` to satisfy browser autoplay policies.
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
