export type Nft = {
  key: string;
  name: string;
  collection: string;
  image: string;
  description: string;
  standard: "ERC-721" | "ERC-1155";
  sample: boolean;
  contract?: `0x${string}`;
  tokenId?: string;
  quantity?: string;
  attributes?: { trait_type: string; value: string }[];
};

export const SAMPLES: Nft[] = [
  {
    key: "sample-sage",
    name: "Sage",
    collection: "Little companions",
    image: "./art/sage.svg",
    description: "A quiet companion with a growing collection of houseplants.",
    standard: "ERC-721",
    sample: true,
  },
  {
    key: "sample-daydream",
    name: "Soft daydream",
    collection: "Objects of wonder",
    image: "./art/daydream.svg",
    description:
      "An impossible arch, a floating sphere, and a moment to pause.",
    standard: "ERC-721",
    sample: true,
  },
  {
    key: "sample-golden",
    name: "Golden hour",
    collection: "Somewhere slow",
    image: "./art/golden.svg",
    description: "The last light over a landscape that takes its time.",
    standard: "ERC-721",
    sample: true,
  },
  {
    key: "sample-bloom",
    name: "A little sunshine",
    collection: "Little companions",
    image: "./art/bloom.svg",
    description: "A friendly bloom, finding a little sunshine in every day.",
    standard: "ERC-721",
    sample: true,
  },
  {
    key: "sample-cloud",
    name: "Cloud nine",
    collection: "Somewhere slow",
    image: "./art/cloud.svg",
    description: "A small cloud with nowhere in particular to be.",
    standard: "ERC-721",
    sample: true,
  },
  {
    key: "sample-night",
    name: "Night watch",
    collection: "Little companions",
    image: "./art/night.svg",
    description: "Keeping good company under a crescent moon.",
    standard: "ERC-721",
    sample: true,
  },
];

export type GameRecord = {
  id: string;
  moves: number;
  seconds: number;
  date: string;
  deck: string;
};
export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function gameHistory(): GameRecord[] {
  const value = readStored<unknown>("grove:games", []);
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is GameRecord =>
        !!v &&
        typeof v.id === "string" &&
        typeof v.moves === "number" &&
        v.moves >= 6 &&
        typeof v.seconds === "number" &&
        v.seconds >= 0 &&
        typeof v.date === "string" &&
        typeof v.deck === "string",
    )
    .slice(0, 20);
}

export function favorites(): Nft[] {
  const value = readStored<unknown>("grove:favorites", []);
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is Nft =>
        !!v &&
        typeof v.key === "string" &&
        typeof v.name === "string" &&
        typeof v.collection === "string" &&
        typeof v.image === "string" &&
        typeof v.sample === "boolean",
    )
    .slice(0, 200);
}
