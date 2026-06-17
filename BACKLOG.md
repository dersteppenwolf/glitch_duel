# Prioritized Backlog

Prioritization aims to attract and retain users: first visible improvements in the opening seconds, then replay motivation, and finally depth or maintenance.

Next recommended improvement: `Training mode`, because it makes it easier to practice ranges, combos, blocking, and special without timer pressure.

Modern browser API improvements should use capability detection, keep graceful fallbacks, and avoid adding dependencies.

AI improvements should preserve the current lightweight rule-based approach unless measured behavior shows the need for a larger architecture change.

| # | Priority | Improvement | Reason | Type |
| --- | --- | --- | --- | --- |
| 1 | High | Training mode | Makes it easier to practice ranges, combos, blocking, and special without timer pressure. | Gameplay |
| 2 | High | Optional visual debug | Speeds up tuning for hitboxes, states, cooldowns, and AI decisions. | Dev tool |
| 3 | High | AI attack memory and spam detection | Tracks repeated punch, kick, and special patterns so higher difficulties block or counter obvious spam. | Gameplay / AI |
| 4 | High | Zone-aware AI pattern memory | Extends AI memory by distance range and player state so repeated far jump-kicks, close punches, or air habits trigger better counters. | Gameplay / AI |
| 5 | High | PWA offline install | Lets players install GLITCH DUEL and play offline from desktop or mobile. | Distribution / retention |
| 6 | High | Gamepad controls | Adds native controller support for arcade-style play on desktop, mobile, and TV-like setups. | Input |
| 7 | Medium | Daily/local quick missions | Offers challenges like winning without special, landing 3 combos, or blocking 5 hits. | Retention |
| 8 | Medium | Fullscreen and wake lock | Improves immersion and prevents the screen from sleeping during matches. | UX |
| 9 | Medium | Local achievements | Adds persistent goals without a server: first win, block king, bug exterminator. | Progression |
| 10 | Medium | Contextual AI tactics | Adds bait, crouch defense, whiff punish, and better air attack choices without replacing the current rule system. | Gameplay / AI |
| 11 | Medium | Strategic AI tempo and anti-cheese | Uses health, timer, corners, turtle blocking, and range habits to switch between zoning, retreat, rushdown, and forced approach. | Gameplay / AI |
| 12 | Medium | Style-aware AI adaptation | Adjusts CPU behavior against fast, heavy, balanced, or technical player styles, including special defense and hit-and-run responses. | Gameplay / AI |
| 13 | Medium | Smarter AI energy usage | Uses special attacks based on position, corner pressure, hit-stun, health, timer, and difficulty instead of chance alone. | Gameplay / AI |
| 14 | Medium | HUD theme selector | Allows choosing arcade, console, or notebook style without changing gameplay. | Customization |
| 15 | Medium | Persist difficulty and arena | Reduces friction when returning to the game and keeps common preferences. | Persistence |
| 16 | Medium | Visible stats reset | Gives control over local data without clearing `localStorage`. | UX / data |
| 17 | Medium | AI personalities and difficulty personas | Adds variety by difficulty or mode: cautious Easy, balanced Normal, tactical Hard, aggressive rushdown, defensive zoning, jumpy, or random. | Gameplay / AI |
| 18 | Medium | More visual help | Explains keyboard, touch, and combos with diagrams instead of text only. | Accessibility |
| 19 | Medium | Advanced accessibility preferences | Extends reduced motion with contrast, color scheme, richer live announcements, and stronger keyboard navigation. | Accessibility |
| 20 | Medium | HUD animations | Reinforces important states: low health, round won, and full energy. | Visual |
| 21 | Medium | Haptic feedback | Adds vibration feedback for hits, blocks, special attacks, and match events when supported. | Input / feedback |
| 22 | Medium | Local combat telemetry | Helps balance with data about combos, blocks, specials, and times. | Balance |
| 23 | Medium | Lightweight performance telemetry | Tracks FPS, long frames, and gameplay timing locally to guide visual and balance tuning. | Dev tool / performance |
| 24 | Medium | AI decision tuning hooks | Moves AI chances such as bait, air attack, crouch, zoning, rushdown, and counter timing into difficulty config with focused unit tests. | Maintenance / AI |
| 25 | Medium | Share match results | Lets players share wins, medals, streaks, or funny final phrases through the Web Share API. | Retention |
| 26 | Medium | Spatial audio polish | Positions hit, block, jump, and special sounds according to fighter location. | Audio |
| 27 | Low | New impact phrases and medals | Expands humor and personality with low technical risk. | Content |
| 28 | Low | More visual arenas | Adds cosmetic variety without touching balance or hitboxes. | Content / visual |
| 29 | Low | Additional combos | Adds depth without rebuilding the base combat system. | Gameplay |
| 30 | Low | Advanced balance | Fine tuning by difficulty, attack, or CPU style. | Balance |
| 31 | Low | Round-to-round AI adaptation | Carries simple previous-round stats into the next round so the CPU responds to spam, range habits, or win conditions. | Gameplay / AI |
| 32 | Low | AI action scoring experiment | Scores candidate actions by expected damage, counter risk, positional advantage, timer pressure, and controlled randomness before replacing tactical rules. | Gameplay / R&D |
| 33 | Low | Short AI lookahead experiment | Tests an 8-12 frame lightweight simulation of physics and hitboxes to avoid suicidal approaches, with cached intersections and reduced use on lower difficulties. | Gameplay / R&D |
| 34 | Low | Lightweight AI state machine | Introduces clear AI states such as aggressive approach, defensive counter, zoning, and comeback only if tactical rules become hard to manage. | Architecture / AI |
| 35 | Low | Utility AI experiment | Replaces growing if-else logic with weighted considerations for damage, safety, energy, position, timer, and memory only if action scoring proves useful. | Architecture / R&D |
| 36 | Low | Ghost and mirror AI experiment | Lets an optional CPU mode imitate stored player action sequences from recent local matches with controlled noise. | Gameplay / R&D |
| 37 | Low | Persistent AI evolution | Stores a small local preference vector so AI behavior can adapt slightly across matches without becoming opaque or unfair. | Gameplay / R&D |
| 38 | Low | Difficulty personality visuals | Adds subtle visual tells or glitches for CPU difficulty, counter planning, and special planning without affecting hitboxes. | Visual / AI |
| 39 | Low | Background organization | Split arena details if `drawBackground()` keeps growing. | Maintenance |
| 40 | Low | CSS compositing optimization | Uses containment and targeted layer hints to keep menus, HUD, and overlays smooth. | Performance |
| 41 | Low | Smooth screen transitions | Uses View Transitions API where available, with fallback to current overlays. | Visual |
| 42 | Low | Export/import local data | Allows saves, stats, or settings to be backed up through JSON files. | Persistence |
| 43 | Low | Advanced visual effects experiment | Explores optional WebGPU or post-processing effects without replacing the main Canvas 2D renderer. | Visual / R&D |

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
