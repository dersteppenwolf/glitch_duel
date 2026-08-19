# Prioritized Backlog

Prioritization favors correctness and release safety first, then player onboarding and replay value, followed by accessibility, content, and measured experiments. The execution queue is the authoritative priority order; category tables do not define a second priority scale.

Modern browser APIs must use capability detection, preserve graceful fallbacks, and avoid new dependencies. AI work must preserve the lightweight rule-based approach until measured behavior shows that a larger architecture is justified.

The accepted human-validation closure record is `plans/plan_0043_validacion_humana_consolidada.md`. Any new browser, physical hardware, assistive-technology, performance or player-study validation requires a separate plan; mocks and smoke tests are not human evidence.

## Status And Sizing

| Value | Meaning |
| --- | --- |
| Ready | Scope is concrete and has no unmet dependency or evidence gate. |
| Blocked | Waits on a named backlog item. |
| Partial | Existing behavior has an exact remaining deliverable. |
| Proposed | Scope still needs a product or technical decision before it can become Ready. |
| Gated | Requires named evidence or explicit authorization before implementation. |
| Deferred | Has no active scope until a documented trigger occurs. |
| Implemented | Code and validation were delivered. |
| Merged | Scope was absorbed by another item. |
| Closed | No expansion was justified or the result was accepted without additional code. |
| S / M / L | Relative implementation size, not calendar time. |

## Recommended Execution Order

| Order | # | Improvement | Constraint |
| ---: | ---: | --- | --- |
| 1 | 12 | Fullscreen and wake lock | Independent, capability-detected and small. |
| 2 | 22 | Visible local-data reset | Required before new local telemetry or progression. |
| 3 | 31 | Local combat telemetry | Start only after `#22`; reuse its reset path. |
| 4 | 26 | Colorblind-safe combat feedback | Concrete accessibility scope independent of undefined preferences. |
| 5 | 13 | Local achievements | Start only after `#22`; reuse bounded match events. |
| 6 | 7 | Daily/local quick missions | Start only after `#22`; reuse reset and event foundations. |
| 7 | 3 | PWA offline install | Independent distribution work. |
| 8 | 20 | HUD theme selector | Independent cosmetic presentation work. |

The historical AI roadmap and its final decisions are closed in `plans/plan_0044_hoja_ruta_ia_cpu_priorizada.md`. Plan `0045` is a proposed neutral-variation experiment and has no execution position until its evidence/authorization gate passes.

## Active Backlog

Only Ready, concrete Partial and dependency-Blocked work belongs here. `Depends on` lists unmet dependencies; completed foundations are described in the acceptance text when relevant.

| # | Category | Status | Size | Depends on | Improvement | Acceptance summary |
| ---: | --- | --- | --- | --- | --- | --- |
| 33 | Correctness | Ready | L | - | Input replay test harness | Record and replay bounded input sequences on the completed deterministic simulation and seeded RNG foundations. |
| 31 | Correctness | Blocked | M | 22 | Local combat telemetry | Capture bounded local aggregates for combos, blocks, specials, damage and round duration; reuse the reset path from `#22`. |
| 7 | Player | Blocked | M | 22 | Daily/local quick missions | Offer bounded local challenges through the existing match-event model after visible reset exists. |
| 13 | Player | Blocked | M | 22 | Local achievements | Add first win, blocking, combo and special goals after visible reset exists. |
| 21 | Player | Ready | S | - | Persist difficulty and arena | Validate saved values against current configuration and preserve safe fallbacks. |
| 22 | Player | Ready | S | - | Visible local-data reset | Reset stats and future local progression without clearing unrelated preferences. |
| 28 | Player | Partial | S | - | Perfect and comeback conditions | Add only perfect, comeback and no-special result conditions to the existing medal/phrase system. |
| 39 | Player | Ready | S | - | Share match results | Share text-only score, medal, streak or phrase through Web Share with clipboard fallback. |
| 41 | Player | Ready | S | - | New impact phrases and medals | Add content to the existing phrase/medal system without new progression rules. |
| 47 | Combat | Ready | M | - | Additional combos | Training and collision regressions are complete; every new combo still requires focused timing, damage and interruption tests. |
| 60 | Player | Blocked | M | 22 | Export/import local data | Export a versioned schema and validate imports without overwriting unrelated settings. |
| 12 | UX | Ready | S | - | Fullscreen and wake lock | Use capability detection, release wake lock outside play and preserve the current layout fallback. |
| 26 | Accessibility | Ready | M | - | Colorblind-safe combat feedback | Differentiate hit, block, special, danger, posture and energy through contrast plus shape, text, pattern and motion. |
| 29 | UX | Ready | S | - | Haptic feedback | Add optional capability-detected vibration for hits, blocks, Special and match events. |
| 30 | Audio | Ready | M | - | Separate audio controls | Add persisted combat/UI volume controls without inventing channels for sounds that do not exist. |
| 3 | Distribution | Ready | M | - | PWA offline install | Add install/offline support with cache-version tests and safe update behavior. |
| 20 | Visual | Ready | M | - | HUD theme selector | Add arcade, console and notebook presentation without changing gameplay information. |
| 27 | Visual | Partial | S | - | Remaining HUD animations | Add only missing low-health and round-win emphasis; health and energy already animate. |
| 36 | Visual | Ready | M | - | Reactive arena effects | Respond to combat events while preserving readability and reduced-motion behavior. |
| 38 | Visual | Ready | M | - | Animated arena previews | Add lightweight loops that respect reduced motion and do not duplicate the full Canvas renderer. |
| 40 | Audio | Ready | M | - | Spatial audio polish | Position combat sounds by fighter location while preserving mono-safe output. |
| 42 | Visual | Ready | M | - | More visual arenas | Add cosmetic arenas on the completed readability foundation. |
| 43 | Visual | Ready | M | - | Cosmetic arena variants | Add day/night/alert/rain/neon variants without gameplay effects. |
| 45 | Visual | Ready | S | - | Arena-specific intro transitions | Add small title-card differences without delaying control or changing round state. |
| 59 | Visual | Ready | S | - | Smooth screen transitions | Use View Transitions when available with current overlays as fallback. |

