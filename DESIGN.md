# Grove design system

## Overview

Grove is an independent NFT dashboard for EVM wallet holders on Robinhood Chain, paired with a free browser memory game. Its visual idea is a quiet green cabinet for colorful collectible artwork: forest navigation, warm neutral surfaces, lime actions and six original illustrated samples. Artwork carries the visual variety; interface decoration stays restrained.

`src/styles.css` is the styling source of truth. `src/App.tsx` composes the overview, collection and saved routes; `src/components/MatchGame.tsx` owns the play route. This is a light interface with a dark navigation rail, not a switchable light/dark theme.

## Colors

The hex primitives and role aliases are declared in `src/styles.css:1`.

| Semantic token | Value / primitive | Use |
| --- | --- | --- |
| `--color-bg` | `#f6f7f3`, neutral-50 | Page background |
| `--color-surface` | `#ffffff`, neutral-0 | Header, fields, modal and game surface |
| `--color-subtle` | `#eef0e9`, neutral-100 | Hover and fallback surfaces |
| `--color-text` | `#23342c`, neutral-900 | Main content and form values |
| `--color-muted` | `#647064`, neutral-500 | Supporting copy and metadata |
| `--color-border` | `#dde2d7`, neutral-200 | Structural outlines and separators |
| `--color-accent` | `#c5f277`, lime-300 | Primary action and selected navigation |
| `--color-accent-soft` | `#edf5e2`, lime-100 | Quiet supporting surfaces and saved state |
| `--color-accent-text` | `#294537`, pine-800 | Links and green surface text |
| `--color-focus` | `#426b25` | Two-pixel keyboard focus perimeter |
| `--color-error` / `--color-error-bg` | `#a63529` / `#fff2ed` | Actionable errors |
| `--sidebar` / `--sidebar-muted` | `#142b23` / `#b0beb3` | Navigation and its secondary labels |

Local component fills such as `#e9f0df` for the game invitation and `#e5eddd` for card backs are intentional illustrations/supporting surfaces. There is no unused warning or dark-theme ramp. Status text accompanies color. The network dot identifies the configured chain; it is not a claim of live network health. The probe measured resolved solid text pairs as meeting 4.5:1, or 3:1 for large text; image-overlaid pairs are reviewed separately in validation.

## Typography

One family: `DM Sans Variable`, with `DM Sans, sans-serif` fallbacks. Fontsource supplies local normal variable WOFF2 files for Latin and Latin extended. The interface uses weights **400, 500 and 600**. No italics or synthetic bold are requested.

| Token | Size | Role |
| --- | --- | --- |
| `--text-xs` | 12px | Metadata, compact controls and secondary notes |
| `--text-sm` | 14px | Desktop controls, supporting copy and artwork titles |
| `--text-base` | 16px | Editable mobile fields and small section headings |
| `--text-lg` | 20px | Section titles, game metrics and small display copy |
| `--text-xl` | 28px | Narrow-screen page titles and feature headings |
| `--text-display` | 36px | Wide-screen page title and wordmark |

Body line height is 1.55, controls 1.5 and display headings approximately 1.2. Mobile page headings use 1.25. Headings use balanced wrapping; prose uses pretty wrapping where supported. Page headings track at −0.045em on wide screens and −0.04em on mobile; section headings generally use −0.025em. The count tag explicitly resets letter spacing to normal. Game timers use tabular numbers. Long contract addresses, token IDs, collection names and artwork names wrap instead of losing critical content to ellipses.

## Layout

The spacing rhythm is based on roughly 4px increments, with 8–12px within control groups, 17–28px between related blocks and 34–36px around desktop content. `main` has a 1600px maximum width. Desktop gutters are 36px, decreasing to 26px, 20px and 16px as space narrows.

The desktop shell has a 216px sticky forest sidebar, an 84px header and flexible main content. The overview uses a three-column artwork gallery plus a 284px game column, separated by 28px. The full collection and saved routes use four artwork columns. All grids use `minmax(0, 1fr)` so long content can wrap.

Implemented breakpoints in `src/styles.css`:

- At 1600px and above, the overview's game column grows to 320px.
- At 1240px and below, the sidebar narrows to 186px, title becomes 28px and overview artwork uses two columns; the full gallery uses three.
- At 960px and below, navigation becomes a 76px icon rail. Explicit accessible link names survive hidden visual labels. Game supporting information moves below the board.
- At 720px and below, the sidebar becomes a horizontal navigation row below a compact header. Fields use 16px text.
- At 620px and below, the overview is one column, its compact playable-game invitation moves above the gallery, and artwork uses two columns. Dialogs become bottom sheets. The game board changes from four to three columns.
- At 380px and below, gallery filters wrap onto their own row and gutters become 16px.

