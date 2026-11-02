# Grove validation

Worker validation on 2026-11-02. These are local checks, not independent network certification.

## Scope and assumptions

The deliverable is the static React/TypeScript website in `dist/`, with source and npm lockfile. Four hash routes cover overview, collection, saved favorites and Grove Match. The brief did not supply contracts, an indexer account, a sponsor, keys or a deployment handoff. The game is therefore explicitly browser gameplay with zero transactions and zero gas; it is not presented as a deployed on-chain contract. Network parameters were verified against the official Robinhood Chain documentation, not guessed.

Original sample art is visibly identified as sample/not minted. Wallet collection counts mean items loaded, not a complete balance. Scores and favorites are local to this device. There are no invented token prices, real-user activity, rewards, shared rankings or network-health metrics.

| Brief / acceptance area | Result | Evidence or limit |
| --- | --- | --- |
| NFT wallet dashboard on Robinhood Chain | Implemented with external limit | Indexed discovery, pagination, details and direct ownership reads; public index returned HTTP 403, so live complete-wallet enumeration is unconfirmed |
| Simple zero-gas game | Implemented as disclosed browser gameplay | Full six-pair win, pause, resume, restart and personal-best persistence tested; no signing/transaction path |
| Usable primary interactions | Passed | 13 Chromium interaction groups against production export |
| Responsive layouts | Passed | All four routes checked at seven widths; screenshots visually inspected |
| Relative static export + source/lockfile | Passed | Nested `/gateway/grove/` serving tested; metadata image and local assets resolved |
| Production build and typecheck | Passed | `npm run build`, `npm run typecheck` |
| Better Interface six-domain application and review | Completed with listed subcheck limits | Coverage and fixes below |
| Product/main action on first 390px screen | Yes | Wallet lookup and game entry measured within 844px; screenshot inspected |
| Title, favicon, description, OG title/image | Present | 1200 × 630 local PNG fetched successfully by interaction check |
| Documentation | Present | Root README.md, DESIGN.md and this review |

Visual idea: a calm green cabinet for colorful NFT artwork, with a compact memory-game invitation alongside the collection.

## Commands and actual results

- `npm run build`: passed; TypeScript then Vite produced the complete export. Vite's only advisory is the approximately 619 kB main JavaScript chunk (189 kB gzip). It is recorded rather than hidden by raising the warning threshold.
- `npm run typecheck`: passed with no TypeScript diagnostics.
- `node scripts/check-interactions.mjs`, using the supplied external Playwright module and Chromium: **13 interaction groups passed**. The script manages and closes its own foreground HTTP server and browser. It checks a nested static gateway path, not Vite's development server.
- Pinned `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste`, using the provided Playwright and browser locations: **16/16 checks passed** on the production export. The supplied probe files are inputs and are not part of delivery.
- A separate live-browser check verified real ERC-721 ownership and metadata artwork on Robinhood Chain for a currently owned Slipstream V3 Deposit token. The supplied RPC access stood in for the configured public RPC during this check. It establishes real chain reads through the app; it does not establish public RPC CORS or availability in every visitor's browser.
- The public explorer NFT-index service returned **HTTP 403** during direct access. The browser error/retry/direct-inspection path was checked. Successful indexed response parsing and pagination were tested with explicitly intercepted fixtures, not described as live results.
- WebKit launch was attempted and could not run because its executable was unavailable. No extra browser was installed. The separately supplied browser connector returned a transport error; all actual rendered checking used the working direct Playwright/Chromium path.

Interaction coverage includes address validation/focus, searching, collection filters, sorting, grid/list, no-results reset, sample detail disclosure, saved/unsaved persistence after reload, missing-wallet recovery, Escape and focus return, indexed parsing/pagination, HTTP 403, direct ERC-721 and ERC-1155 reads, mixed NFT/sample game deck, missing-art fallback uniqueness, keyboard card turns, game focus after start/pause/resume/win, a full game and persisted best, reduced motion, mobile wallet link names/icons, a discovered EIP-6963 extension, rejection/retry, unknown-chain add/switch fallback, disconnect and absence of signing/transaction requests.

The wallet and RPC fixtures are isolated in the validation script's request interception. They are not included in the application runtime. Real wallet app launch, real extension signing and Coinbase passkey creation are not claimed.

## Design probe

| Check | Final result |
| --- | --- |
| Render / local resources | Pass, no script errors or missing local files |
| Layout | Pass, no horizontal overflow, text collisions, floating-control overlap or hidden text at 320/390/1440 |
| Targets | Pass, all 35 measured controls meet 24px or its spacing exception; 23 are below the 44px comfort target |
| Contrast | Pass for resolved solid backgrounds; 13 image/media-overlay text boxes excluded from automated measurement |
| Casing | Pass |
| Tracking | Pass |
| Eyebrows | Pass |
| Type sizes | Pass, four recurring sizes on phone; no more than the six-token scale on desktop |
| Type families/weights | Pass, one family; weights 400/500/600 |
| Glyphs | Pass |
| Slogans | Pass, two two-beat lines |
| Repetition | Pass |
| First-screen copy | Pass, 33 prose words at 390; 39 at 1440 |
| Surface treatment | Pass, no border+shadow surfaces, nested cards or gradient text |
| Motion | Pass, no `transition: all` or infinite motion under reduced motion |
| Share metadata | Pass |

The 44px target count is a comfort observation, not a claimed failure of WCAG's minimum spacing rule. The compact dashboard's secondary links and controls remain visually separated. Accessibility compliance as a whole is not inferred from this probe.

## Six-domain review

