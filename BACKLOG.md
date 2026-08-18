# Prioritized Backlog

Prioritization favors correctness and release safety first, then player onboarding and replay value, followed by accessibility, content, and measured experiments.

Modern browser APIs must use capability detection, preserve graceful fallbacks, and avoid new dependencies. AI work must preserve the lightweight rule-based approach until measured behavior shows that a larger architecture is justified.

## Status And Sizing

| Value | Meaning |
| --- | --- |
| Ready | Scope is concrete and can be planned next. |
| Blocked | Depends on another backlog item. |
| Partial | Some behavior already exists; only the stated remainder is active. |
| Deferred | Requires evidence, support, or architecture pressure before implementation. |
| S / M / L | Relative implementation size, not calendar time. |
| P0 | Confirmed critical barrier to playing, understanding, or controlling the game. |
| P1 | High-impact improvement to address next. |
| P2 | Valuable measured or validated improvement that is not urgent. |
| P3 | Future experiment that needs stronger evidence before full implementation. |

## Recommended Execution Order

| Order | # | Improvement | Why now |
| --- | --- | --- | --- |
| 1 | 72 | Preserve native keyboard operation | Confirmed input barrier: modified shortcuts and focused native controls can currently trigger combat actions or lose their expected behavior. |
| 2 | 73 | Reliable combo input buffering | Confirmed control mismatch: valid-looking second inputs are discarded during cooldown while help asks players to press quickly. |
| 3 | 25 | Complete residual focus, contrast, and small-HUD work | Rebaseline and execute pending plan 0036 before adding more visual layers. |
| 4 | 24, 69 | Input-aware help and complete localization | Teach the controls actually in use and remove the remaining Spanish-only accessible names. |
| 5 | 75 | Clarify active mode and touch special state | Small visible improvement for arcade, training, and touch users with no combat-rule change. |
| 6 | 77 | Validate first-session comprehension and recurring depth | Gate larger onboarding, attack-timing, AI, and differentiating-system decisions with observed player behavior. |
| 7 | 74 | Expose a consultable semantic combat status | Provide essential non-visual state without turning per-frame combat updates into live-region noise. |
| 8 | 9 | Combo trials | Turn existing training infrastructure into guided mastery after combo input is reliable. |
| 9 | 12 | Fullscreen and wake lock | Keep the previous small capability-detected accessibility/distribution improvement ready after confirmed play barriers. |
| 10 | 32 | Lightweight performance telemetry | Measure visual timing, long frames, DPR cost, and audio lifecycle before performance architecture changes. |

Next recommended improvement: `#72 Preserve native keyboard operation`. The previous recommendation, `#12 Fullscreen and wake lock`, remains ready but follows the newly confirmed input, focus, and clarity barriers.

## Correctness And Release Safety

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 33 | Medium | Ready | L | - | Input replay test harness | Record and replay input sequences only after deterministic simulation and RNG exist. |
| 31 | Medium | Ready | M | 22 | Local combat telemetry | Capture bounded local aggregate data for balancing combos, blocks, specials, damage, and round duration, with visible reset controls. |
| 32 | Medium | Ready | S | - | Lightweight performance telemetry | Measure RAF intervals, long frames, simulation catch-up/discarded time, DPR cost, render timing at 30/60/120 Hz, and Web Audio node/handler return to baseline. Use repeatable local runs and explicit thresholds before quality presets, compositing hints, or render suspension. |
| 48 | Low | Blocked | M | 31 | Advanced balance | Tune attacks, styles, and difficulty only from observed telemetry and regression scenarios. |
| 57 | Low | Partial | S | - | Background organization | Split arena helpers further only when measured file growth makes the current renderer hard to maintain. |
| 58 | Low | Blocked | S | 32 | CSS compositing optimization | Add containment or targeted layer hints only when performance measurements identify a concrete issue. |
| 72 | P0 | Ready | S | - | Preserve native keyboard operation | Ignore combat bindings for Ctrl/Alt/Meta/Shift combinations and while native interactive controls own the event; process pause only in playing/paused and retain the explicit Escape policy. Automated coverage must prove browser shortcuts are not prevented, training selects keep arrow behavior, remapped Enter/Space still activate focused controls, and input snapshots remain neutral. Evidence: `setupKeyboardControls()` only excludes `.btn` targets in `src/game.js`. |

