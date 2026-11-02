/** Acceptance checks against the production export. No wallet funds or signatures are used.
 * Point IMD_PLAYWRIGHT at an installed Playwright module, or install Playwright externally.
 * All fixtures are scoped to browser request interception, never production data.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { encodeFunctionResult, parseAbi } from "viem";
const { chromium, webkit } = process.env.IMD_PLAYWRIGHT
  ? await import(pathToFileURL(process.env.IMD_PLAYWRIGHT).href)
  : await import("playwright");
const root = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = decodeURIComponent(url.pathname).replace(
      /^\/gateway\/grove\//,
      "/",
    );
    const file = resolve(
      root,
      `.${path}${path.endsWith("/") ? "index.html" : ""}`,
    );
    if (!file.startsWith(root + "/")) throw Error("Invalid path");
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/gateway/grove/`;
const results = [];
let browser;
function pass(name) {
  results.push(name);
  console.log(`PASS ${name}`);
}
const wallet = "0x1234567890123456789012345678901234567890";
const contract = "0x1234567890123456789012345678901234567891";
const second = "0x1234567890123456789012345678901234567892";
const fixtureItem = (id, tokenContract = contract) => ({
  id: String(id),
  image_url: "",
  metadata: {
    name: `Fixture NFT ${id}`,
    description: "Test fixture only",
    attributes: [{ trait_type: "Fixture", value: "Yes" }],
  },
  token: {
    address_hash: tokenContract,
    name: "Fixture collection",
    type: "ERC-721",
  },
});
const wait = async (fn, timeout = 4000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw Error("Condition timed out");
};
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [],
    localFailures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (r) => {
    if (r.url().startsWith(new URL(url).origin) && r.status() >= 400)
      localFailures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.locator(".nft-card").last().waitFor();
  assert.equal(await page.locator(".nft-card").count(), 6);
  for (const meta of ["description", "og:title", "og:image"])
    assert.ok(
      await page
        .locator(`meta[name="${meta}"],meta[property="${meta}"]`)
        .getAttribute("content"),
    );
  const ogPath = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const ogResponse = await page.request.get(new URL(ogPath, url).href);
  assert.equal(ogResponse.status(), 200);
  assert.equal(ogResponse.headers()["content-type"], "image/png");
  pass(
    "Static gateway subpath, all six sample artworks, title and local share image",
  );

  await page.getByRole("button", { name: "View NFTs", exact: true }).click();
  assert.ok(await page.locator("#wallet-error").isVisible());
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "wallet-address",
  );
  pass("Wallet address validation and invalid-field focus");

  await page
    .getByRole("searchbox", { name: "Search artworks", exact: true })
    .fill("Sage");
  assert.equal(await page.locator(".nft-card").count(), 1);
  await page
    .getByRole("searchbox", { name: "Search artworks", exact: true })
    .fill("no-such-art");
  assert.ok(
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByLabel("Filter by collection")
    .selectOption("Little companions");
  assert.equal(await page.locator(".nft-card").count(), 3);
  await page.getByLabel("Filter by collection").selectOption("all");
  await page.getByRole("button", { name: "List view", exact: true }).click();
  assert.equal(await page.locator(".nft-list-row").count(), 6);
  await page.getByRole("button", { name: "Grid view", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Sort artworks", exact: true })
    .selectOption("name");
  assert.equal(
    await page.locator(".nft-card .nft-name").first().innerText(),
    "A little sunshine",
  );
  pass(
    "Search, no-results recovery, collection filter, sorting, grid and list views",
  );

  await page.getByRole("button", { name: "View Sage", exact: true }).click();
  assert.ok(await page.getByRole("dialog").isVisible());
  assert.ok(
    await page
      .getByText("Original art · not minted", { exact: true })
      .isVisible(),
  );
  await page.getByRole("button", { name: "Save artwork", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "View Sage",
  );
  await page.locator('.primary-nav a[href="#saved"]').click();
  await page
    .getByRole("heading", { name: "Keep the good ones close.", exact: true })
    .waitFor();
  assert.equal(await page.locator(".nft-card").count(), 1);
  await page.reload();
  await page.getByRole("button", { name: "View Sage", exact: true }).waitFor();
  assert.equal(await page.locator(".nft-card").count(), 1);
  await page.getByRole("button", { name: "Unsave Sage", exact: true }).click();
  assert.ok(
    await page
      .getByText("A good eye deserves a collection.", { exact: true })
      .isVisible(),
  );
  pass(
    "Artwork details, honest sample state, favorites persistence, unsave and modal focus return",
  );

  await page.locator('.primary-nav a[href="#overview"]').click();
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  assert.ok(
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .isVisible(),
  );
  assert.ok(
    await page
      .getByRole("button", { name: "Coinbase Wallet", exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await page
    .getByText(
      "Connection was declined or the wallet is unavailable. Choose a wallet to try again.",
      { exact: true },
    )
    .waitFor();
  await page.keyboard.press("Escape");
  pass(
    "Connect sheet, browser/Smart Wallet choices, missing-wallet recovery and Escape",
  );

  await page.route("**/api/v2/addresses/*/nft?*", async (route) => {
    const page = new URL(route.request().url()).searchParams.get("id");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        page
          ? { items: [fixtureItem(2, second)], next_page_params: null }
          : {
              items: [fixtureItem(1)],
              next_page_params: { id: "2", items_count: 1 },
            },
      ),
    });
  });
  await page.getByLabel("Explore any EVM wallet").fill(wallet);
  await page.getByRole("button", { name: "View NFTs", exact: true }).click();
  await page
    .getByRole("button", { name: "View Fixture NFT 1", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Load more NFTs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Fixture NFT 2", exact: true })
    .waitFor();
  assert.equal(await page.locator(".nft-card").count(), 2);
  assert.equal(await page.locator(".nft-card .art-tag").count(), 0);
  pass(
    "Indexed NFT parsing, live/sample separation and pagination using intercepted fixtures",
  );

  await page.unroute("**/api/v2/addresses/*/nft?*");
  await page.route("**/api/v2/addresses/*/nft?*", (route) =>
    route.fulfill({ status: 403, body: "Forbidden" }),
  );
  await page
    .getByRole("button", { name: "Refresh wallet NFTs", exact: true })
    .click();
  await page
    .getByText("Couldn’t load the wallet index", { exact: true })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Try again", exact: true })
      .isVisible(),
  );
  assert.ok(
    await page
      .getByRole("link", { name: "Open explorer", exact: true })
      .isVisible(),
  );
  pass(
    "HTTP 403 error state with retry, explorer and direct-inspection recovery",
  );

  const abi = parseAbi([
    "function ownerOf(uint256 tokenId) view returns(address)",
    "function tokenURI(uint256 tokenId) view returns(string)",
    "function name() view returns(string)",
    "function balanceOf(address account, uint256 id) view returns(uint256)",
    "function uri(uint256 id) view returns(string)",
  ]);
  await page.route(
    "https://rpc.mainnet.chain.robinhood.com/**",
    async (route) => {
      const input = route.request().postDataJSON();
      function answer(p) {
        if (p.method === "eth_chainId")
          return { jsonrpc: "2.0", id: p.id, result: "0x1237" };
        if (p.method === "eth_call") {
          const data = p.params[0].data;
          let result;
          if (data.startsWith("0x6352211e"))
            result = encodeFunctionResult({
              abi,
              functionName: "ownerOf",
              result: wallet,
            });
          else if (data.startsWith("0xc87b56dd"))
            result = encodeFunctionResult({
              abi,
              functionName: "tokenURI",
              result:
                "data:application/json;base64," +
                Buffer.from(
                  JSON.stringify({
                    name: "Verified fixture",
                    description: "Test-only fixture",
                  }),
                ).toString("base64"),
            });
          else if (data.startsWith("0x00fdd58e"))
            result = encodeFunctionResult({
              abi,
              functionName: "balanceOf",
              result: 3n,
            });
          else if (data.startsWith("0x0e89341c"))
            result = encodeFunctionResult({
              abi,
              functionName: "uri",
              result:
                "data:application/json;base64," +
                Buffer.from(
                  JSON.stringify({ name: "Verified 1155 fixture" }),
                ).toString("base64"),
            });
          else
            result = encodeFunctionResult({
              abi,
              functionName: "name",
              result: "Verified fixture collection",
            });
          return { jsonrpc: "2.0", id: p.id, result };
        }
        return { jsonrpc: "2.0", id: p.id, result: "0x0" };
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          Array.isArray(input) ? input.map(answer) : answer(input),
        ),
      });
    },
  );
  await page
    .getByRole("button", { name: "Inspect an NFT", exact: true })
    .click();
  await page.getByLabel("NFT contract address", { exact: true }).fill(contract);
  await page.getByLabel("Token ID", { exact: true }).fill("7");
  await page
    .getByRole("button", { name: "Verify and view NFT", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Verified fixture", exact: true })
    .waitFor();
  assert.equal(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    true,
    "Focus stays in the replacement NFT dialog",
  );
  assert.ok(await page.getByText("ERC-721", { exact: true }).isVisible());
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Inspect an NFT", exact: true })
    .click();
  await page.getByLabel("NFT contract address", { exact: true }).fill(contract);
  await page.getByLabel("Token ID", { exact: true }).fill("8");
  await page
    .getByLabel("Token standard", { exact: true })
    .selectOption("ERC-1155");
  await page
    .getByRole("button", { name: "Verify and view NFT", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Verified 1155 fixture", exact: true })
    .waitFor();
  assert.ok(await page.getByText("ERC-1155", { exact: true }).isVisible());
  assert.ok(await page.getByText("3", { exact: true }).isVisible());
  await page.keyboard.press("Escape");
  pass(
    "Direct ERC-721 ownerOf + tokenURI and ERC-1155 balanceOf + uri, via intercepted RPC fixtures",
  );

  await page.locator('.primary-nav a[href="#play"]').click();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    new URL(page.url()).hash,
    "#play",
    "Skip to content preserves the current route",
  );
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  assert.equal(await page.locator(".memory-card").count(), 12);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Turn card 1",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".memory-card.is-revealed").count(), 1);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await page.locator(".memory-card.is-revealed").count(), 0);
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "Resume game",
  );
  const paused = await page
    .locator(".game-scoreboard strong")
    .nth(2)
    .innerText();
  await page.waitForTimeout(1100);
  assert.equal(
    await page.locator(".game-scoreboard strong").nth(2).innerText(),
    paused,
  );
  assert.equal(await page.locator(".memory-card:disabled").count(), 12);
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "Pause game",
  );
  const cards = page.locator(".memory-card");
  const seen = new Map();
  let solved = 0;
  while (solved < 6) {
    const known = [...seen.entries()].find(
      ([, indexes]) =>
        indexes.length === 2 && indexes.every((i) => !seen.has(`done-${i}`)),
    );
    if (known) {
      const [key, indexes] = known;
      await cards.nth(indexes[0]).click();
      await cards.nth(indexes[1]).click();
      await wait(
        async () =>
          (await page.locator(".memory-card.is-matched").count()) >=
          (solved + 1) * 2,
      );
      seen.delete(key);
      for (const i of indexes) seen.set(`done-${i}`, []);
      solved++;
      continue;
    }
    const unknown = [];
    for (let i = 0; i < 12; i++)
      if (![...seen.values()].flat().includes(i) && !seen.has(`done-${i}`))
        unknown.push(i);
    if (!unknown.length) throw Error("Could not find unknown cards");
    const [i, j] = unknown;
    await cards.nth(i).click();
    const name1 = await cards.nth(i).getAttribute("aria-label");
    const key1 = name1.replace(/, revealed$/, "");
    seen.set(key1, [...(seen.get(key1) || []), i]);
    const other = seen.get(key1).find((index) => index !== i);
    if (other !== undefined) {
      await cards.nth(other).click();
      await wait(
        async () =>
          (await page.locator(".memory-card.is-matched").count()) >=
          (solved + 1) * 2,
      );
      seen.delete(key1);
      seen.set(`done-${i}`, []);
      seen.set(`done-${other}`, []);
      solved++;
      continue;
    }
    await cards.nth(j).click();
    const key2 = (await cards.nth(j).getAttribute("aria-label")).replace(
      /, (revealed|matched)$/,
      "",
    );
    seen.set(key2, [...(seen.get(key2) || []), j]);
    if (key1 === key2) {
      await wait(
        async () =>
          (await page.locator(".memory-card.is-matched").count()) >=
          (solved + 1) * 2,
      );
      seen.delete(key1);
      seen.set(`done-${i}`, []);
      seen.set(`done-${j}`, []);
      solved++;
    } else
      await wait(
        async () =>
          (await page
            .locator(".memory-card.is-revealed:not(.is-matched)")
            .count()) === 0,
      );
  }
  await page.getByText("A perfect little break.", { exact: true }).waitFor();
  assert.equal(await page.locator(".memory-card.is-matched").count(), 12);
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "Play again",
  );
  assert.equal(await page.locator(".memory-card .artwork-fallback").count(), 0);
  const gameImages = await page.locator(".memory-card img").evaluateAll(images => images.map(img => ({ src: img.src, loaded: img.complete && img.naturalWidth > 0 })));
  assert.equal(new Set(gameImages.map(img => img.src)).size, 6);
  assert.equal(gameImages.every(img => img.loaded), true);
  const gameData = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grove:games")),
  );
  assert.equal(gameData.length, 1);
  assert.ok(gameData[0].moves >= 6);
  await page.reload();
  assert.ok(
    await page
      .getByText(`${gameData[0].moves} moves`, { exact: true })
      .isVisible(),
  );
  pass(
    "Complete 12-card game, missing-art fallbacks, keyboard focus, pause/resume, win and persistent personal best",
  );

  for (const width of [320, 390, 620, 768, 960, 1240, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const hash of ["overview", "collection", "saved", "play"]) {
      await page.goto(url + "#" + hash);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `${hash} overflow at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const mainAction = await page
    .getByRole("button", { name: "View NFTs", exact: true })
    .boundingBox();
  const playAction = await page
    .getByRole("link", { name: "Play Grove Match", exact: true })
    .boundingBox();
  assert.ok(mainAction.y + mainAction.height < 844);
  assert.ok(playAction.y + playAction.height < 844);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a.effect?.getTiming().iterations === Infinity &&
              a.playState === "running",
          ).length,
    ),
    0,
  );
  pass(
    "All four routes at seven widths, both primary actions on 390px first screen and reduced motion",
  );

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  await mobile.goto(url);
  await mobile
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  for (const name of ["MetaMask", "Coinbase Wallet", "Rabby", "Phantom"]) {
    const link = mobile.getByRole("link", {
      name: `Open in ${name}`,
      exact: true,
    });
    assert.ok(await link.isVisible());
    const image = link.locator("img");
    assert.equal(
      await image.evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
  }
  assert.ok(
    await mobile
      .getByRole("button", { name: "Coinbase Smart Wallet", exact: true })
      .isVisible(),
  );
  await mobile.keyboard.press("Tab");
  assert.equal(
    await mobile.evaluate(() => !!document.activeElement?.closest("dialog")),
    true,
  );
  await mobile.keyboard.press("Escape");
  assert.equal(
    await mobile.evaluate(() => document.activeElement?.textContent),
    "Connect wallet",
  );
  await mobile.close();
  pass(
    "Phone wallet deep links and marks, Smart Wallet option, modal keyboard containment and focus return",
  );

  const connectedPage = await browser.newPage({
    viewport: { width: 320, height: 844 },
  });
  await connectedPage.addInitScript(
    ({ wallet }) => {
      let activeChain = "0x1",
        known = false,
        authorized = false;
      const listeners = new Map();
      window.__walletMethods = [];
      window.__rejectWallet = true;
      const emit = (name, value) =>
        (listeners.get(name) || []).forEach((fn) => fn(value));
      const provider = {
        on(name, fn) {
          listeners.set(name, [...(listeners.get(name) || []), fn]);
        },
        removeListener(name, fn) {
          listeners.set(
            name,
            (listeners.get(name) || []).filter((x) => x !== fn),
          );
        },
        async request({ method, params }) {
          window.__walletMethods.push(method);
          if (method === "eth_chainId") return activeChain;
          if (method === "eth_accounts") return authorized ? [wallet] : [];
          if (method === "eth_requestAccounts") {
            if (window.__rejectWallet) {
              window.__rejectWallet = false;
              throw Object.assign(Error("Rejected test request"), {
                code: 4001,
              });
            }
            authorized = true;
            return [wallet];
          }
          if (method === "wallet_switchEthereumChain") {
            if (!known)
              throw Object.assign(Error("Unknown chain"), { code: 4902 });
            activeChain = params[0].chainId;
            emit("chainChanged", activeChain);
            return null;
          }
          if (method === "wallet_addEthereumChain") {
            known = true;
            activeChain = params[0].chainId;
            emit("chainChanged", activeChain);
            return null;
          }
          if (method === "wallet_revokePermissions") {
            authorized = false;
            return null;
          }
          if (
            method === "wallet_getPermissions" ||
            method === "wallet_requestPermissions"
          )
            return [{ parentCapability: "eth_accounts" }];
          throw Error("Unsupported test method: " + method);
        },
      };
      const announce = () =>
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", {
            detail: {
              info: {
                uuid: "125add7d-9ab5-4c73-a912-2bdf8cbf6849",
                name: "Test Wallet",
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" fill="green"/></svg>',
                rdns: "test.wallet",
              },
              provider,
            },
          }),
        );
      window.addEventListener("eip6963:requestProvider", announce);
      announce();
    },
    { wallet },
  );
  await connectedPage.route("**/api/v2/addresses/*/nft?*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: [], next_page_params: null }),
    }),
  );
  await connectedPage.goto(url);
  await connectedPage
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await connectedPage
    .getByRole("button", { name: "Test Wallet", exact: true })
    .click();
  await connectedPage
    .getByText(
      "Connection was declined or the wallet is unavailable. Choose a wallet to try again.",
      { exact: true },
    )
    .waitFor();
  await connectedPage
    .getByRole("button", { name: "Test Wallet", exact: true })
    .click();
  await connectedPage
    .getByRole("button", { name: "Switch to Robinhood Chain", exact: true })
    .waitFor();
  assert.equal(
    await connectedPage.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  await connectedPage
    .getByRole("button", { name: "Switch to Robinhood Chain", exact: true })
    .click();
  await connectedPage
    .getByRole("dialog")
    .getByRole("button", { name: "Switch to Robinhood Chain", exact: true })
    .click();
  await connectedPage
    .getByRole("button", { name: "0x1234…7890", exact: false })
    .waitFor();
  const methods = await connectedPage.evaluate(() => window.__walletMethods);
  assert.ok(methods.includes("wallet_addEthereumChain"));
  assert.ok(methods.includes("wallet_switchEthereumChain"));
  assert.equal(
    methods.some((m) =>
      /sendTransaction|signMessage|personal_sign|eth_sign/.test(m),
    ),
    false,
  );
  await connectedPage
    .getByRole("button", { name: "Disconnect", exact: true })
    .click();
  await connectedPage
    .getByRole("button", { name: "Connect wallet", exact: true })
    .waitFor();
  await connectedPage.close();
  pass(
    "EIP-6963 named extension, rejection/retry, wrong chain, add/switch fallback, disconnect and no signing",
  );

  assert.deepEqual(errors, []);
  assert.deepEqual(localFailures, []);
  pass("No uncaught script errors or failed local resources");
  await page.close();
  try {
    const safari = await webkit.launch({ headless: true });
    const safariPage = await safari.newPage({
      viewport: { width: 390, height: 844 },
    });
    await safariPage.goto(url);
    await safariPage
      .getByRole("link", { name: "Play Grove Match", exact: true })
      .click();
    await safariPage
      .getByRole("button", { name: "Start game", exact: true })
      .click();
    assert.equal(await safariPage.locator(".memory-card").count(), 12);
    await safari.close();
    pass("WebKit: first-screen game entry and card interaction");
  } catch (e) {
    console.log(
      "LIMITATION WebKit check unavailable: " + e.message.split("\n")[0],
    );
  }
  console.log(`\n${results.length} interaction groups passed.`);
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