## Proposed And Evidence-Gated

These items do not have an execution position until their stated decision or evidence gate passes.

| # | Category | Status | Size | Gate | Improvement | Next decision |
| ---: | --- | --- | --- | --- | --- | --- |
| 25 | Accessibility | Proposed | L | Define exact preferences | Advanced accessibility preferences | Name settings, values, persistence/reset behavior and the boundary from `#26` before planning code. |
| 23 | AI | Gated | L | Demonstrated player demand | Selectable AI personalities | Require players to distinguish and request profiles at equal difficulty; completed `#16/#17` are not the missing gate. |
| 48 | Combat | Gated | M | `#31` plus observed imbalance | Advanced balance | Telemetry completion alone does not authorize attack, style or difficulty tuning. |
| 49 | AI | Gated | M | `#31` plus reproducible cross-round exploit | Round-to-round AI adaptation | Carry no memory between rounds until telemetry and a surviving exploit justify it. |
| 78 | AI | Gated | M | Characterization or explicit authorization | Weighted neutral CPU variation | Follow plan `0045`; creating the plan did not authorize implementation. |

## Deferred Experiments

These items have no active deliverable. Reopen only when the stated trigger is documented.

| # / Idea | Area | Trigger |
| --- | --- | --- |
| 57 Background organization | Architecture | Split renderer helpers only after measured file-growth or maintenance pressure. |
| 46 / 58 / OffscreenCanvas | Performance escalation | Profile a concrete rendering bottleneck, then choose the least invasive remedy among quality presets, CSS compositing or worker/offscreen work. |
| 50 / 53 Global AI scoring or Utility AI | AI architecture | Demonstrate that clear tactical rules and the gated `#78` experiment cannot address a measured decision defect. |
| 51 Short AI lookahead | AI architecture | Revisit only after a reproducible tactical failure justifies per-action simulation cost. |
| 52 Lightweight AI state machine | AI architecture | Introduce states only if staged tactics become too complex to express as bounded rules. |
| 54 Ghost and mirror AI | Game mode | Complete deterministic replay and define a player-facing mode first. |
| 55 Persistent AI evolution | AI architecture | Require explicit product need, transparency and reset controls. |
| 61 Advanced visual effects | Rendering | Canvas 2D must first fail a documented visual requirement. |
| AudioWorklet sound generation | Audio | Current Web Audio synthesis must become demonstrably insufficient. |
| MediaSession pause integration | Platform | Reconsider only if sessions become continuous enough to benefit from media controls. |
| Speech Recognition commands | Input | Browser support and latency must become reliable enough for real-time play. |
| Periodic Background Sync notifications | Platform | Require a notification use case that justifies permission and limited browser support. |
| Battery Status adaptation | Platform | Require viable browser support and a privacy-safe product need. |

## Implemented, Merged And Closed

This is the canonical history. Implemented means code shipped; Merged means another item absorbed the scope; Closed means no additional implementation was justified or the result was explicitly accepted.