## Player Roadmap

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | Medium | Ready | M | 73 | Combo trials | Build four localized objectives on existing training infrastructure: complete each current combo, crouch under a high punch and punish, block and counter, and charge/spend the special. Reuse normal simulation/reset rules; automatically verify success detection and manually verify that new players understand each objective. |
| 7 | Medium | Ready | M | 14 | Daily/local quick missions | Offer bounded local challenges using the shared match-event model. |
| 8 | Medium | Completed | L | 14 | Arcade ladder run | Add a five-fight escalating run with deterministic progression and a final summary. |
| 13 | Medium | Ready | M | 14 | Local achievements | Add first win, blocking, combo, and special goals through the shared local event model. |
| 14 | Medium | Completed | M | - | Local match history | Define a bounded versioned record for difficulty, arena, style, duration, medal, and notable events. |
| 21 | Medium | Ready | S | - | Persist difficulty and arena | Validate saved values against current configuration and preserve safe fallbacks. |
| 22 | Medium | Ready | S | - | Visible local-data reset | Reset stats and future local progression through UI without clearing unrelated preferences. |
| 28 | Medium | Partial | S | 14 | Perfect and comeback conditions | Extend the existing medal/phrase system only with perfect, comeback, and no-special result conditions. |
| 39 | Medium | Ready | S | - | Share match results | Share a text-only score, medal, streak, or final phrase through Web Share with clipboard fallback. |
| 41 | Low | Ready | S | - | New impact phrases and medals | Add content to the existing phrase/medal system without new progression rules. |
| 47 | Low | Blocked | M | 1 | Additional combos | Add combat depth only after training and collision regression coverage exist. |
| 60 | Low | Blocked | M | 14, 22 | Export/import local data | Export a versioned schema and validate imports without overwriting unrelated settings. |
| 73 | P1 | Ready | M | - | Buffer valid second combo inputs | Buffer at most one punch/kick pressed during the current attack cooldown when the combo window is still open, execute it on the first legal simulation tick, and distinguish accepted, expired, and blocked inputs without changing damage initially. Tests must use real cooldown boundaries rather than forcing cooldown to zero and prove identical results at 30/60/120 FPS for keyboard, touch, and gamepad action snapshots. Evidence: `Fighter.handleAttackCommand()` currently returns before recording the input. |
| 76 | P3 | Blocked | M | 73, 77 | Validate a GLITCH CANCEL MVP | Prototype, but do not fully roll out, one deterministic recovery cancel per sequence: pressing Special during eligible recovery spends 25 energy, preserves the full-bar special from neutral, and gives localized static/motion-reduced feedback. Test all input sources, simulation equivalence, energy economy, and dominant loops; continue only if recurring players understand the energy tradeoff and prefer it without making it mandatory. |

## Input, Accessibility, And UX

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | Medium | Completed | L | - | Action-based input, gamepad, and remapping | Canonical action layer, standard Gamepad API input, source-safe lifecycle cleanup, and persistent physical-key mappings with accessible remapping UI. Absorbs former `#5`. |
| 12 | Medium | Ready | S | - | Fullscreen and wake lock | Use capability detection, release wake lock outside play, and preserve current layout fallback. |
| 24 | Medium | Ready | M | 69 | Input-aware help and onboarding | Extend the existing onboarding/help rather than creating a second tutorial: show current keyboard bindings plus touch or standard-gamepad instructions when relevant, preserve the mode the player intended to start, and explain multitouch, combos, block, and special in localized action terms. Validate first-use tasks with `#77`. |
| 25 | Medium | Partial | L | - | Advanced accessibility preferences | Dialog focus entry/restore, containment, inert overlays, system reduced motion, and discrete announcements exist. Rebaseline pending plan 0036 to finish visible focus after start/restart/onboarding, focus visibility in scrollable low-height dialogs, a contrast-safe ring including `summary`, small-HUD legibility, and safe vertical placement; configurable contrast/color preferences remain. |
| 26 | Medium | Ready | M | - | Colorblind-safe combat feedback | Differentiate hit, block, special, danger, fighter posture, and energy using contrast plus shape, text, pattern, and motion. Verify at least 3:1 for essential non-text fighter/action marks on every arena, including dark `serverDown`, and provide DOM values for information that becomes physically too small in portrait. Coordinate with the small-HUD work in `#25` without blocking independent contrast fixes. |
| 29 | Medium | Ready | S | - | Haptic feedback | Add optional capability-detected vibration for hits, blocks, special, and match events. |
| 30 | Medium | Ready | M | - | Separate audio controls | Add persisted combat/UI volume controls; do not invent ambient or voice channels until those sounds exist. |
| 69 | Low | Partial | S | - | Complete localized accessibility labels | GitHub, settings, and individual touch buttons already localize. Add the remaining ES/EN names for touch/training groups and training selects, localize functional Canvas/touch feedback while preserving intentional technical jokes, and give each remapping button an action-specific accessible name. Verify locale-key parity and screen-reader output. |
| 74 | P1 | Ready | M | 69 | Expose consultable semantic combat status | Add a compact DOM representation of health, energy, round, score, and time that inherits browser zoom, plus a remappable/queryable summary for health, energy, rival direction/distance, and final seconds. Keep values non-live; announce only deduplicated thresholds and events. Validate ES/EN with NVDA/Narrator/VoiceOver and prove no per-frame speech. Coordinate visual placement with `#25`; do not block the semantic work on configurable preferences. Evidence: essential state currently exists only in Canvas and the live region announces mainly round, special-ready, and result events. |
| 75 | P1 | Ready | S | 69 | Clarify active mode and touch special state | Make the toolbar/pause summary identify Versus, Training, or Arcade progress and make the touch Special control expose loading/ready through short localized text, pattern/shape, and ARIA state without color-only or silent failure. Automatically verify state transitions and manually check mobile landscape, portrait, hybrid touch, ES, and EN. |
| 77 | P2 | Ready | S | - | Validate first-session comprehension and recurring depth | Run a scripted study with at least six new players split across keyboard, touch, and gamepad, plus four recurring/fighting-game players. New players attempt start, move, block, combo, and special without coaching; recurring players rank difficulty, identify exploitable AI/recovery patterns, and describe what feels uniquely glitch. Success for onboarding is at least five of six completing every core task with no input path producing two failures. Record observations and use them to gate `#16`, `#17`, `#24`, attack-phase changes, and `#76`. |

