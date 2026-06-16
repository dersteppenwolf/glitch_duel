# GLITCH DUEL

Line-art arcade fighting web game built with plain HTML, CSS, and JavaScript on Canvas. The human player fights a CPU in best-of-3 rounds with combos, blocking, a special attack, themed arenas, touch controls, and a Spanish/English interface.

Play online: [https://dersteppenwolf.github.io/glitch_duel/](https://dersteppenwolf.github.io/glitch_duel/)

Source code: [https://github.com/dersteppenwolf/glitch_duel](https://github.com/dersteppenwolf/glitch_duel)

Note: this application has been generated and evolved with assistance from OpenCode and GPT-5.5.

![GLITCH DUEL gameplay trailer](docs/assets/glitch-duel-trailer.gif)

## Summary

| Topic | Detail |
| --- | --- |
| Type | Static browser web game. |
| Stack | Plain HTML, CSS, JavaScript, and Canvas. |
| Dependencies | None to play, validate, or deploy. |
| Local entrypoint | `src/index.html`. |
| Public URL | `https://dersteppenwolf.github.io/glitch_duel/`. |
| Deploy | GitHub Pages with Actions publishing `src/`. |
| Tests | `node --test tests\game.test.js`. |
| Status | Playable, published, and backed by a prioritized backlog. |
| Assistance | OpenCode and GPT-5.5. |

## Table Of Contents

- [Summary](#summary)
- [Quick Start](#quick-start)
- [How To Play](#how-to-play)
- [Controls](#controls)
- [Languages](#languages)
- [Arenas](#arenas)
- [Features](#features)
- [Features: Combat](#combat)
- [Features: UI/UX](#uiux)
- [Features: Visual And Audio](#visual-and-audio)
- [Features: Technical](#technical)
- [Run](#run)
- [Run: Requirements](#requirements)
- [Run: Direct Option](#direct-option)
- [Run: Recommended Option](#recommended-option)
- [Online Publishing](#online-publishing)
- [Validation](#validation)
- [Validation: Automated Validation](#automated-validation)
- [Validation: Basic Smoke](#basic-smoke)
- [Validation: Combat Smoke](#combat-smoke)
- [Validation: Visual And Accessibility Smoke](#visual-and-accessibility-smoke)
- [Architecture](#architecture)
- [Architecture: Main Files](#main-files)
- [Architecture: Script Order](#script-order)
- [Architecture: Game States](#game-states)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Technical Decisions](#technical-decisions)
- [Prioritized Backlog](#prioritized-backlog)
- [Completed Backlog](#completed-backlog)

## Quick Start

To play without installing anything, open the published version:

[https://dersteppenwolf.github.io/glitch_duel/](https://dersteppenwolf.github.io/glitch_duel/)

To run locally, use a static server from the project root.

From `C:\tmp\game`:

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/src/
```

Quick validation:

```powershell
node --test tests\game.test.js
```

No `npm install`, `package.json`, bundler, or backend server is required.

## How To Play

1. Open `src/index.html` directly or serve the project from `http://localhost:8000/src/`.
2. Choose language, difficulty, arena, and fighter style from the menu.
3. Press `INICIAR JUEGO` / `START GAME`.
4. Win rounds by reducing the CPU health to `0%` or having more health when time runs out.
5. Win 2 rounds to finish the match.

## Controls

| Action | Keyboard | Touch | Note |
| --- | --- | --- | --- |
| Move left | A / left arrow | Left | Horizontal movement. |
| Move right | D / right arrow | Right | Horizontal movement. |
| Jump | W / up arrow | JUMP | Ground only. |
| Crouch | C / down arrow | CROUCH | Lowers the hitbox and avoids some high hits. |
| Block | S / I | BLOCK | Reduces damage, but does not remove it completely. |
| Punch | J | PUNCH | Fast, shorter range. |
| Kick | K | KICK | Longer range, longer recovery. |
| Air punch / air kick | J / K while jumping | PUNCH / KICK while jumping | One air attack per jump. |
| Special | L | SPECIAL | Requires full energy and consumes the full bar. |
| Pause / resume | P / Esc | PAUSA | Shows the match summary. |

Available combos:

| Combo | Result |
| --- | --- |
| J, J | Fast punch combo. |
| J, K | Punch chained into kick, with more range and damage. |
| K, K | Heavy back kick, with more damage and slow recovery. |

The second combo key must be pressed within the combo window. If you wait too long, the normal attack for the pressed key comes out instead.

Energy charges when hitting, taking damage, or blocking. `L` is not a normal strike: it only activates the special when the bar is full.

## Languages

The interface supports:

| Code | Language |
| --- | --- |
| `es` | Spanish |
| `en` | English |

Behavior:

- Spanish is the default and fallback language.
- If there is no saved preference, the game detects `navigator.languages` / `navigator.language`.
- If the browser language starts with `es`, it uses Spanish.
- If it starts with `en`, it uses English.
- Other languages fall back to Spanish.
- The `Idioma / Language` selector stores the preference in `localStorage` with the `glitchDuelLanguage` key.
- If an older preference exists in `xkcdKombatLanguage`, it is read as a fallback and new writes use `glitchDuelLanguage`.

Not all decorative arena text or technical jokes are translated; some remain as part of the visual style.

## Arenas

| Arena | Theme |
| --- | --- |
| CUADERNO / NOTEBOOK | Sketches, notes, and doodles. |
| CAFETERIA / CAFETERIA | Coffee, table, menu, and steam. |
| LABORATORIO / LAB | Science, formulas, and panels. |
| REUNION PRESENCIAL / IN-PERSON MEETING | Office, projector, and sticky notes. |
| REUNION REMOTA / REMOTE MEETING | Video call, chat, mute, and lag. |
| CLASE DE MATEMATICAS / MATH CLASS | Blackboard, formulas, and absurd theorems. |
| SERVIDOR CAIDO / SERVER DOWN | Broken rack, 500 errors, and retries. |
| CONVENCION GEEK / GEEK CONVENTION | Booths, stickers, and infinite queue. |

Arenas are visual only. They do not modify damage, speed, AI, hitboxes, or victory rules.

## Features

### Combat

- Human vs CPU combat.
- Best-of-3 rounds.
- 60-second timer per round.
- `FACIL`, `NORMAL`, and `DIFICIL` difficulty.
- Logical hitboxes for body, punch, kick, combos, and special.
- Blocking with chip damage.
- Crouch with low hitbox.
- Air punch and air kick, limited to one air attack per jump.
- `J,J`, `J,K`, and `K,K` combos.
- Special attack on `L` with full energy and stronger visual feedback.
- Fighter styles: balanced, fast, heavy, and technical.
- AI with difficulty-based reactions, range-aware attacks, tactical specials, counter windows, short memory, and wall-aware defense.

### UI/UX

- Main menu.
- Help screen.
- Persistent language selector.
- Difficulty selector.
- Arena selector with visual preview and description.
- Fighter style selector.
- Arcade `VS` intro with difficulty and arena before each round.
- `Reducir movimiento` option persisted in `glitchDuelReducedMotion`, with fallback reads from `xkcdKombatReducedMotion`.
- Pause screen with round, score, time, difficulty, arena, and controls summary.
- Game over screen with final summary, post-match medal, `REINICIAR` / `RESTART`, and `MENU`.
- Local stats with wins, losses, current streak, and best streak, persisted in `glitchDuelStats` with fallback reads from `xkcdKombatStats`.
- Visible focus and ARIA labels on main controls.
- Responsive touch controls with safe areas, prioritized landscape view, and degraded portrait layout with orientation warning.

### Visual And Audio

- Differentiated characters: human with blue `P1` badge and band; CPU with red `AI` badge, visor, and antenna.
- CPU visual details vary by difficulty.
- Animated high-contrast health bars with threshold colors.
- High-contrast energy bars with a visual marker when the special is ready.
- `ESPECIAL LISTO` indicator above the character when energy is full.
- Monospace typography based on `JetBrains Mono`, with local fallbacks and no external dependencies.
- HUD and impact feedback tied to character color so attacks are easier to read.
- Victory and defeat poses when rounds or matches end.
- Post-match medals such as `Bug Exterminator`, `Firewall Humano`, `Combo Goblin`, and `404 Survivor`.
- `ROUND`, `FIGHT!`, `TIME!`, `K.O.`, and block messages in arcade panels.
- Flash, trail, and `SPECIAL!` text when spending the energy bar.
- Combo feedback with text, halo/trail, and combo-window hint.
- Stylized shake, hit-stop, and impact particles.
- Themed arena backgrounds with light animations that respect `Reducir movimiento`.
- Audio generated with the Web Audio API, with distinct sounds for attacks, impact, block, combo, special, and UI.

### Technical

- Static project with no external dependencies.
- Classic scripts, no ES modules and no build step.
- Canvas uses a fixed logical space of `1000x500`.
- Round timer is based on delta time from `requestAnimationFrame(timestamp)`.
- Cooldowns, combo window, hit-stun, hit-stop, and visual timers remain frame-based.
- AI is separated in `src/ai.js`.
- Fighter rendering is separated in `src/fighter_render.js`.
- i18n is separated in `src/i18n.js`.
- Unit tests use `node:test` with DOM/canvas/audio mocks.

## Run

### Requirements

| Need | Option |
| --- | --- |
| Browser | Any modern browser with Canvas and Web Audio. |
| Recommended local server | Python, included in many Windows/macOS/Linux installations. |
| Local alternative | `npx http-server` if Node is available. |
| Tests | Node.js with native `node:test`. |

Nothing is installed inside the project.

### Direct Option

Open in a browser:

```text
C:\tmp\game\src\index.html
```

### Recommended Option

From `C:\tmp\game`:

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/src/
```

Node alternative:

```powershell
npx http-server . -p 8000
```

## Online Publishing

The repo includes GitHub Pages with Actions in `.github/workflows/pages.yml`.

The workflow publishes the `src/` folder as the site root, so the expected URL is:

```text
https://dersteppenwolf.github.io/glitch_duel/
```

Required GitHub configuration:

- Go to the repository on GitHub.
- Open `Settings > Pages`.
- Under `Build and deployment`, set `Source: GitHub Actions`.
- Do not select `Deploy from a branch`; the site is published with the `.github/workflows/pages.yml` workflow.
- Confirm the repository has Actions enabled in `Settings > Actions > General`.
- Push to `main` or manually run `Deploy GitHub Pages` from the `Actions` tab.
- Wait for the workflow to finish green.
- Open the URL published by the workflow or the expected URL listed above.

Permissions used by the workflow:

- `contents: read` to read the repository.
- `pages: write` to publish to GitHub Pages.
- `id-token: write` to authenticate the official Pages deployment.

Post-deploy verification:

- The URL should load the main menu without `/src/` in the path.
- Styles should be applied.
- The language, difficulty, and arena selectors should work.
- Starting a match should load the canvas and respond to keyboard input.
- If the page shows 404, check that `Source` is `GitHub Actions` and that the latest workflow completed successfully.

There is no build step: `src/index.html`, `src/styles.css`, and the scripts in `src/` are uploaded directly.

## Validation

### Automated Validation

```powershell
node --check src\i18n.js
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

### Basic Smoke

- The main menu loads.
- `INICIAR JUEGO` / `START GAME` starts a match.
- `AYUDA` / `HELP` opens help.
- `VOLVER` / `BACK` returns to the menu.
- `P` / `Esc` pauses and resumes.
- `REINICIAR` / `RESTART` restarts after game over.
- `MENU` returns to the main menu.

### Combat Smoke

- `A/D/W` and arrow keys move/jump.
- `C` and down arrow crouch.
- `S` and `I` block.
- `J`, `K`, and `L` work according to energy/cooldown.
- `J,J`, `J,K`, and `K,K` combos show distinct feedback.
- The timer counts down in real seconds during `playing` and stops while paused.
- Reaching `0%` advances the round or ends the match.

### Visual And Accessibility Smoke

- `Tab` shows visible focus.
- The language selector switches Spanish/English and persists after reload.
- The arena selector changes the background.
- `Reducir movimiento` persists and reduces shake/hit-stop/particles.
- Human and CPU are visually distinct.
- The nine arenas look different.
- On mobile landscape, HUD, pause, arena, and touch controls are visible without critical overlaps.
- On portrait phones, the orientation hint appears and the arena remains usable above the controls.
- On low-height screens, menu, help, pause, and game over can show all buttons with internal scroll when needed.
- The canvas keeps its proportion after resize.

## Architecture

### Main Files

| File | Responsibility |
| --- | --- |
| `src/index.html` | HTML structure, menus, overlays, controls, and script loading. |
| `src/styles.css` | Layout, responsive behavior, visible focus, overlays, and touch controls. |
| `src/i18n.js` | `es`/`en` dictionary, language detection, persistence, and `t(...)`. |
| `src/config.js` | Canvas, logical dimensions, attacks, difficulty, and arenas. |
| `src/audio.js` | Web Audio initialization and code-generated sounds. |
| `src/effects.js` | Floating text and impact particles. |
| `src/ai.js` | Testable CPU decision logic. |
| `src/fighter_render.js` | Fighter drawing and related visual feedback. |
| `src/fighter.js` | Individual physics, controls, attacks, combos, hitboxes, damage, and energy. |
| `src/game.js` | Global state, screen flow, rounds, timer, backgrounds, HUD, and events. |
| `tests/game.test.js` | Tests with DOM/canvas/audio mocks. |

### Script Order

`src/index.html` loads classic scripts in this order:

```html
<script src="i18n.js"></script>
<script src="config.js"></script>
<script src="audio.js"></script>
<script src="effects.js"></script>
<script src="ai.js"></script>
<script src="fighter_render.js"></script>
<script src="fighter.js"></script>
<script src="game.js"></script>
```

### Game States

| State | Behavior |
| --- | --- |
| `menu` | Shows main menu or help and stops simulation. |
| `playing` | Updates physics, controls, AI, hits, effects, and render. |
| `paused` | Freezes simulation until resumed. |
| `roundOver` | Brief pause between rounds. |
| `gameOver` | Stops simulation and shows restart/menu. |

Mental flow:

```text
menu -> playing -> paused -> playing
menu -> playing -> roundOver -> playing
menu -> playing -> gameOver -> menu/restart
```

## Tests

The tests cover, among other points:

- Responsive resize and DPR backing store.
- Keyboard, touch, and arrow controls.
- Blocking with `S` and `I`.
- Crouch and block precedence.
- Strikes, combos, special, energy, and cooldowns.
- Hitboxes and blocked damage.
- Reduced motion.
- Separated AI and deterministic decisions.
- Arenas, fallback, and background rendering.
- Detected language, manual change, and persistence.
- Pause, help, stats, rounds, timer, and game over.
- Visual identity for human/CPU.
- Enriched final summary, post-match medals, UI sounds, and arcade-style messages.

Test limitations:

- They do not replace real visual validation in a browser.
- They do not verify Canvas pixels.
- They do not test real browser audio.

## Troubleshooting

| Problem | Recommended check |
| --- | --- |
| Published page shows 404 | Confirm `Settings > Pages > Source: GitHub Actions` and that the latest workflow is green. |
| Public URL loads without styles | Confirm the workflow publishes `src/` and not the repository root. |
| Scripts do not load locally | Serve from the root with `python -m http.server 8000` and open `http://localhost:8000/src/`. |
| Audio does not play | Click or press a key first; Web Audio initializes after user interaction. |
| Touch controls do not appear | They only show during `playing` and on touch devices or browsers that expose touch. |
| Tests fail because of syntax | Run `node --check` on the files in `src/` to find the exact file. |

## Technical Decisions

- Keep the project as a static app with no dependencies.
- Use native browser and Node.js APIs.
- Keep logical coordinates at `1000x500`.
- Avoid build tooling until needed.
- Keep Spanish as the fallback language.
- Update `Readme.md` when commands, controls, states, tests, or features change.
- Use ExecPlans in `plans/` for substantial changes.

## Prioritized Backlog

Prioritization aims to attract and retain users: first visible improvements in the opening seconds, then replay motivation, and finally depth or maintenance.

Next recommended improvement: `Training mode`, because it makes it easier to practice ranges, combos, blocking, and special without timer pressure.

| Priority | Improvement | Reason | Type |
| --- | --- | --- | --- |
| High | Training mode | Makes it easier to practice ranges, combos, blocking, and special without timer pressure. | Gameplay |
| High | Optional visual debug | Speeds up tuning for hitboxes, states, cooldowns, and AI decisions. | Dev tool |
| Medium | Daily/local quick missions | Offers challenges like winning without special, landing 3 combos, or blocking 5 hits. | Retention |
| Medium | Local achievements | Adds persistent goals without a server: first win, block king, bug exterminator. | Progression |
| Medium | HUD theme selector | Allows choosing arcade, console, or notebook style without changing gameplay. | Customization |
| Medium | Persist difficulty and arena | Reduces friction when returning to the game and keeps common preferences. | Persistence |
| Medium | Visible stats reset | Gives control over local data without clearing `localStorage`. | UX / data |
| Medium | AI personalities | Adds variety without changing controls: aggressive, defensive, jumpy, or random. | Gameplay / AI |
| Medium | More visual help | Explains keyboard, touch, and combos with diagrams instead of text only. | Accessibility |
| Medium | HUD animations | Reinforces important states: low health, round won, and full energy. | Visual |
| Medium | Local combat telemetry | Helps balance with data about combos, blocks, specials, and times. | Balance |
| Low | New impact phrases and medals | Expands humor and personality with low technical risk. | Content |
| Low | More visual arenas | Adds cosmetic variety without touching balance or hitboxes. | Content / visual |
| Low | Additional combos | Adds depth without rebuilding the base combat system. | Gameplay |
| Low | Advanced balance | Fine tuning by difficulty, attack, or CPU style. | Balance |
| Low | Background organization | Split arena details if `drawBackground()` keeps growing. | Maintenance |

## Completed Backlog

| Milestone | Result |
| --- | --- |
| Menu, help, and pause | Complete flow with overlays and summary. |
| Base combat | Movement, attacks, blocking, hitboxes, and rounds. |
| Combos and special | `J,J`, `J,K`, `K,K`, and `L` with full energy. |
| Air attacks and fighter styles | `J`/`K` in the air, style selector, and style-aware victory phrases. |
| CPU AI tuning | Difficulty-based block reactions, range-aware attacks, cooldown checks, and wall-aware retreats. |
| Tactical CPU AI | Counter windows after blocking, comeback specials, and short memory for repeated player attacks. |
| Special feedback | Flash, trail, and `SPECIAL!` text when using the full bar. |
| Special ready indicator | Text and aura above the character when energy is full. |
| Enriched final screen | Score, difficulty, arena, streak, medal, and humorous phrase at match end. |
| Initial accessibility | Visible focus, ARIA, and reduced motion. |
| README gameplay trailer | Animated GIF near the top of the README showing menu, VS intro, combat, combos, and special feedback. |
| Mobile | Touch controls, safe areas, optimized landscape, and degraded portrait with orientation warning. |
| Arenas | Nine themed backgrounds with no gameplay effects. |
| Arena preview | Initial menu with mini-preview, name, and description per arena. |
| Arcade VS intro | `P1 VS AI` overlay with round, difficulty, and arena before each round. |
| i18n | Spanish/English with autodetection and persistence. |
| Technical architecture | AI/render/i18n split and tests with `node:test`. |