| # | Status | Improvement | Result |
| ---: | --- | --- | --- |
| 1 | Implemented | Training mode | Reuses match simulation with position, CPU, timer, reset, health and energy controls. |
| 2 | Merged | Optional visual debug | Consolidated with `#10` as one developer overlay item. |
| 4 | Implemented | Action-based input, gamepad and remapping | Delivered canonical actions, persistent physical-key remapping, standard gamepad input and interruption-safe aggregation in plan `0037`. |
| 5 | Merged | Remappable controls | Consolidated into `#4`. |
| 6 | Implemented | Deterministic seeded matches | `?seed=<uint32>` reproduces simulation independently of cosmetic randomness. |
| 8 | Implemented | Arcade ladder run | Delivered a deterministic five-fight escalating run with intermissions and final summary. |
| 9 | Implemented | Combo trials | Delivered four localized, fixed-step, session-only Training objectives; plan `0043` closed human comprehension by explicit assumption. |
| 10 | Implemented | Developer visual debug overlay | `?debug=1` or backtick shows combat boxes, state, timers, AI, frame/update diagnostics and seed. |
| 11 | Merged | Collision regression tests | Consolidated into `#63`. |
| 14 | Implemented | Local match history | Stores a bounded versioned record for completed Versus and Arcade matches. |
| 15 | Implemented | First-run onboarding | Delivered localized three-step onboarding with skip and mode-preserving start. |
| 16 | Implemented | Contextual AI tactics | Delivered whiff punish, bait, punch-pattern crouch defense and legal air attacks; plan `0043` closed fairness review by explicit assumption. |
| 17 | Implemented | Late-round pressure and bounded anti-turtle | Delivered fixed-step timer/health pressure and accumulated-block responses in plan `0044`. |
| 18 | Merged | Style-aware AI adaptation | Closed into `#16`; observed behavior remains authoritative and CPU does not read `styleKey`. |
| 19 | Closed | Positional AI Special usage | Existing hitbox safety, lethal and comeback use were accepted; no reproducible residual justified expansion. |
| 24 | Implemented | Input-aware help and onboarding | Delivered session-only keyboard/touch/gamepad guidance; plan `0043` closed human/AT review by explicit assumption. |
| 32 | Implemented | Lightweight performance telemetry | Delivered bounded debug timing, DPR and Web Audio lifecycle diagnostics; plan `0043` closed hardware/long-session review by explicit assumption. |
| 34 | Merged | AI decision tuning hooks | Consolidated into contextual AI items with difficulty-config tunables and focused tests. |
| 35 | Implemented | Layered arena depth | Eight arenas render peripheral foreground after fighters and before combat feedback. |
| 37 | Implemented | Arena readability pass | Eight arenas retain readable fighters, HUD, corners, foreground and reduced-motion behavior. |
| 44 | Merged | Richer foreground silhouettes | The delivered `#35` foreground and completed `#37` review left no named residual; reopen only for a concrete arena opportunity. |
| 56 | Implemented | Difficulty personality visuals | CPU appearance varies by difficulty without changing behavior. |
| 62 | Implemented | Frame-rate-independent combat simulation | Bounded fixed 60 Hz steps keep movement, combat timers, AI and round time equivalent at 30/60/120 FPS. |
| 63 | Implemented | Posture-specific pushboxes and collision regressions | Fighter separation covers standing, crouch, air, facing and corners. |
| 64 | Implemented | Interrupted-input recovery and inactive-page pause | Input clears on interruption and hidden active matches pause until explicit resume. |
| 65 | Implemented | Native accessible touch controls | Eight semantic Pointer Event controls support cancellation, capture loss and multitouch. |
| 66 | Implemented | Keep overlays touch-scrollable | Gameplay retains `touch-action: none`; overlays allow vertical pan and scroll. |
| 67 | Implemented | Pages validation quality gate | Pull requests and pushes validate JavaScript and tests before deployment. |
| 68 | Implemented | Static HTML integration contract | Tests protect required IDs, local resources, script order and inventories. |
| 69 | Implemented | Localized accessibility labels | Delivered ES/EN touch, Training, binding, action and slot labels; plan `0043` closed screen-reader review by explicit assumption. |
| 70 | Merged | Documentation/configuration inventory | README inventory was corrected and automatic checks moved into `#68`. |
| 71 | Implemented | Visual CPU rival roster | Four selectable rivals provide localized identity without changing difficulty or AI. |
| 72 | Implemented | Preserve native keyboard operation | Delivered modifier/native-target policy, gameplay focus and non-wrapping Tab order; plan `0043` closed physical validation by explicit assumption. |
| 73 | Implemented | Buffer valid second combo inputs | Delivered one fixed-step pending input with interruption and 30/60/120 coverage; plan `0043` closed physical timing by explicit assumption. |
| 74 | Implemented | Consultable semantic combat status | Delivered non-live localized status and explicit keyboard/gamepad query; plan `0043` closed AT/zoom review by explicit assumption. |
| 75 | Implemented | Active mode and touch Special state | Delivered mode/progress context and non-color Special readiness; plan `0043` closed physical/hybrid review by explicit assumption. |
| 76 | Implemented | GLITCH CANCEL MVP | Delivered a Training-only experiment; the pilot outcome was accepted by explicit assumption and the rule remains disabled in Versus/Arcade. |
| 77 | Closed | First-session comprehension and recurring depth | Six new and four recurrent sessions were accepted as complete by explicit user assumption in plan `0043`; no primary study record is claimed. |