## Measured AI Roadmap

AI changes stay inside the current rule-based architecture. Each stage must include focused tests and should be justified by observed behavior or telemetry.

| # | Priority | Status | Size | Depends on | Improvement | Remaining scope |
| --- | --- | --- | --- | --- | --- | --- |
| 16 | Medium | Ready | M | - | Contextual AI tactics | Add missing bait, crouch defense, whiff punish, and air choices using difficulty-config tuning hooks. Absorbs former `#34`. |
| 17 | Medium | Partial | M | 16 | Timer tempo and anti-turtle behavior | Add timer-aware forced approach, stop retreating when behind late, and respond to excessive blocking; health, corners, range, and memory already exist. |
| 18 | Medium | Blocked | M | 16 | Style-aware AI adaptation | Adjust tactics against fast, heavy, balanced, and technical styles after contextual actions are stable. |
| 19 | Medium | Partial | M | 16 | Positional AI special usage | Add hit-stun confirmation, corner pressure, range safety, and timer context; lethal/comeback/energy logic already exists. |
| 23 | Low | Blocked | L | 16, 17 | Selectable AI personalities | Add rushdown, zoning, defensive, or chaotic personalities independent of difficulty; difficulty personas already exist. |
| 49 | Low | Blocked | M | 31, 16 | Round-to-round AI adaptation | Carry bounded previous-round observations only after local telemetry and contextual tactics are stable. |

## Visual, Audio, And Distribution Roadmap

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | Medium | Ready | M | - | PWA offline install | Add install/offline support with cache-version tests and safe update behavior; it is not a prerequisite for gameplay work. |
| 20 | Medium | Ready | M | - | HUD theme selector | Add arcade, console, and notebook presentation without changing gameplay information. |
| 27 | Medium | Partial | S | - | Remaining HUD animations | Add only missing low-health and round-win emphasis; health and energy already animate. |
| 36 | Medium | Ready | M | - | Reactive arena effects | Respond to hits, combos, special, low health, final seconds, and KO after readability is validated. |
| 38 | Medium | Ready | M | - | Animated arena previews | Add lightweight loops that respect reduced motion and do not duplicate the full canvas renderer. |
| 40 | Medium | Ready | M | - | Spatial audio polish | Position combat sounds by fighter location while preserving mono-safe output. |
| 42 | Low | Ready | M | - | More visual arenas | Add cosmetic arenas only after the current eight pass readability review. |
| 43 | Low | Ready | M | - | Cosmetic arena variants | Add day/night/alert/rain/neon variants without gameplay effects. |
| 44 | Low | Partial | S | - | Richer foreground silhouettes | Extend the peripheral foreground delivered by `#35` only where the readability pass identifies safe opportunities. |
| 45 | Low | Ready | S | - | Arena-specific intro transitions | Add small title-card differences without delaying control or changing round state. |
| 46 | Low | Blocked | M | 32 | Visual quality preset | Add low/normal/high effects only if performance telemetry shows a real need. |
| 59 | Low | Ready | S | - | Smooth screen transitions | Use View Transitions when available with current overlays as fallback. |

