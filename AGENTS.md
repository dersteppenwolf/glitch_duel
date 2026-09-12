# AGENTS.md

## Project Contract

- `GLITCH DUEL` is a static browser game built with classic HTML, CSS, and JavaScript. There is no `package.json`, lockfile, bundler, backend, or build step.
- Preserve the `GLITCH DUEL` identity; do not restore previous branding in active UI or documentation.
- The entrypoint is `src/index.html`. Open it directly for a quick check or serve `src/`; never use the deleted `stick_game.html`.
- Keep the project dependency-free unless the task includes an explicit architecture decision. Prefer native browser and Node.js APIs.
- Spanish is the default and fallback UI language. Keep English UI strings in `src/i18n.js`.

## File Responsibilities

| Path | Responsibility |
| --- | --- |
| `src/index.html` | UI structure, menus, overlays, controls, and classic-script order. |
| `src/styles.css` | Layout, responsive behavior, focus, overlays, and touch controls. |
| `src/i18n.js` | Spanish/English strings, language detection, persistence, and `t(...)`. |
| `src/config.js` | Logical dimensions, attacks, difficulty, arenas, and training configuration. |
| `src/input.js` | Canonical actions and keyboard, pointer, and gamepad aggregation. |
| `src/audio.js` / `src/effects.js` | Generated audio and transient combat effects. |
| `src/ai.js` | Testable CPU decision rules. |
| `src/fighter.js` / `src/fighter_render.js` | Fighter simulation and fighter rendering. |
| `src/arena_render.js` / `src/hud_render.js` | Arena and HUD rendering. |
| `src/game.js` | Global state, fixed-step orchestration, rounds, menus, training, and events. |
| `tests/game.test.js` | `node:test` coverage with DOM, Canvas, audio, and input mocks. |

Put new behavior in the closest existing file. Do not move simulation rules into renderers or duplicate combat rules for a specific input method or game mode.

## Run And Validate

- Use Node.js 24, matching `.github/workflows/pages.yml`.
- No package installation is required.
- Preferred local run from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/src/`.

- Full automated validation from PowerShell:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
```

- GitHub Pages validates every `src/*.js` file and `tests/game.test.js`, then publishes `src/` only after validation passes. Preserve that no-build gate unless the architecture changes.

### Validation By Change

| Change | Required validation |
| --- | --- |
| Documentation only | Check changed paths, commands, links, and terminology. Run a command if its documented behavior changed. |
| Any `src/*.js` change | Run the full automated validation above. Add or update focused unit tests for changed behavior. |
| UI, controls, gameplay, rendering, audio, or accessibility | Run full automated validation and define a focused manual browser checklist. |
| Workflow or deployment | Keep validation before deployment and verify the workflow syntax and published path. |

Browser, hardware, assistive-technology, performance, and player-validation evidence belongs only in `plans/plan_0043_validacion_humana_consolidada.md`. Mocks are not evidence for those checks; never claim otherwise.

## Non-Negotiable Runtime Invariants

### Simulation And State

- `gameState` in `src/game.js` controls simulation. Only `playing` advances physics, AI, and combat; `menu`, `paused`, `roundOver`, and `gameOver` stop updates.
- Combat advances through bounded fixed 60 Hz steps accumulated from `requestAnimationFrame(timestamp)`. Movement, timer, cooldowns, combo windows, hit-stun, hit-stop, trial windows, and AI timing advance only inside those steps.
- Reset the simulation clock on pause, resume, round start, and hidden-page return so elapsed wall time is never replayed as catch-up simulation.
- Canvas simulation and hitboxes use logical coordinates `1000x500`. `resizeCanvas()` only maps that space to responsive CSS and a DPR-aware backing store.
- Mobile controls and the pause button are visible only in `playing`. Call `updateControlsVisibility()` after state transitions that affect them.

### Input And Accessibility

