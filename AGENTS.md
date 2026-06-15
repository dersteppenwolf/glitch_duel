# AGENTS.md

## Project Shape
- This is a small static browser game, not a packaged app: no `package.json`, lockfile, bundler, or build step is present.
- Main entrypoint is `src/index.html`; open or serve that path, not the old deleted `stick_game.html`.
- Code is split across `src/index.html`, `src/styles.css`, `src/config.js`, `src/audio.js`, `src/effects.js`, `src/fighter.js`, and `src/game.js`; keep new gameplay logic in the closest existing file.
- Unit tests live in `tests/game.test.js` and use Node's built-in `node:test` with DOM/canvas/audio mocks; no npm install is needed.

## Run And Verify
- Quick local run: open `C:\tmp\game\src\index.html` in a browser.
- Preferred local run from `C:\tmp\game`: `python -m http.server 8000`, then browse to `http://localhost:8000/src/`.
- Node alternative from `C:\tmp\game`: `npx http-server . -p 8000`, then browse to `http://localhost:8000/src/`.
- JS syntax check: run `node --check` for each `src\*.js` file.
- Unit tests: `node --test tests\game.test.js`.
- Manual smoke test: menu appears, difficulty selector changes CPU behavior, arena selector changes background, `AYUDA` opens help, `VOLVER` returns, `INICIAR JUEGO` starts, `A/D/W/S/J/K/L` work, combos `J,J` and `J,K` work, `P`/`Esc` pause and resume, timer counts down during play, health bars animate after damage, stats update after game over, portrait phone shows orientation warning, canvas stays proportional after resize, game over appears at `0%`, `REINICIAR` restarts, `MENU` returns to menu.

## Runtime Notes
- `gameState` in `src/game.js` controls simulation: `menu`, `paused`, `roundOver`, and `gameOver` stop updates; only `playing` advances physics, AI, and combat.
- Mobile controls and the pause button are hidden outside `playing`; call `updateControlsVisibility()` when changing state.
- Web Audio is created lazily after user interaction via `initAudio()` to satisfy browser autoplay policies.
- Canvas simulation uses fixed logical dimensions `1000x500`; `resizeCanvas()` maps that space to a responsive CSS size and DPR-aware backing store. Keep hitboxes in logical coordinates.

## Conventions
- Preserve the current no-dependency setup: use browser/Node native APIs only, unless an explicit architecture decision justifies external libraries.
- If proposing an external dependency, document why it is needed and how it changes local run/test commands before adding it.
- Keep UI text Spanish unless the user asks otherwise.
- Update `Readme.md` when changing run instructions, controls, game states, or implemented backlog items.