| Domain | Coverage | Evidence and unperformed subchecks |
| --- | --- | --- |
| Accessibility | Checked | Native buttons/forms/dialogs, named icon navigation, first-invalid focus, described errors, live regions, modal containment/return, skip-link route preservation, keyboard card activation, game state focus and reduced motion. No screen-reader session, forced-colors session, physical touch-device or native zoom test |
| Layout | Checked | Shared alignment, flexible grids, readable phone ordering and all routes at 320, 390, 620, 768, 960, 1240, 1440. Screenshots inspected at 320, 390, 768 and 1440. RTL and pseudo-localization not reviewed; interface is English only |
| Writing | Checked | Action labels match behavior; error messages give recovery; sample and live data are separate; fees, storage scope and index limits are explicit. No unsourced real-world counters or prizes |
| Typography | Checked | Actual bundled DM Sans Variable, six size tokens, three weights, balanced headings, 16px editable phone fields, wrapping addresses and tabular timer values. Native 200% zoom and non-Latin-script coverage not reviewed |
| Colors | Checked | Solid text/background contrasts measured by the probe; focus visible in Chromium; sample tags inspected on all six illustrations. No dark theme is offered. Automated media-overlay contrast and forced-colors rendering not verified |
| UI details | Checked | Active/hover/focus, pending, loading, empty, failure, retry, success and saved states; modal and gallery responsiveness; real artwork error handling; interrupted game state, distinct fallback art, pause and completion. Animation-panel playback at 10% speed and WebKit not performed |

The actual production export was inspected, not only source. Working screenshots were generated under `test/scratch/` and are intentionally temporary, as required by the assignment. Evidence viewed includes `screens/overview-320.png`, `screens/overview-390.png`, `screens/overview-768.png`, `screens/overview-1440.png`, `screens/play-390.png`, `screens/game-390.png`, `screens/live-nft-390.png`, and the final probe's `taste/shots/390.png` and `1440.png`. These paths are not promised as delivered artifacts.

## Findings, changes and rechecks

| Severity | Source | Observed issue / change | Recheck |
| --- | --- | --- | --- |
| Medium | `src/styles.css:574`, `.count-tag` | Heading tracking inherited into the tiny count, yielding −0.042em. Explicit normal tracking fixes it. | Probe tracking passes |
| Medium | `src/App.tsx`, stats, collection footnote and game invitation | Five short multi-part slogan lines competed. Replaced supporting lines with factual copy; retained the main headline and sidebar voice. | Probe slogans passes with two |
| Medium | `src/App.tsx:268`, skip link | A hash-based skip target would reset a non-overview route. Prevent default hash navigation and focus/scroll main. | Keyboard activation preserves `#play` |
| Medium | `src/App.tsx:285`, primary navigation | Labels hidden by the icon-rail breakpoint also hid link names. Explicit accessible names now survive collapse. | Source and rendered named navigation checked |
| Medium | `src/App.tsx:1059`, `InspectDialog` | Async inspection could finish after dismissing the form; invalid fields lacked their own error association. Added mounted-state protection, busy field protection, invalid marking and shared described error. | Ownership dialogs and replacement-modal focus pass |
| Medium | `src/components/MatchGame.tsx`, `gameArea` focus effects | Start and pause/resume replace their triggering controls, requiring deliberate keyboard focus placement. Focus now follows first card, resume/pause and replay. | Keyboard assertions pass through complete game |
| Medium | `src/components/NftCard.tsx`, `Artwork` fallback; `src/components/MatchGame.tsx`, `makeDeck` | Multiple unreadable NFT images could make pairs visually indistinguishable. Each receives distinct unused local sample art; duplicate image URLs are excluded from the deck. | Completed mixed deck has exactly six distinct, successfully loaded face images |
| Medium | `src/components/WalletControl.tsx`, Rabby `OPEN_IN` entry | Generic query shape was not the production app's documented handler. Verified source requires `/mobile/`, `_cmd=open-dapp` and the `dapp` parameter. | Updated URL, mobile sheet rows and bundled marks validated; physical app not tested |

No observed high or medium implementation finding remains open in the reviewed Chromium scope. External and platform limitations are retained below.

## Remaining limitations

1. The public NFT index returned HTTP 403; live whole-wallet enumeration is not certified. A direct contract/token lookup is available and was verified with real chain data. Public RPCs and metadata hosts can also fail or restrict browser requests.
2. Gameplay is local and does not execute on Robinhood Chain. On-chain transactions with sponsored fees, shared state and rewards would require additional deployed infrastructure.
3. Real mobile wallet handoff, Coinbase passkey creation, WebKit, screen readers, native browser zoom, RTL, pseudo-localization and forced colors were not verified. Chromium mobile emulation is not a physical-device test.
4. Browser storage can be cleared or denied. Saved entries are metadata snapshots, not proof of continued ownership; direct inspection or refreshed wallet reads are needed for current ownership.
5. NFT metadata may contain unsupported media or unreachable external resources. Grove does not execute metadata HTML and only accepts approved URL schemes for media.

Complete for the stated static frontend scope, with the external index and browser/platform limits disclosed. Hosting and any future contract/sponsorship deployment are outside this delivery.

## File budget

The source and complete export fit within the 8,388,608-byte submission cap. The ignore-file path budget is documented in README.md and `.gitignore`: dependencies, caches, supplied inputs and temporary checks receive zero submitted bytes; `dist/` is retained. Final byte counts are appended below after the final build.

Final measured export: **856,018 bytes**. Complete submission file set, excluding the explicitly budgeted dependency/input/cache/scratch paths: **1,275,305 bytes**, below **8,388,608 bytes**. The complete export includes artwork, wallet marks, local fonts, share image and license notice.
