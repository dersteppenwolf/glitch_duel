# Prioritized Backlog

Prioritization aims to attract and retain users: first visible improvements in the opening seconds, then replay motivation, and finally depth or maintenance.

Next recommended improvement: `Training mode`, because it makes it easier to practice ranges, combos, blocking, and special without timer pressure.

Modern browser API improvements should use capability detection, keep graceful fallbacks, and avoid adding dependencies.

| # | Priority | Improvement | Reason | Type |
| --- | --- | --- | --- | --- |
| 1 | High | Training mode | Makes it easier to practice ranges, combos, blocking, and special without timer pressure. | Gameplay |
| 2 | High | Optional visual debug | Speeds up tuning for hitboxes, states, cooldowns, and AI decisions. | Dev tool |
| 3 | High | PWA offline install | Lets players install GLITCH DUEL and play offline from desktop or mobile. | Distribution / retention |
| 4 | High | Gamepad controls | Adds native controller support for arcade-style play on desktop, mobile, and TV-like setups. | Input |
| 5 | Medium | Daily/local quick missions | Offers challenges like winning without special, landing 3 combos, or blocking 5 hits. | Retention |
| 6 | Medium | Fullscreen and wake lock | Improves immersion and prevents the screen from sleeping during matches. | UX |
| 7 | Medium | Local achievements | Adds persistent goals without a server: first win, block king, bug exterminator. | Progression |
| 8 | Medium | HUD theme selector | Allows choosing arcade, console, or notebook style without changing gameplay. | Customization |
| 9 | Medium | Persist difficulty and arena | Reduces friction when returning to the game and keeps common preferences. | Persistence |
| 10 | Medium | Visible stats reset | Gives control over local data without clearing `localStorage`. | UX / data |
| 11 | Medium | AI personalities | Adds variety without changing controls: aggressive, defensive, jumpy, or random. | Gameplay / AI |
| 12 | Medium | More visual help | Explains keyboard, touch, and combos with diagrams instead of text only. | Accessibility |
| 13 | Medium | Advanced accessibility preferences | Extends reduced motion with contrast, color scheme, richer live announcements, and stronger keyboard navigation. | Accessibility |
| 14 | Medium | HUD animations | Reinforces important states: low health, round won, and full energy. | Visual |
| 15 | Medium | Haptic feedback | Adds vibration feedback for hits, blocks, special attacks, and match events when supported. | Input / feedback |
| 16 | Medium | Local combat telemetry | Helps balance with data about combos, blocks, specials, and times. | Balance |
| 17 | Medium | Lightweight performance telemetry | Tracks FPS, long frames, and gameplay timing locally to guide visual and balance tuning. | Dev tool / performance |
| 18 | Medium | Share match results | Lets players share wins, medals, streaks, or funny final phrases through the Web Share API. | Retention |
| 19 | Medium | Spatial audio polish | Positions hit, block, jump, and special sounds according to fighter location. | Audio |
| 20 | Low | New impact phrases and medals | Expands humor and personality with low technical risk. | Content |
| 21 | Low | More visual arenas | Adds cosmetic variety without touching balance or hitboxes. | Content / visual |
| 22 | Low | Additional combos | Adds depth without rebuilding the base combat system. | Gameplay |
| 23 | Low | Advanced balance | Fine tuning by difficulty, attack, or CPU style. | Balance |
| 24 | Low | Background organization | Split arena details if `drawBackground()` keeps growing. | Maintenance |
| 25 | Low | CSS compositing optimization | Uses containment and targeted layer hints to keep menus, HUD, and overlays smooth. | Performance |
| 26 | Low | Smooth screen transitions | Uses View Transitions API where available, with fallback to current overlays. | Visual |
| 27 | Low | Export/import local data | Allows saves, stats, or settings to be backed up through JSON files. | Persistence |
| 28 | Low | Advanced visual effects experiment | Explores optional WebGPU or post-processing effects without replacing the main Canvas 2D renderer. | Visual / R&D |

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