## Completed Or Merged

| # | Status | Improvement | Result |
| --- | --- | --- | --- |
| 2 | Merged | Optional visual debug | Consolidated with `#10` as one developer overlay item. |
| 5 | Merged | Remappable controls | Consolidated into `#4` behind an action-based input abstraction. |
| 4 | Completed | Action-based input, gamepad, and remapping | Canonical keyboard/touch/gamepad actions, validated persistent physical-key remapping, standard controller UI navigation, and interruption-safe source aggregation delivered in plan 0037. |
| 11 | Merged | Collision regression tests | Consolidated into `#63` so the collision fix cannot land without posture and corner regression coverage. |
| 62 | Completed | Frame-rate-independent combat simulation | Bounded fixed 60 Hz combat steps keep movement, combat timers, AI, and round time equivalent at 30/60/120 FPS. |
| 63 | Completed | Posture-specific pushboxes and collision regressions | Fighter separation uses `getPushBox()` with standing, crouch, air, facing, and corner coverage. |
| 64 | Completed | Interrupted-input recovery and inactive-page pause | Blur, visibility and pointer interruption clear input; hidden active matches pause until explicit resume. |
| 65 | Completed | Native accessible touch controls | Eight semantic buttons use Pointer Events with cancellation, capture-loss, multitouch, and focus handling. |
| 66 | Completed | Keep overlays touch-scrollable | Gameplay surfaces retain `touch-action: none`; menu, help, pause, and game-over allow vertical pan and scroll. |
| 34 | Merged | AI decision tuning hooks | New contextual AI work in `#16-#19` must place tunable chances in difficulty config with focused tests. |
| 35 | Completed | Layered arena depth | Eight arenas render peripheral foreground after fighters and before combat feedback. Implemented in `eb472d7`. |
| 56 | Completed | Difficulty personality visuals | CPU appearance already varies by difficulty and is covered by tests. |
| 67 | Completed | Pages validation quality gate | Pull requests and pushes validate all JavaScript and unit tests; Pages deploy depends on the successful gate. |
| 70 | Merged | Documentation/configuration inventory | README now says eight arenas; remaining automatic inventory checks moved into `#68`. |
| 71 | Completed | Visual CPU rival roster | Four selectable rivals provide localized badge, color, VS phrase, HUD identity, and Canvas detail without changing difficulty or AI behavior. |
| 37 | Completed | Arena readability pass | Eight arenas retain readable fighters, HUD, corners, peripheral foreground, and reduced-motion behavior. |
| 68 | Completed | Static HTML integration contract | Tests protect required IDs, local resources, classic script order, and HTML/config/i18n arena inventory. |
| 10 | Completed | Developer visual debug overlay | `?debug=1` or backtick shows combat boxes, state, timers, AI, render FPS, simulation ticks, and seed. |
| 1 | Completed | Training mode | Reuses match simulation with position, CPU, timer, reset, health, and energy controls. |
| 15 | Completed | First-run onboarding | Localized three-step onboarding explains core controls once with skip and start paths. |
| 6 | Completed | Deterministic seeded matches | `?seed=<uint32>` and test scenarios reproduce simulation independently of render randomness. |

## Deferred Experiments

These items require measured need, browser support, or demonstrated rule-system pressure before implementation.

| # / Idea | Reason |
| --- | --- |
| 50 AI action scoring | Do not replace clear tactical rules without evidence that candidate scoring improves behavior. |
| 51 Short AI lookahead | Adds per-action simulation cost and complexity; revisit only after measured tactical failures. |
| 52 Lightweight AI state machine | Current actions remain understandable; introduce states only if staged tactics become hard to manage. |
| 53 Utility AI | Depends on successful action-scoring evidence and would otherwise duplicate the current rules. |
| 54 Ghost and mirror AI | Requires deterministic replay and a clear player-facing mode first. |
| 55 Persistent AI evolution | Risks opacity and unfairness; require explicit product need and reset controls. |
| 61 Advanced visual effects | WebGPU/post-processing is unnecessary while Canvas 2D meets current goals. |
| OffscreenCanvas and worker simulation | Wait for measured main-thread performance issues. |
| AudioWorklet sound generation | Useful only if the current Web Audio approach becomes too limited. |
| MediaSession pause integration | More valuable for continuous media than a short arcade game loop. |
| Speech Recognition commands | Experimental support and latency make it unreliable for real-time combat. |
| Periodic Background Sync notifications | Limited support and notification permissions add product friction. |
| Battery Status adaptation | Browser support is limited and privacy-sensitive. |
