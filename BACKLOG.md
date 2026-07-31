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

## Recommended Execution Order

| Order | # | Improvement | Why now |
| --- | --- | --- | --- |
| 1 | 37 | Arena readability pass | Validates contrast and occlusion after layered arena depth. |
| 2 | 68 | Static HTML integration contract | Protects required IDs, local assets, script order, and arena inventory. |
| 3 | 10 | Developer visual debug overlay | Makes hitbox, state, cooldown, and AI tuning observable. |
| 4 | 1 | Training mode | First major gameplay feature after combat stabilization. |
| 5 | 15 | First-run onboarding | Reduces initial control and combat friction. |
| 6 | 6 | Deterministic seeded matches | Establishes the foundation for replayable regression scenarios. |

Next recommended improvement: `#37 Arena readability pass`.

## Correctness And Release Safety

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 68 | Medium | Ready | M | - | Static HTML integration contract | Verify required IDs, local assets, classic-script order, and selector/config/i18n arena inventory. Absorbs the remaining work from `#70`. |
| 10 | Medium | Ready | S | - | Developer visual debug overlay | Show hitboxes, hurtboxes, pushboxes, states, cooldowns, AI action, and optional FPS; absorbs former `#2`. |
| 6 | High | Ready | M | - | Deterministic seeded matches | Inject seeded RNG and fixed match scenarios so complete combat/AI bugs are reproducible. |
| 33 | Medium | Blocked | L | 6 | Input replay test harness | Record and replay input sequences only after deterministic simulation and RNG exist. |
| 31 | Medium | Ready | M | 22 | Local combat telemetry | Capture bounded local aggregate data for balancing combos, blocks, specials, damage, and round duration, with visible reset controls. |
| 32 | Medium | Ready | S | - | Lightweight performance telemetry | Measure FPS and long frames locally before introducing performance architecture or quality presets. |
| 48 | Low | Blocked | M | 31 | Advanced balance | Tune attacks, styles, and difficulty only from observed telemetry and regression scenarios. |
| 57 | Low | Partial | S | - | Background organization | Split arena helpers further only when measured file growth makes the current renderer hard to maintain. |
| 58 | Low | Blocked | S | 32 | CSS compositing optimization | Add containment or targeted layer hints only when performance measurements identify a concrete issue. |

## Player Roadmap

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Ready | L | - | Training mode | Provide reset, configurable positions, optional timer, health/energy controls, and CPU behavior without duplicating match logic. |
| 15 | High | Ready | M | - | First-run onboarding | Explain movement, blocking, attacks, combos, and special once, with a skip path and no interruption for returning players. |
| 9 | Medium | Blocked | M | 1 | Combo trials | Build objective-based sequences on training reset, positioning, and success-detection infrastructure. |
| 7 | Medium | Blocked | M | 14 | Daily/local quick missions | Offer bounded local challenges using the shared match-event model. |
| 8 | Medium | Blocked | L | 14 | Arcade ladder run | Add a five-fight escalating run with deterministic progression and a final summary. |
| 13 | Medium | Blocked | M | 14 | Local achievements | Add first win, blocking, combo, and special goals through the shared local event model. |
| 14 | Medium | Ready | M | - | Local match history | Define a bounded versioned record for difficulty, arena, style, duration, medal, and notable events. |
| 21 | Medium | Ready | S | - | Persist difficulty and arena | Validate saved values against current configuration and preserve safe fallbacks. |
| 22 | Medium | Ready | S | - | Visible local-data reset | Reset stats and future local progression through UI without clearing unrelated preferences. |
| 28 | Medium | Partial | S | 14 | Perfect and comeback conditions | Extend the existing medal/phrase system only with perfect, comeback, and no-special result conditions. |
| 39 | Medium | Ready | S | - | Share match results | Share a text-only score, medal, streak, or final phrase through Web Share with clipboard fallback. |
| 41 | Low | Ready | S | - | New impact phrases and medals | Add content to the existing phrase/medal system without new progression rules. |
| 47 | Low | Blocked | M | 1 | Additional combos | Add combat depth only after training and collision regression coverage exist. |
| 60 | Low | Blocked | M | 14, 22 | Export/import local data | Export a versioned schema and validate imports without overwriting unrelated settings. |