- `src/input.js` aggregates keyboard, pointer, and standard gamepad sources into canonical actions. One source releasing an action must not cancel another source still holding it.
- Persist keyboard mappings with physical `KeyboardEvent.code`. Escape, Tab, backtick, browser shortcuts, and modifier combinations remain reserved.
- Gameplay focus is `#game`; Tab connects it with the pause button. Ctrl/Alt/Meta combinations and native editing/navigation targets must not become combat actions. On buttons, links, and summaries, reserve Enter and Space for native activation.
- Grounded combo follow-ups use the single fixed-step `pendingComboInput`. Interruption clears the full sequence; taps that begin and end between simulation ticks are not queued.
- Keep touch-control child labels localized. `getSpecialActionState()` is authoritative for touch, Canvas, and status feedback. `renderTouchSpecialState()` is the only writer of touch-special readiness and must retain its cached-signature update behavior.
- Native touch-button click activation is held for one input snapshot for assistive technology. Pointer, keyboard, and gamepad sources must still aggregate without double spending.
- `#combat-status` is a non-live summary queried by `Digit0`, a remapped status edge, gamepad button 8, or opening its details. Do not add per-frame announcements. Binding storage v2 must continue to migrate v1 without stealing user keys.

### Training And Experimental Rules

- Training uses the normal simulation; never fork fighter or combat rules. Trials are `free`, `combos`, `crouchPunish`, `blockCounter`, and `specialSpend`; `glitchCancel` is a separate experiment outside `n/4` progression.
- Trial progress is session-only, driven by real combat events, and excluded from statistics and history. Pause, reset, hidden-page return, KO, and trial changes clear temporary progress where applicable.
- GLITCH CANCEL is Training-experiment-only and P1-only. A new Special edge after a grounded punch/kick whiff, while post-decrement recovery remains, spends exactly 25 energy, clears recovery and pending combo, and consumes that offensive tick.
- GLITCH CANCEL never applies after hit/block, during combos, in the air, to Special, to CPU, or in Versus/Arcade. Neutral Special still costs 100.

### UI, AI, Audio, And Diagnostics

- Web Audio is created lazily after user interaction through `initAudio()`. Tone graphs must disconnect idempotently after ending.
- `?debug=1` or backtick enables developer diagnostics; `?seed=<uint32>` seeds simulation RNG. Diagnostics remain opt-in, bounded, in memory, and never persisted or transmitted.
- Help and onboarding keep keyboard, touch, and standard gamepad guidance visible. `recentInputMethod`, `guidanceInputMethod`, and `pendingStartMode` are session-only; completing or skipping onboarding starts the requested mode.
- The main menu uses native `#duel-settings` and `#menu-utilities` disclosures, closed by default. Derive `#match-configuration-summary` only from the four `selected*` values and refresh it after selection, language changes, and Arcade restoration. Help/Controls restore focus inside `#menu-utilities` without collapsing it.
- CPU tactics remain rule-based. Preserve one opportunity per observed sequence, pattern-specific crouch/whiff responses, wall-aware bait retreat, one real-hitbox air attack per jump, accumulated blocking memory rather than held-input reads, and late-round pressure only when the CPU is behind.

## Documentation Sources Of Truth

- `Readme.md`: player-facing controls, modes, run instructions, architecture, and implemented features.
- `.github/workflows/pages.yml`: CI runtime, validation, and deployment behavior.
- `PLANS.md`: criteria and required format for substantial implementation plans.
- `plans/plan_0043_validacion_humana_consolidada.md`: human and real-device validation evidence.
- Runtime code and tests: executable behavior. If behavior and documentation disagree, investigate before editing and update every affected source in the same change.

Update `Readme.md` when run instructions, controls, game states, or implemented backlog items change. Update this file only for durable instructions that future sessions must follow, not for transient implementation history.

## Code Review Rules

- Flag simulation time or combat state advancing outside the fixed step. Safe path: route it through the existing fixed-step update.
- Flag input-source-specific combat behavior or Training-only copies of combat rules. Safe path: emit canonical actions and reuse normal simulation.
- Flag additional writers of touch-special readiness or contradictory special-state logic. Safe path: use `getSpecialActionState()` and `renderTouchSpecialState()`.
- Flag external runtime dependencies without an explicit architecture decision and updated run/test documentation. Safe path: prefer native APIs.
- Flag claims of visual, hardware, assistive-technology, performance, or player validation based only on mocks. Safe path: describe the automated coverage and leave human evidence unclaimed.
- Keep formatting-only concerns in automated checks when possible; review comments should focus on behavior, regressions, and a concrete safe path.

## ExecPlans

- Follow `PLANS.md` whenever any of its substantial-change conditions apply.
- Store new plans as `plans/plan_<nnnn>_<objetivo>.md`, using the next zero-padded number.
- Before finalizing an ExecPlan, load and apply the `karpathy-guidelines` skill; reduce scope if it identifies overcomplication.
- Keep the plan current when scope, validation, or implementation details change.
