# Prioritized Backlog

Prioritization aims to attract and retain users: first visible improvements in the opening seconds, then replay motivation, and finally depth or maintenance.

Next recommended improvement: `Training mode`, because it makes it easier to practice ranges, combos, blocking, and special without timer pressure.

Modern browser API improvements should use capability detection, keep graceful fallbacks, and avoid adding dependencies.

AI improvements should preserve the current lightweight rule-based approach unless measured behavior shows the need for a larger architecture change.

| # | Priority | Improvement | Reason | Type |
| --- | --- | --- | --- | --- |
| 1 | High | Training mode | Makes it easier to practice ranges, combos, blocking, and special without timer pressure. | Gameplay |
| 2 | High | Optional visual debug | Speeds up tuning for hitboxes, states, cooldowns, and AI decisions. | Dev tool |
| 3 | High | Hitbox and hurtbox refinement | Separates attack hitboxes, fighter hurtboxes, and pushboxes by attack phase and posture to make combat feel fairer and easier to tune. | Combat / balance |
| 4 | High | AI attack memory and spam detection | Tracks repeated punch, kick, and special patterns so higher difficulties block or counter obvious spam. | Gameplay / AI |
| 5 | High | Zone-aware AI pattern memory | Extends AI memory by distance range and player state so repeated far jump-kicks, close punches, or air habits trigger better counters. | Gameplay / AI |
| 6 | High | PWA offline install | Lets players install GLITCH DUEL and play offline from desktop or mobile. | Distribution / retention |
| 7 | High | Gamepad controls | Adds native controller support for arcade-style play on desktop, mobile, and TV-like setups. | Input |
| 8 | High | Remappable controls | Lets players customize keyboard mappings for accessibility, keyboard layouts, and personal comfort. | Input / accessibility |
| 9 | High | Deterministic seeded matches | Makes combat and AI bugs reproducible by running fixed input, RNG, and match scenarios under a seed. | Testing / quality |
| 10 | Medium | Daily/local quick missions | Offers challenges like winning without special, landing 3 combos, or blocking 5 hits. | Retention |
| 11 | Medium | Arcade ladder run | Adds a short five-fight run with escalating difficulty and a final summary for replayable sessions. | Gameplay / retention |
| 12 | Medium | Combo trials | Adds training challenges for specific sequences, ranges, blocks, air attacks, and special confirms. | Gameplay / training |
| 13 | Medium | Hitbox debug overlay | Shows hitboxes, hurtboxes, pushboxes, active frames, and attack states for tuning and training. | Dev tool / training |
| 14 | Medium | Collision regression tests | Verifies fixed attack, block, crouch, jump, corner, and combo collision scenarios. | Testing / combat |
| 15 | Medium | Fullscreen and wake lock | Improves immersion and prevents the screen from sleeping during matches. | UX |
| 16 | Medium | Local achievements | Adds persistent goals without a server: first win, block king, bug exterminator. | Progression |
| 17 | Medium | Local match history | Stores recent results with difficulty, arena, style, duration, medals, and notable events. | Progression / data |
| 18 | Medium | First-run onboarding | Explains movement, blocking, attacks, combos, and special once without interrupting repeat players. | UX / accessibility |
| 19 | Medium | Contextual AI tactics | Adds bait, crouch defense, whiff punish, and better air attack choices without replacing the current rule system. | Gameplay / AI |
| 20 | Medium | Strategic AI tempo and anti-cheese | Uses health, timer, corners, turtle blocking, and range habits to switch between zoning, retreat, rushdown, and forced approach. | Gameplay / AI |
| 21 | Medium | Style-aware AI adaptation | Adjusts CPU behavior against fast, heavy, balanced, or technical player styles, including special defense and hit-and-run responses. | Gameplay / AI |
| 22 | Medium | Smarter AI energy usage | Uses special attacks based on position, corner pressure, hit-stun, health, timer, and difficulty instead of chance alone. | Gameplay / AI |
| 23 | Medium | HUD theme selector | Allows choosing arcade, console, or notebook style without changing gameplay. | Customization |
| 24 | Medium | Persist difficulty and arena | Reduces friction when returning to the game and keeps common preferences. | Persistence |
| 25 | Medium | Visible stats reset | Gives control over local data without clearing `localStorage`. | UX / data |
| 26 | Medium | AI personalities and difficulty personas | Adds variety by difficulty or mode: cautious Easy, balanced Normal, tactical Hard, aggressive rushdown, defensive zoning, jumpy, or random. | Gameplay / AI |
| 27 | Medium | More visual help | Explains keyboard, touch, and combos with diagrams instead of text only. | Accessibility |
| 28 | Medium | Advanced accessibility preferences | Extends reduced motion with contrast, color scheme, richer live announcements, and stronger keyboard navigation. | Accessibility |
| 29 | Medium | Colorblind-safe combat feedback | Differentiates hits, blocks, specials, and danger states with shape, motion, text, and patterns instead of color alone. | Accessibility / visual |
| 30 | Medium | HUD animations | Reinforces important states: low health, round won, and full energy. | Visual |
| 31 | Medium | Perfect and comeback bonuses | Recognizes perfect rounds, clutch wins, no-special victories, and big comebacks with medals or end-screen notes. | Progression / feedback |
| 32 | Medium | Haptic feedback | Adds vibration feedback for hits, blocks, special attacks, and match events when supported. | Input / feedback |
| 33 | Medium | Separate audio sliders | Splits volume controls for combat effects, UI sounds, ambient audio, and arcade phrases. | Audio / UX |
| 34 | Medium | Local combat telemetry | Helps balance with data about combos, blocks, specials, and times. | Balance |
| 35 | Medium | Lightweight performance telemetry | Tracks FPS, long frames, and gameplay timing locally to guide visual and balance tuning. | Dev tool / performance |
| 36 | Medium | Input replay test harness | Replays recorded input sequences in tests or debug mode to verify combat, AI, and regression scenarios. | Testing / dev tool |
| 37 | Medium | AI decision tuning hooks | Moves AI chances such as bait, air attack, crouch, zoning, rushdown, and counter timing into difficulty config with focused unit tests. | Maintenance / AI |
| 38 | Medium | Layered arena depth | Adds background, midground, and foreground details to make arenas feel richer without changing hitboxes. | Visual |
| 39 | Medium | Reactive arena effects | Lets backgrounds respond to hits, combos, special attacks, low health, final seconds, and KO. | Visual / feedback |
| 40 | Medium | Arena readability pass | Checks every arena for fighter contrast, HUD clarity, corner readability, and reduced-motion behavior. | Accessibility / visual |
| 41 | Medium | Animated arena previews | Makes the arena selector more attractive with lightweight looping previews. | UI / visual |
| 42 | Medium | Share match results | Lets players share wins, medals, streaks, or funny final phrases through the Web Share API. | Retention |
| 43 | Medium | Spatial audio polish | Positions hit, block, jump, and special sounds according to fighter location. | Audio |
| 44 | Low | New impact phrases and medals | Expands humor and personality with low technical risk. | Content |
| 45 | Low | More visual arenas | Adds cosmetic variety without touching balance or hitboxes. | Content / visual |
| 46 | Low | Cosmetic arena variants | Adds day, night, alert, rain, neon, or glitch variants without gameplay effects. | Content / visual |
| 47 | Low | Foreground arena silhouettes | Adds cables, crowd shapes, machines, columns, or framing objects for depth. | Visual |
| 48 | Low | Arena-specific intro transitions | Gives each arena a small title card or transition when a round starts. | Visual / polish |
| 49 | Low | Visual quality preset | Allows low, normal, or high arena effects depending on device capability or player preference. | Performance / UX |
| 50 | Low | Additional combos | Adds depth without rebuilding the base combat system. | Gameplay |
| 51 | Low | Advanced balance | Fine tuning by difficulty, attack, or CPU style. | Balance |
| 52 | Low | Round-to-round AI adaptation | Carries simple previous-round stats into the next round so the CPU responds to spam, range habits, or win conditions. | Gameplay / AI |
| 53 | Low | AI action scoring experiment | Scores candidate actions by expected damage, counter risk, positional advantage, timer pressure, and controlled randomness before replacing tactical rules. | Gameplay / R&D |
| 54 | Low | Short AI lookahead experiment | Tests an 8-12 frame lightweight simulation of physics and hitboxes to avoid suicidal approaches, with cached intersections and reduced use on lower difficulties. | Gameplay / R&D |
| 55 | Low | Lightweight AI state machine | Introduces clear AI states such as aggressive approach, defensive counter, zoning, and comeback only if tactical rules become hard to manage. | Architecture / AI |
| 56 | Low | Utility AI experiment | Replaces growing if-else logic with weighted considerations for damage, safety, energy, position, timer, and memory only if action scoring proves useful. | Architecture / R&D |
| 57 | Low | Ghost and mirror AI experiment | Lets an optional CPU mode imitate stored player action sequences from recent local matches with controlled noise. | Gameplay / R&D |
| 58 | Low | Persistent AI evolution | Stores a small local preference vector so AI behavior can adapt slightly across matches without becoming opaque or unfair. | Gameplay / R&D |
| 59 | Low | Difficulty personality visuals | Adds subtle visual tells or glitches for CPU difficulty, counter planning, and special planning without affecting hitboxes. | Visual / AI |
| 60 | Low | Background organization | Split arena details if `drawBackground()` keeps growing. | Maintenance |
| 61 | Low | CSS compositing optimization | Uses containment and targeted layer hints to keep menus, HUD, and overlays smooth. | Performance |
| 62 | Low | Smooth screen transitions | Uses View Transitions API where available, with fallback to current overlays. | Visual |
| 63 | Low | Export/import local data | Allows saves, stats, or settings to be backed up through JSON files. | Persistence |
| 64 | Low | Advanced visual effects experiment | Explores optional WebGPU or post-processing effects without replacing the main Canvas 2D renderer. | Visual / R&D |

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