## Input, Accessibility, And UX

| # | Priority | Status | Size | Depends on | Improvement | Acceptance summary |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | Medium | Ready | L | - | Action-based input, gamepad, and remapping | Introduce one action mapping layer, then add Gamepad API and persistent keyboard mappings. Absorbs former `#5`. |
| 12 | Medium | Ready | S | - | Fullscreen and wake lock | Use capability detection, release wake lock outside play, and preserve current layout fallback. |
| 24 | Medium | Blocked | M | 15 | More visual help | Add diagrams for keyboard, touch, combos, and special after onboarding structure exists. |
| 25 | Medium | Ready | L | - | Advanced accessibility preferences | Add contrast/color preferences, richer announcements, dialog focus entry/restore, focus containment, and inert hidden overlays. |
| 26 | Medium | Ready | M | 37 | Colorblind-safe combat feedback | Differentiate hit, block, special, and danger using shape, text, pattern, and motion rather than color alone. |
| 29 | Medium | Ready | S | - | Haptic feedback | Add optional capability-detected vibration for hits, blocks, special, and match events. |
| 30 | Medium | Ready | M | - | Separate audio controls | Add persisted combat/UI volume controls; do not invent ambient or voice channels until those sounds exist. |
| 69 | Low | Ready | S | - | Complete localized accessibility labels | Translate fixed accessible group names for GitHub, settings, and touch controls in Spanish and English. |

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
| 37 | High | Ready | M | - | Arena readability pass | Check all eight arenas for fighter contrast, HUD clarity, corner readability, foreground occlusion, and reduced motion. |
| 3 | Medium | Ready | M | - | PWA offline install | Add install/offline support with cache-version tests and safe update behavior; it is not a prerequisite for gameplay work. |
| 20 | Medium | Ready | M | - | HUD theme selector | Add arcade, console, and notebook presentation without changing gameplay information. |
| 27 | Medium | Partial | S | - | Remaining HUD animations | Add only missing low-health and round-win emphasis; health and energy already animate. |
| 36 | Medium | Blocked | M | 37 | Reactive arena effects | Respond to hits, combos, special, low health, final seconds, and KO after readability is validated. |
| 38 | Medium | Ready | M | - | Animated arena previews | Add lightweight loops that respect reduced motion and do not duplicate the full canvas renderer. |
| 40 | Medium | Ready | M | - | Spatial audio polish | Position combat sounds by fighter location while preserving mono-safe output. |
| 42 | Low | Blocked | M | 37 | More visual arenas | Add cosmetic arenas only after the current eight pass readability review. |
| 43 | Low | Blocked | M | 37 | Cosmetic arena variants | Add day/night/alert/rain/neon variants without gameplay effects. |
| 44 | Low | Partial | S | 37 | Richer foreground silhouettes | Extend the peripheral foreground delivered by `#35` only where the readability pass identifies safe opportunities. |
| 45 | Low | Ready | S | - | Arena-specific intro transitions | Add small title-card differences without delaying control or changing round state. |
| 46 | Low | Blocked | M | 32 | Visual quality preset | Add low/normal/high effects only if performance telemetry shows a real need. |
| 59 | Low | Ready | S | - | Smooth screen transitions | Use View Transitions when available with current overlays as fallback. |

## Completed Or Merged

| # | Status | Improvement | Result |
| --- | --- | --- | --- |
| 2 | Merged | Optional visual debug | Consolidated with `#10` as one developer overlay item. |
| 5 | Merged | Remappable controls | Consolidated into `#4` behind an action-based input abstraction. |
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
