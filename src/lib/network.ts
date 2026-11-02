import {
  createPublicClient,
  defineChain,
  http,
  parseAbi,
  isAddress,
  getAddress,
} from "viem";
import { createConfig } from "wagmi";
import { injected, coinbaseWallet } from "wagmi/connectors";
import type { Nft } from "./data";

// Official parameters: https://docs.robinhood.com/chain/connecting/
export const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
export const EXPLORER = "https://robinhoodchain.blockscout.com";
export const chain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: EXPLORER } },
});

export const walletConfig = createConfig({
  chains: [chain],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Grove — NFTs & a little play" }),
  ],
  transports: { [chain.id]: http(RPC_URL, { timeout: 15000, retryCount: 1 }) },
});
export const publicClient = createPublicClient({
  chain,
  transport: http(RPC_URL, { timeout: 15000, retryCount: 1 }),
});

export const ERC721 = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
]);
export const ERC1155 = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function uri(uint256 id) view returns (string)",
]);

export function safeUrl(value: unknown, allowImageData = false): string {
  if (typeof value !== "string" || value.length > 3_000_000) return "";
  if (value.startsWith("ipfs://")) {
    const path = value.replace(/^ipfs:\/\/(ipfs\/)?/, "");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9/_%.?=&-]*$/.test(path)) return "";
    return `https://ipfs.io/ipfs/${path}`;
  }
  if (
    allowImageData &&
    /^data:image\/(png|jpeg|webp|gif|svg\+xml)[;,]/i.test(value)
  )
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function validateWallet(value: string): `0x${string}` | undefined {
  if (
    !isAddress(value.trim(), { strict: false }) ||
    /^0x0{40}$/i.test(value.trim())
  )
    return undefined;
  return getAddress(value.trim().toLowerCase());
}

export type NftPage = {
  items: Nft[];
  next: Record<string, string | number> | null;
};
type Metadata = {
  name?: unknown;
  description?: unknown;
  image?: unknown;
  image_url?: unknown;
  attributes?: unknown;
};
const stringValue = (v: unknown, fallback: string, limit = 500) =>
  typeof v === "string" ? v.slice(0, limit) : fallback;

export async function fetchWalletNfts(
  address: string,
  signal: AbortSignal,
  page?: Record<string, string | number> | null,
): Promise<NftPage> {
  const url = new URL(`${EXPLORER}/api/v2/addresses/${address}/nft`);
  url.searchParams.set("type", "ERC-721,ERC-1155");
  if (page)
    for (const [k, v] of Object.entries(page))
      url.searchParams.set(k, String(v));
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(16000)]),
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(
      "The wallet index is unavailable. Try again, open the explorer, or inspect an NFT below.",
    );
  }
  if (!response.ok)
    throw new Error(
      `The wallet index returned ${response.status}. Try again, open the explorer, or inspect an NFT below.`,
    );
  const data = await response.json();
  if (!Array.isArray(data.items))
    throw new Error(
      "The wallet index returned an unexpected response. Try inspecting an NFT below.",
    );
  const items = data.items.flatMap((item: Record<string, any>): Nft[] => {
    const token = item.token ?? {};
    const contract = validateWallet(token.address_hash ?? token.address ?? "");
    if (
      !contract ||
      !["ERC-721", "ERC-1155"].includes(token.type) ||
      !/^\d+$/.test(String(item.id))
    )
      return [];
    const metadata: Metadata = item.metadata ?? {};
    return [
      {
        key: `${contract.toLowerCase()}:${item.id}`,
        name: stringValue(
          metadata.name,
          `${token.name || "NFT"} #${item.id}`,
          200,
        ),
        collection: stringValue(token.name, "Unnamed collection", 200),
        contract,
        tokenId: String(item.id),
        standard: token.type,
        sample: false,
        image: safeUrl(
          item.image_url || metadata.image || metadata.image_url,
          true,
        ),
        description: stringValue(
          metadata.description,
          "Metadata supplied by this NFT’s contract.",
        ),
        quantity: item.value ? String(item.value) : undefined,
        attributes: parseAttributes(metadata.attributes),
      },
    ];
  });
  const next =
    data.next_page_params && typeof data.next_page_params === "object"
      ? data.next_page_params
      : null;
  return { items, next };
}

