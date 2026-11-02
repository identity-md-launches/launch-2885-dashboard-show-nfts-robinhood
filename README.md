# Grove

An independent NFT dashboard for Robinhood Chain with a free memory game. Built with React, TypeScript and Vite. The complete static site is in `dist/`; its source and npm lockfile are included.

## Run and rebuild

Use Node.js 22 or newer and npm:

```sh
npm ci
npm run dev
```

For the production export:

```sh
npm run typecheck
npm run build
npm run preview
```

`npm run build` typechecks and writes `dist/index.html` plus its assets. Preview serves that export locally. Publish the contents of `dist/` using any static host; publishing is outside this delivery. Vite uses `base: './'`, runtime assets use relative paths, and navigation uses URL hashes. A nested gateway path needs no route rewrites. No environment file, private key, account, backend, or API credential is needed.

## What works

- Paste any full EVM address to request its indexed ERC-721 and ERC-1155 holdings on Robinhood Chain. Pages load explicitly with “Load more NFTs”; the count represents loaded NFTs, not a guaranteed total.
- Connect a discovered EIP-6963 browser wallet, use the phone wallet links, or choose Coinbase Wallet / Smart Wallet. The wallet control provides network switching, an explorer link and disconnect. Connection never requests a signature or transaction.
- Search artworks, filter by collection, sort, change between grid/list views, inspect details, copy addresses, and save favorites on this device.
- Use **Inspect an NFT** with an owner's wallet address, NFT contract address, token standard and token ID. It verifies ERC-721 `ownerOf` or a positive ERC-1155 `balanceOf` directly on chain 4663, then reads metadata. This works independently of the wallet index.
- Play **Grove Match**: find six matching pairs, pause/resume, restart and set a personal best. It uses up to six loaded NFTs, filling remaining spaces with Grove sample art. Unavailable NFT images receive distinct sample illustrations so pairs remain playable. A move is a pair of card turns. The best result uses fewest moves, then fastest time.

The six original SVG illustrations are explicitly labeled **Sample art**, with no invented NFT ownership or minting claims. They let visitors explore all collection tools without a wallet.

## Gas, data and limitations

**The game is browser gameplay, not an on-chain game contract.** It sends no transaction, has no mint, prize, payout, token reward or shared leaderboard, and costs zero gas. Results and favorites stay in this browser. Robinhood Chain transactions themselves require ETH; this site does not claim to sponsor them. An on-chain version would need a deployed game contract and a working sponsorship service, neither supplied by the brief.

Automatic discovery uses the public Blockscout NFT index. That endpoint returned **HTTP 403** during validation, so a successful live whole-wallet enumeration could not be confirmed here. The interface reports that failure and offers retry, an explorer link and direct NFT inspection. The direct ownership flow was successfully exercised against live chain data through the supplied RPC access. Index response parsing and pagination were separately checked with intercepted test fixtures.

Metadata, NFT media, public RPCs and IPFS gateways can be unavailable, incomplete or restricted by CORS. Unavailable artwork has an explicit fallback; unavailable metadata does not erase verified ownership. Supported metadata includes HTTPS, IPFS through `ipfs.io`, and JSON data URIs. The gallery does not estimate prices or portfolio value. It is not a marketplace.

Favorites and the latest 20 completed games are stored in `localStorage`. Clearing browser data clears them. If storage is unavailable, changes last for the current visit and a notice explains that. Wallet addresses are sent to the public explorer for discovery; NFT metadata and media may be retrieved from their own hosts. Images load without referrer information. No analytics are included.

## Actual validation

Production build and standalone TypeScript check passed. The pinned design probe passed **16/16** checks. Chromium interaction validation passed **13 groups**, including the full game, persistence, collection tools, wallet discovery, rejection/retry, chain add/switch fallback and disconnect. All four routes were checked for horizontal overflow at 320, 390, 620, 768, 960, 1240 and 1440 pixels. Wallet lookup and game entry are visible on the first 390 × 844 screen.

The repeatable interaction check serves `dist/` at a nested gateway path and closes its server/browser when finished:

```sh
node scripts/check-interactions.mjs
```

It needs an available Playwright module and Chromium. When Playwright is installed outside the project, set `IMD_PLAYWRIGHT` to its `index.mjs` and, if needed, `PLAYWRIGHT_BROWSERS_PATH` to its browser directory. The task's preinstalled Chromium was used; no second browser installation was made. Wallet and RPC fixtures in this script exist only inside intercepted browser requests and never ship as production data. WebKit was attempted but its executable was unavailable. Physical wallet apps, passkey creation, screen-reader sessions and native browser zoom were not tested.

Vite reports one nonblocking size advisory for the main JavaScript bundle, approximately 619 kB before compression (189 kB gzip). Detailed evidence, the six-domain review and limits are in [VALIDATION.md](VALIDATION.md); implemented design tokens and components are in [DESIGN.md](DESIGN.md).

## Sources and assets

Network configuration comes from the [official Robinhood Chain connection documentation](https://docs.robinhood.com/chain/connecting/): mainnet chain ID 4663, ETH, public RPC `https://rpc.mainnet.chain.robinhood.com`, explorer `https://robinhoodchain.blockscout.com`. The integration uses the explorer's `/api/v2/addresses/{address}/nft` endpoint; [Blockscout's API documentation](https://docs.blockscout.com/devs/blockscout-api) describes its indexed data services.

Wallet behavior follows the task's pinned connector reference. Rabby's universal link follows its [production link configuration](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/constant/universalLink.ts) and [open-dapp handler](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/hooks/universalLink.ts). Wallet vendor links are not physical-device validation.

Original sample art, logo and the 1200 × 630 PNG share image are bundled locally. DM Sans Variable is bundled through `@fontsource-variable/dm-sans`; its OFL notice is in `public/font-license.txt`. Icons use Lucide. Wallet marks are copied from RainbowKit, with attribution in [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md). Grove is not affiliated with Robinhood or any wallet provider.

## Submission path budget

The submission limit is **8,388,608 bytes**. `.gitignore` has an explicit zero-byte submission budget for `node_modules/` at every depth, `.vite/`, `.cache/`, `.npm/`, `.pnpm-store/`, TypeScript build caches, `test/scratch/` and the removable supplied inputs in `.imd/reads/`. Source, manifests, lockfile, documentation, scripts, original assets and the complete `dist/` export remain included. No registry archives, dependency mirrors, source maps or submodules are required. The final measured budget is recorded in `VALIDATION.md`.
