# AGENTS.md

## Project Shape
- This is a small static browser game, not a packaged app: no `package.json`, lockfile, bundler, test runner, or build step is present.
- Main entrypoint is `src/index.html`; open or serve that path, not the old deleted `stick_game.html`.
- Code is split across `src/index.html`, `src/styles.css`, and `src/game.js`; keep changes in those files unless adding a real new concern.

## Run And Verify
- Quick local run: open `C:\tmp\game\src\index.html` in a browser.
- Preferred local run from `C:\tmp\game`: `python -m http.server 8000`, then browse to `http://localhost:8000/src/`.
- Node alternative from `C:\tmp\game`: `npx http-server . -p 8000`, then browse to `http://localhost:8000/src/`.
- JS syntax check: `node --check src\game.js`.
- Manual smoke test: menu appears, `INICIAR JUEGO` starts, `A/D/W/S/J/K` work, game over appears at `0%`, `REINICIAR` restarts, `MENU` returns to menu.

## Runtime Notes
- `gameState` in `src/game.js` controls simulation: `menu` and `gameOver` stop updates; only `playing` advances physics, AI, and combat.
- Mobile controls are hidden outside `playing`; call `updateControlsVisibility()` when changing state.
- Web Audio is created lazily after user interaction via `initAudio()` to satisfy browser autoplay policies.
- Canvas uses fixed logical dimensions `1000x500`; CSS scales display only. Be careful when adding hitboxes or responsive behavior.

## Conventions
- Preserve the current no-dependency setup unless a requested feature clearly needs tooling.
- Keep UI text Spanish unless the user asks otherwise.
- Update `Readme.md` when changing run instructions, controls, game states, or implemented backlog items.