DOM reading order keeps the wallet task first. The phone game invitation is a compact secondary entry, not a marketing hero. At 390 × 844, wallet lookup and “Play Grove Match” both fit in the first screen. Layout and all routes were checked in Chromium at 320–1440px; validation records the exact widths and unperformed checks.

## Elevation & Depth

The page is mostly flat: spacing and structural borders define the dashboard. Artwork uses a faint, inset black outline. Only modal dialogs and the status message have shadows; neither combines a shadow with a structural border. The modal's native top layer makes the background inert and its backdrop uses a translucent forest fill with a 4px blur. The fixed status message is dismissible and never carries an essential action.

## Shapes

`--radius-sm: 8px` is used for controls and memory cards, `--radius-md: 12px` for artwork and content panels, and `--radius-lg: 18px` for dialogs. Small tags use 4–6px corners. Navigation indicators and utility circles have purpose-specific radii. Artwork remains square and uses `object-fit: cover`; the details view exposes the same art with its own readable metadata. Clipping applies to artwork, not wallet addresses or token text.

## Components

| Component / pattern | Source | Behavior |
| --- | --- | --- |
| Brand, navigation and wallet search | `src/App.tsx` | Four hash routes, current-page state, semantic search form, validation on submit, loading/cancel/retry states, full address lookup |
| Button patterns | `src/styles.css`, `.button` | Lime primary, neutral bordered secondary, quiet text variant; hover, disabled, focus and 0.96 press feedback |
| `WalletControl` | `src/components/WalletControl.tsx` | EIP-6963 names/marks, generic fallback, phone app links, Coinbase Smart Wallet, per-request pending state, rejection recovery, network add/switch and disconnect |
| `Modal` | `src/components/Modal.tsx` | Native dialog, labeled heading, Escape/backdrop/close, inert background and focus restoration; bottom sheet on phones |
| `Artwork`, `NftCard`, `NftDetails` | `src/components/NftCard.tsx` | Image failure fallback, unmistakable sample labels, grid/list pattern, saved toggle, full metadata/address detail and copy feedback |
| Gallery controls | `src/App.tsx` | Search, collection selection, sorting, result reset, grid/list state, paginated loading, useful no-results and empty states |
| `InspectDialog` | `src/App.tsx` | Direct ownership read, standard selection, typed token ID, invalid-field focus, busy protection, error recovery and metadata-warning state |
| `MatchGame` | `src/components/MatchGame.tsx` | Twelve native card buttons, pair matching, live announcements, move/time/pair counters, start/pause/resume/restart/win, local history and personal best |
| Feedback | `src/App.tsx`, `.announcement` | Stable polite live region with dismissible status; field errors use alerts/descriptions; persistent empty/error states supply a next action |

Interactions work with native keyboard controls. The game moves focus to the first card after start/restart, preserves a useful control on pause/resume, and focuses “Play again” on completion. Unavailable game artwork uses a distinct local sample illustration for each pair. Automatic pausing hides cards when the tab becomes hidden. In-progress games end on navigation; only completed games are saved.

Motion is opt-in under `prefers-reduced-motion: no-preference`: 150ms transitions of specific properties, button press scaling and a loading spinner. No motion is needed to understand game state; reduced motion uses immediate state changes. There is no autoplay decoration.

## Do's and Don'ts

- Start another dashboard route with `main`, `.page-title` and existing section/gallery primitives; add its hash to `ROUTES`.
- Use the existing six type sizes and three weights. Make hierarchy with spacing before adding new type tokens.
- Keep one lime task action per active task surface; keep peer controls neutral.
- Retain complete addresses and accessible names when layouts condense. Keep a visible route/selection cue in addition to color.
- Label sample art and browser-only state plainly. Never present samples as holdings, local history as a shared leaderboard, or browser gameplay as a sponsored blockchain transaction.
- Add new NFT reads in `src/lib/network.ts`; use its chain configuration and URL sanitization. Do not put private credentials in a static build.
- Preserve visible focus, native dialog behavior, reduced-motion handling and local asset URLs when extending components.

Design guidance: Jakub Krehel's Better Interface (MIT), with documentation method adapted from Paul Bakaus's Impeccable (Apache-2.0). Full pinned notices are retained in `docs/DESIGN-GUIDANCE-LICENSES.txt`.