function parseAttributes(value: unknown): Nft["attributes"] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .filter(
      (v) =>
        v &&
        typeof v.trait_type === "string" &&
        ["string", "number"].includes(typeof v.value),
    )
    .map((v) => ({
      trait_type: v.trait_type.slice(0, 100),
      value: String(v.value).slice(0, 200),
    }));
}

async function readMetadata(uri: string): Promise<Metadata> {
  if (uri.startsWith("data:application/json;base64,")) {
    if (uri.length > 2_000_000) throw new Error("Metadata is too large.");
    return JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(uri.split(",")[1]), (c) => c.charCodeAt(0)),
      ),
    );
  }
  if (uri.startsWith("data:application/json,"))
    return JSON.parse(decodeURIComponent(uri.slice(22)));
  const url = safeUrl(uri);
  if (!url) throw new Error("The NFT uses an unsupported metadata URL.");
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("The metadata host is unavailable.");
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("Metadata is too large.");
  return JSON.parse(text);
}

export async function inspectNft(
  wallet: `0x${string}`,
  contract: `0x${string}`,
  tokenId: string,
  standard: "ERC-721" | "ERC-1155",
): Promise<{ nft: Nft; metadataWarning: string }> {
  if ((await publicClient.getChainId()) !== chain.id)
    throw new Error(
      "The RPC returned a different network. Please try again later.",
    );
  const id = BigInt(tokenId);
  let uri = "",
    quantity: string | undefined;
  if (standard === "ERC-721") {
    const owner = await publicClient.readContract({
      address: contract,
      abi: ERC721,
      functionName: "ownerOf",
      args: [id],
    });
    if (owner.toLowerCase() !== wallet.toLowerCase())
      throw new Error(
        "This wallet does not own that ERC-721 token. Check the address and token ID.",
      );
    uri = await publicClient
      .readContract({
        address: contract,
        abi: ERC721,
        functionName: "tokenURI",
        args: [id],
      })
      .catch(() => "");
  } else {
    const balance = await publicClient.readContract({
      address: contract,
      abi: ERC1155,
      functionName: "balanceOf",
      args: [wallet, id],
    });
    if (balance === 0n)
      throw new Error(
        "This wallet has no balance of that ERC-1155 token. Check the address and token ID.",
      );
    quantity = balance.toString();
    uri = await publicClient
      .readContract({
        address: contract,
        abi: ERC1155,
        functionName: "uri",
        args: [id],
      })
      .catch(() => "");
    uri = uri.replaceAll("{id}", id.toString(16).padStart(64, "0"));
  }
  const collection = await publicClient
    .readContract({ address: contract, abi: ERC721, functionName: "name" })
    .catch(() => "Unnamed collection");
  let metadata: Metadata = {},
    metadataWarning = "";
  try {
    metadata = await readMetadata(uri);
  } catch {
    metadataWarning =
      "Ownership verified. The artwork metadata could not be loaded.";
  }
  return {
    nft: {
      key: `${contract.toLowerCase()}:${id}`,
      name: stringValue(metadata.name, `${collection} #${id}`, 200),
      collection: collection.slice(0, 200),
      image: safeUrl(metadata.image || metadata.image_url, true),
      description: stringValue(
        metadata.description,
        "Ownership read directly from Robinhood Chain.",
      ),
      contract,
      tokenId: id.toString(),
      standard,
      sample: false,
      quantity,
      attributes: parseAttributes(metadata.attributes),
    },
    metadataWarning,
  };
}
