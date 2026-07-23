# Prioritized Backlog

Prioritization aims to attract and retain users: first visible improvements in the opening seconds, then replay motivation, and finally depth or maintenance.

Next recommended improvement: `Frame-rate-independent combat simulation`, because cooldowns, physics, combo windows, and AI behavior currently advance per rendered frame while the round clock uses elapsed time.

Modern browser API improvements should use capability detection, keep graceful fallbacks, and avoid adding dependencies.

AI improvements should preserve the current lightweight rule-based approach unless measured behavior shows the need for a larger architecture change.

| # | Priority | Improvement | Reason | Type |
| --- | --- | --- | --- | --- |
| 1 | High | Training mode | Makes it easier to practice ranges, combos, blocking, and special without timer pressure. | Gameplay |
| 2 | High | Optional visual debug | Speeds up tuning for hitboxes, states, cooldowns, and AI decisions. | Dev tool |
| 3 | High | PWA offline install | Lets players install GLITCH DUEL and play offline from desktop or mobile. | Distribution / retention |
| 4 | High | Gamepad controls | Adds native controller support for arcade-style play on desktop, mobile, and TV-like setups. | Input |
| 5 | High | Remappable controls | Lets players customize keyboard mappings for accessibility, keyboard layouts, and personal comfort. | Input / accessibility |
| 6 | High | Deterministic seeded matches | Makes combat and AI bugs reproducible by running fixed input, RNG, and match scenarios under a seed. | Testing / quality |
| 7 | Medium | Daily/local quick missions | Offers challenges like winning without special, landing 3 combos, or blocking 5 hits. | Retention |
| 8 | Medium | Arcade ladder run | Adds a short five-fight run with escalating difficulty and a final summary for replayable sessions. | Gameplay / retention |
| 9 | Medium | Combo trials | Adds training challenges for specific sequences, ranges, blocks, air attacks, and special confirms. | Gameplay / training |
| 10 | Medium | Hitbox debug overlay | Shows hitboxes, hurtboxes, pushboxes, active frames, and attack states for tuning and training. | Dev tool / training |
| 11 | Medium | Collision regression tests | Verifies fixed attack, block, crouch, jump, corner, and combo collision scenarios. | Testing / combat |
| 12 | Medium | Fullscreen and wake lock | Improves immersion and prevents the screen from sleeping during matches. | UX |
| 13 | Medium | Local achievements | Adds persistent goals without a server: first win, block king, bug exterminator. | Progression |
| 14 | Medium | Local match history | Stores recent results with difficulty, arena, style, duration, medals, and notable events. | Progression / data |
| 15 | Medium | First-run onboarding | Explains movement, blocking, attacks, combos, and special once without interrupting repeat players. | UX / accessibility |
| 16 | Medium | Contextual AI tactics | Adds bait, crouch defense, whiff punish, and better air attack choices without replacing the current rule system. | Gameplay / AI |
| 17 | Medium | Strategic AI tempo and anti-cheese | Uses health, timer, corners, turtle blocking, and range habits to switch between zoning, retreat, rushdown, and forced approach. | Gameplay / AI |
| 18 | Medium | Style-aware AI adaptation | Adjusts CPU behavior against fast, heavy, balanced, or technical player styles, including special defense and hit-and-run responses. | Gameplay / AI |
| 19 | Medium | Smarter AI energy usage | Uses special attacks based on position, corner pressure, hit-stun, health, timer, and difficulty instead of chance alone. | Gameplay / AI |
| 20 | Medium | HUD theme selector | Allows choosing arcade, console, or notebook style without changing gameplay. | Customization |
| 21 | Medium | Persist difficulty and arena | Reduces friction when returning to the game and keeps common preferences. | Persistence |
| 22 | Medium | Visible stats reset | Gives control over local data without clearing `localStorage`. | UX / data |
| 23 | Medium | AI personalities and difficulty personas | Adds variety by difficulty or mode: cautious Easy, balanced Normal, tactical Hard, aggressive rushdown, defensive zoning, jumpy, or random. | Gameplay / AI |
| 24 | Medium | More visual help | Explains keyboard, touch, and combos with diagrams instead of text only. | Accessibility |
| 25 | Medium | Advanced accessibility preferences | Extends reduced motion with contrast, color scheme, richer live announcements, and stronger keyboard navigation. | Accessibility |
| 26 | Medium | Colorblind-safe combat feedback | Differentiates hits, blocks, specials, and danger states with shape, motion, text, and patterns instead of color alone. | Accessibility / visual |
| 27 | Medium | HUD animations | Reinforces important states: low health, round won, and full energy. | Visual |
| 28 | Medium | Perfect and comeback bonuses | Recognizes perfect rounds, clutch wins, no-special victories, and big comebacks with medals or end-screen notes. | Progression / feedback |
| 29 | Medium | Haptic feedback | Adds vibration feedback for hits, blocks, special attacks, and match events when supported. | Input / feedback |
| 30 | Medium | Separate audio sliders | Splits volume controls for combat effects, UI sounds, ambient audio, and arcade phrases. | Audio / UX |
| 31 | Medium | Local combat telemetry | Helps balance with data about combos, blocks, specials, and times. | Balance |
| 32 | Medium | Lightweight performance telemetry | Tracks FPS, long frames, and gameplay timing locally to guide visual and balance tuning. | Dev tool / performance |
| 33 | Medium | Input replay test harness | Replays recorded input sequences in tests or debug mode to verify combat, AI, and regression scenarios. | Testing / dev tool |
| 34 | Medium | AI decision tuning hooks | Moves AI chances such as bait, air attack, crouch, zoning, rushdown, and counter timing into difficulty config with focused unit tests. | Maintenance / AI |
| 35 | Medium | Layered arena depth | Adds background, midground, and foreground details to make arenas feel richer without changing hitboxes. | Visual |
| 36 | Medium | Reactive arena effects | Lets backgrounds respond to hits, combos, special attacks, low health, final seconds, and KO. | Visual / feedback |
| 37 | Medium | Arena readability pass | Checks every arena for fighter contrast, HUD clarity, corner readability, and reduced-motion behavior. | Accessibility / visual |
| 38 | Medium | Animated arena previews | Makes the arena selector more attractive with lightweight looping previews. | UI / visual |
| 39 | Medium | Share match results | Lets players share wins, medals, streaks, or funny final phrases through the Web Share API. | Retention |
| 40 | Medium | Spatial audio polish | Positions hit, block, jump, and special sounds according to fighter location. | Audio |
| 41 | Low | New impact phrases and medals | Expands humor and personality with low technical risk. | Content |
| 42 | Low | More visual arenas | Adds cosmetic variety without touching balance or hitboxes. | Content / visual |
| 43 | Low | Cosmetic arena variants | Adds day, night, alert, rain, neon, or glitch variants without gameplay effects. | Content / visual |
| 44 | Low | Foreground arena silhouettes | Adds cables, crowd shapes, machines, columns, or framing objects for depth. | Visual |
| 45 | Low | Arena-specific intro transitions | Gives each arena a small title card or transition when a round starts. | Visual / polish |
| 46 | Low | Visual quality preset | Allows low, normal, or high arena effects depending on device capability or player preference. | Performance / UX |
| 47 | Low | Additional combos | Adds depth without rebuilding the base combat system. | Gameplay |
| 48 | Low | Advanced balance | Fine tuning by difficulty, attack, or CPU style. | Balance |
| 49 | Low | Round-to-round AI adaptation | Carries simple previous-round stats into the next round so the CPU responds to spam, range habits, or win conditions. | Gameplay / AI |
| 50 | Low | AI action scoring experiment | Scores candidate actions by expected damage, counter risk, positional advantage, timer pressure, and controlled randomness before replacing tactical rules. | Gameplay / R&D |
| 51 | Low | Short AI lookahead experiment | Tests an 8-12 frame lightweight simulation of physics and hitboxes to avoid suicidal approaches, with cached intersections and reduced use on lower difficulties. | Gameplay / R&D |
| 52 | Low | Lightweight AI state machine | Introduces clear AI states such as aggressive approach, defensive counter, zoning, and comeback only if tactical rules become hard to manage. | Architecture / AI |
| 53 | Low | Utility AI experiment | Replaces growing if-else logic with weighted considerations for damage, safety, energy, position, timer, and memory only if action scoring proves useful. | Architecture / R&D |
| 54 | Low | Ghost and mirror AI experiment | Lets an optional CPU mode imitate stored player action sequences from recent local matches with controlled noise. | Gameplay / R&D |
| 55 | Low | Persistent AI evolution | Stores a small local preference vector so AI behavior can adapt slightly across matches without becoming opaque or unfair. | Gameplay / R&D |
| 56 | Low | Difficulty personality visuals | Adds subtle visual tells or glitches for CPU difficulty, counter planning, and special planning without affecting hitboxes. | Visual / AI |
| 57 | Low | Background organization | Split arena details if `drawBackground()` keeps growing. | Maintenance |
| 58 | Low | CSS compositing optimization | Uses containment and targeted layer hints to keep menus, HUD, and overlays smooth. | Performance |
| 59 | Low | Smooth screen transitions | Uses View Transitions API where available, with fallback to current overlays. | Visual |
| 60 | Low | Export/import local data | Allows saves, stats, or settings to be backed up through JSON files. | Persistence |
| 61 | Low | Advanced visual effects experiment | Explores optional WebGPU or post-processing effects without replacing the main Canvas 2D renderer. | Visual / R&D |

## Current Implementation Findings

These items come from reviewing the current source, shipped HTML, tests, documentation, and Pages workflow. They are kept separate so correctness and resilience work can be prioritized without rewriting the existing feature roadmap.

| # | Priority | Improvement | Reason | Type |
| --- | --- | --- | --- | --- |
| 62 | High | Frame-rate-independent combat simulation | Uses bounded fixed 60 Hz simulation steps so cooldowns, combo windows, hit-stun, physics, AI decisions, and movement retain the same balance at 30, 60, or 120 FPS while preserving the real-time round clock. Add regression cases for each cadence. | Combat / quality |
| 63 | High | Use posture-specific pushboxes for fighter separation | Replaces the hard-coded center-distance collision rule with `getPushBox()` overlap resolution so standing, crouching, airborne, corner, and facing behavior match the existing collision model and documentation. | Combat / collision |
| 64 | High | Recover from interrupted input and inactive pages | Clears pressed keys on blur, visibility loss, and touch/pointer cancellation; automatically pauses an active match when the page becomes hidden and requires an explicit resume. | Input / lifecycle |
| 65 | Medium | Native accessible touch controls | Replaces touch-control `div` elements with semantic buttons and pointer-event handling, preserving combat controls while providing focus order, keyboard activation, and cancellation support. | Accessibility / input |
| 66 | Medium | Keep overlays touch-scrollable | Limits `touch-action: none` to gameplay surfaces and controls so menu, help, pause, and game-over panels remain vertically scrollable on low-height phones. | Mobile UX / accessibility |
| 67 | Medium | Pages validation quality gate | Runs syntax checks for every shipped script and `node --test tests\game.test.js` before Pages deployment; run the validation job on pull requests and make deployment depend on it. | CI / quality |
| 68 | Medium | Static HTML integration-contract tests | Verify required element IDs, local assets, and classic-script load order in `src/index.html` so a renamed ID, missing asset, or ordering regression cannot pass only because the DOM mock is permissive. | Testing / quality |
| 69 | Low | Complete localized accessibility labels | Translate fixed group labels for the GitHub link, settings, and touch controls when switching language, with tests for Spanish and English accessible names. | i18n / accessibility |
| 70 | Low | Keep documentation and configuration inventory aligned | Correct the visual smoke checklist from nine to eight arenas and add a lightweight count check so arena selectors, configuration, and docs stay synchronized. | Documentation / quality |

## Deferred Ideas

These ideas are intentionally not part of the active backlog until support, complexity, or measurable need improves.

| Idea | Reason |
| --- | --- |
| OffscreenCanvas and worker simulation | Adds architectural complexity that should wait for measured main-thread performance issues. |
| AudioWorklet sound generation | Useful only if the current Web Audio approach becomes too limited for procedural effects. |
| MediaSession pause integration | More valuable for continuous media than a short arcade game loop. |
| Speech Recognition commands | Experimental support and latency make it unreliable for real-time combat. |
| Periodic Background Sync notifications | Limited support and notification permissions add product friction. |
| Battery Status adaptation | Browser support is limited and privacy-sensitive. |
