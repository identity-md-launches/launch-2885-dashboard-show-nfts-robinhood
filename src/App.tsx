import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useConnection } from "wagmi";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Gamepad2,
  Grid2X2,
  Heart,
  Images,
  LayoutDashboard,
  Leaf,
  List,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { WalletControl } from "./components/WalletControl";
import { NftCard, NftDetails } from "./components/NftCard";
import { MatchGame, formatTime } from "./components/MatchGame";
import { Modal } from "./components/Modal";
import {
  favorites,
  gameHistory,
  SAMPLES,
  shortAddress,
  storeLocal,
  type Nft,
  type GameRecord,
} from "./lib/data";
import {
  chain,
  EXPLORER,
  fetchWalletNfts,
  inspectNft,
  validateWallet,
} from "./lib/network";

type Route = "overview" | "collection" | "play" | "saved";
const ROUTES: { id: Route; label: string; icon: typeof Leaf }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "collection", label: "Collection", icon: Images },
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "saved", label: "Saved", icon: Heart },
];
const getRoute = (): Route => {
  const value = location.hash.slice(1);
  return ROUTES.some((r) => r.id === value) ? (value as Route) : "overview";
};

function Brand() {
  return (
    <a className="brand" href="#overview" aria-label="Grove home">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M7 31V20A17 17 0 0 1 24 3h10v10a17 17 0 0 1-17 17h-4v7H7Z"
          fill="currentColor"
        />
        <path
          d="m13 25 14-14"
          stroke="var(--sidebar)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span>
        grove<span className="brand-period">.</span>
      </span>
    </a>
  );
}

function App() {
  const { address, isConnected } = useConnection();
  const [route, setRoute] = useState<Route>(getRoute);
  const [walletInput, setWalletInput] = useState("");
  const [loadedAddress, setLoadedAddress] = useState("");
  const [items, setItems] = useState<Nft[]>([]);
  const [source, setSource] = useState<"sample" | "wallet">("sample");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [nextPage, setNextPage] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [saved, setSaved] = useState<Nft[]>(favorites);
  const [history, setHistory] = useState<GameRecord[]>(gameHistory);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<Nft | null>(null);
  const [help, setHelp] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("all");
  const [sort, setSort] = useState("default");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const request = useRef<AbortController | null>(null);
  const walletField = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute());
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    setSearch("");
    setCollection("all");
  }, [route, source, loadedAddress]);
  useEffect(() => {
    document.title = `${ROUTES.find((r) => r.id === route)!.label} · Grove`;
  }, [route]);
  useEffect(() => () => request.current?.abort(), []);

  const loadWallet = useCallback(
    async (
      wallet: string,
      append = false,
      page: Record<string, string | number> | null = null,
    ) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setFetchError("");
      setWalletError("");
      setSource("wallet");
      if (!append) {
        setLoadedAddress(wallet);
        setItems([]);
        setNextPage(null);
        setLastUpdated("");
      }
      try {
        const result = await fetchWalletNfts(wallet, controller.signal, page);
        if (controller.signal.aborted) return;
        setItems((old) =>
          [...(append ? old : []), ...result.items].filter(
            (n, i, all) => all.findIndex((a) => a.key === n.key) === i,
          ),
        );
        setNextPage(result.next);
        setLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch (error) {
        if (!controller.signal.aborted)
          setFetchError(
            error instanceof Error
              ? error.message
              : "Unable to load this wallet. Try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isConnected && address) {
      setWalletInput(address);
      void loadWallet(address);
    }
  }, [address, isConnected, loadWallet]);

  function submitWallet(event: FormEvent) {
    event.preventDefault();
    const wallet = validateWallet(walletInput);
    if (!wallet) {
      setWalletError(
        "Enter a complete EVM address: 0x followed by 40 hexadecimal characters.",
      );
      walletField.current?.focus();
      return;
    }
    setWalletInput(wallet);
    void loadWallet(wallet);
  }
  function showSamples() {
    request.current?.abort();
    setLoading(false);
    setSource("sample");
    setItems([]);
    setLoadedAddress("");
    setFetchError("");
    setWalletError("");
    setNextPage(null);
    setWalletInput("");
  }
  function toggleSave(nft: Nft) {
    const exists = saved.some((n) => n.key === nft.key);
    const updated = exists
      ? saved.filter((n) => n.key !== nft.key)
      : [...saved, nft];
    setSaved(updated);
    const stored = storeLocal("grove:favorites", updated);
    setNotice(
      stored
        ? `${nft.name} ${exists ? "removed from saved." : "saved on this device."}`
        : "Browser storage is unavailable. Favorites will last for this visit.",
    );
  }
  function completeGame(record: GameRecord) {
    setHistory((old) => {
      const updated = [record, ...old].slice(0, 20);
      if (!storeLocal("grove:games", updated))
        setNotice(
          "Browser storage is unavailable. Your result will last for this visit.",
        );
      return updated;
    });
  }
  const active = source === "sample" ? SAMPLES : items;
  const displayed = route === "saved" ? saved : active;
  const collections = [...new Set(displayed.map((n) => n.collection))].sort();
  let filtered = displayed.filter(
    (n) =>
      (collection === "all" || n.collection === collection) &&
      `${n.name} ${n.collection} ${n.tokenId || ""}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  if (sort === "name")
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "collection")
    filtered = [...filtered].sort((a, b) =>
      a.collection.localeCompare(b.collection),
    );
  const best = history.length
    ? [...history].sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)[0]
    : undefined;
  const galleryTitle =
    route === "saved"
      ? "Saved favorites"
      : source === "sample"
        ? "A little inspiration"
        : "Wallet collection";

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus();
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-content">
          <nav className="primary-nav" aria-label="Main navigation">
            {ROUTES.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                className={`nav-item ${route === id ? "active" : ""}`}
                href={`#${id}`}
                aria-label={label}
                aria-current={route === id ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{label}</span>
                {id === "play" && <span className="nav-free">Free</span>}
                {id === "saved" && saved.length > 0 && (
                  <span className="nav-count">{saved.length}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Leaf size={27} strokeWidth={1.4} />
              <p>
                A little collecting.
                <br />A little play.
                <br />
                <span>All in one place.</span>
              </p>
            </div>
            <button
              type="button"
              className="sidebar-help"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
              How Grove works
              <ArrowUpRight size={15} />
            </button>
            <a
              className="sidebar-help"
              href="https://docs.robinhood.com/chain/"
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={19} />
              Chain documentation
              <ArrowUpRight size={15} />
            </a>
            <span className="sidebar-foot">Independent by nature.</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="breadcrumb">
            Your playground<span>/</span>
            <strong>{ROUTES.find((r) => r.id === route)!.label}</strong>
          </span>
          <div className="header-actions">
            <span className="network-chip">
              <span className="network-dot" />
              Robinhood Chain
              <ChevronDown size={13} />
            </span>
            <WalletControl />
            <button
              className="icon-button help-icon"
              type="button"
              aria-label="How Grove works"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {ROUTES.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-label={label}
              aria-current={route === id ? "page" : undefined}
              className={route === id ? "active" : ""}
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </nav>
        <main id="main-content" tabIndex={-1}>
          {route === "play" ? (
            <MatchGame
              art={active}
              history={history}
              onComplete={completeGame}
            />
          ) : (
            <>
              <div className="page-title">
                <div>
                  <h1 ref={titleRef} tabIndex={-1}>
                    {route === "overview"
                      ? "Your collection. Your playground."
                      : route === "saved"
                        ? "Keep the good ones close."
                        : "Room for your favorites."}
                  </h1>
                  <p>
                    {route === "saved"
                      ? "Your favorites, saved in this browser for another look."
                      : "Explore Robinhood Chain NFTs. Take a gas-free play break."}
                  </p>
                </div>
                {route !== "saved" && (
                  <button
                    type="button"
                    className="button secondary small desktop-explore"
                    onClick={() => {
                      walletField.current?.focus();
                      walletField.current?.scrollIntoView({
                        block: "center",
                        behavior: "instant",
                      });
                    }}
                  >
                    <Wallet size={16} />
                    Explore a wallet
                    <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
              {route !== "saved" && (
                <section
                  className="wallet-search-section"
                  aria-label="Explore a wallet"
                >
                  <form
                    className="wallet-search-form"
                    onSubmit={submitWallet}
                    noValidate
                  >
                    <label htmlFor="wallet-address">
                      <Search size={18} />
                      Explore any EVM wallet
                    </label>
                    <div
                      className={`wallet-input-row ${walletError ? "has-error" : ""}`}
                    >
                      <input
                        ref={walletField}
                        id="wallet-address"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={walletInput}
                        onChange={(e) => {
                          setWalletInput(e.target.value);
                          if (walletError) setWalletError("");
                        }}
                        placeholder="Paste a wallet address, 0x…"
                        aria-invalid={!!walletError}
                        aria-describedby={
                          walletError ? "wallet-error" : "wallet-hint"
                        }
                      />
                      <button
                        className="button primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <LoaderCircle size={17} className="spinner" />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                        <span>{loading ? "Loading…" : "View NFTs"}</span>
                      </button>
                    </div>
                    {walletError ? (
                      <p
                        className="inline-error"
                        id="wallet-error"
                        role="alert"
                      >
                        {walletError}
                      </p>
                    ) : (
                      <p className="field-hint" id="wallet-hint">
                        Read-only. No connection or signature needed.
                      </p>
                    )}
                  </form>
                  <div className="wallet-search-art" aria-hidden="true">
                    <div className="mini-leaf">
                      <Leaf size={30} />
                    </div>
                    <span>
                      A window into
                      <br />
                      your collection.
                    </span>
                  </div>
                </section>
              )}
              {route === "overview" && (
                <div className="stats-row">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Images size={20} />
                    </div>
                    <div>
                      <span>
                        {source === "sample"
                          ? "The preview gallery"
                          : "NFTs loaded"}
                      </span>
                      <strong>
                        {source === "sample"
                          ? "6 original artworks"
                          : `${items.length} ${items.length === 1 ? "NFT" : "NFTs"}`}
                      </strong>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Leaf size={20} />
                    </div>
                    <div>
                      <span>A lighter way to play</span>
                      <strong>No transaction fees</strong>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <span>Your match best</span>
                      <strong>
                        {best ? `${best.moves} moves` : "A fresh start"}
                      </strong>
                    </div>
                  </div>
                  <a href="#play" className="stat-link">
                    {best
                      ? `${history.length} games played`
                      : "Set your first score"}
                    <ArrowUpRight size={17} />
                  </a>
                </div>
              )}
              <div
                className={`dashboard-grid ${route === "overview" ? "" : "full-width"}`}
              >
                <section
                  className="collection-section"
                  aria-labelledby="gallery-heading"
                >
                  <div className="section-heading">
                    <div>
                      <h2 id="gallery-heading">
                        {galleryTitle}
                        <span className="count-tag">{displayed.length}</span>
                      </h2>
                      <p>
                        {route === "saved" ? (
                          "Favorites live on this device, including sample art."
                        ) : source === "sample" ? (
                          "Sample art to explore. Load a wallet for real NFTs."
                        ) : (
                          <>
                            <span className="wallet-source">
                              {shortAddress(loadedAddress)}
                            </span>{" "}
                            on Robinhood Chain
                            {lastUpdated && ` · Updated ${lastUpdated}`}
                          </>
                        )}
                      </p>
                    </div>
                    {source === "wallet" && route !== "saved" ? (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Refresh wallet NFTs"
                        disabled={loading}
                        onClick={() => void loadWallet(loadedAddress)}
                      >
                        <RefreshCw
                          size={18}
                          className={loading ? "spinner" : ""}
                        />
                      </button>
                    ) : (
                      route === "overview" && (
                        <a
                          className="section-link"
                          href="#collection"
                          aria-label="View full collection"
                        >
                          View all
                          <ArrowRight size={16} />
                        </a>
                      )
                    )}
                  </div>
                  <div className="gallery-controls">
                    <div className="gallery-search">
                      <Search size={17} />
                      <label htmlFor="nft-search" className="sr-only">
                        Search artworks
                      </label>
                      <input
                        type="search"
                        id="nft-search"
                        placeholder="Search artworks…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <label className="select-control">
                      <span className="sr-only">Filter by collection</span>
                      <select
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                      >
                        <option value="all">All collections</option>
                        {collections.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} />
                    </label>
                    <label className="sort-control icon-button">
                      <span className="sr-only">Sort artworks</span>
                      <ArrowDownWideNarrow size={18} />
                      <select
                        aria-label="Sort artworks"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="default">Original order</option>
                        <option value="name">Name A–Z</option>
                        <option value="collection">Collection A–Z</option>
                      </select>
                    </label>
                    <div className="view-controls" aria-label="Gallery view">
                      <button
                        className={view === "grid" ? "active" : ""}
                        type="button"
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                      >
                        <Grid2X2 size={17} />
                      </button>
                      <button
                        className={view === "list" ? "active" : ""}
                        type="button"
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>
                  {source === "wallet" && route !== "saved" && (
                    <div className="wallet-context">
                      <div className="address-full">
                        <Wallet size={15} />
                        <span>{loadedAddress}</span>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Copy viewed wallet address"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                loadedAddress,
                              );
                              setCopied(true);
                            } catch {
                              setNotice(
                                "Select the displayed wallet address to copy it.",
                              );
                            }
                          }}
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                      <button
                        className="inline-link"
                        type="button"
                        onClick={showSamples}
                      >
                        Show sample art
                      </button>
                    </div>
                  )}
                  {fetchError && route !== "saved" && (
                    <div className="error-state" role="alert">
                      <ShieldCheck size={23} />
                      <div>
                        <h3>Couldn’t load the wallet index</h3>
                        <p>{fetchError}</p>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={() =>
                              void loadWallet(
                                loadedAddress,
                                items.length > 0,
                                items.length > 0 ? nextPage : null,
                              )
                            }
                            disabled={loading}
                          >
                            <RefreshCw size={15} />
                            Try again
                          </button>
                          <a
                            className="inline-link"
                            href={`${EXPLORER}/address/${loadedAddress}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open explorer
                            <ArrowUpRight size={15} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {loading && items.length === 0 && route !== "saved" ? (
                    <div className="gallery-skeleton" role="status">
                      <LoaderCircle size={25} className="spinner" />
                      <p>Looking for NFTs on Robinhood Chain…</p>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={showSamples}
                      >
                        Cancel and show samples
                      </button>
                    </div>
                  ) : filtered.length ? (
                    <div className={view === "grid" ? "nft-grid" : "nft-list"}>
                      {filtered.map((nft) => (
                        <NftCard
                          nft={nft}
                          key={nft.key}
                          saved={saved.some((n) => n.key === nft.key)}
                          onSave={() => toggleSave(nft)}
                          onOpen={() => setDetail(nft)}
                          list={view === "list"}
                        />
                      ))}
                    </div>
                  ) : (
                    !fetchError && (
                      <div className="empty-state">
                        {route === "saved" ? (
                          <Heart size={32} />
                        ) : (
                          <Images size={32} />
                        )}
                        <h3>
                          {search || collection !== "all"
                            ? "No artworks match just yet."
                            : route === "saved"
                              ? "A good eye deserves a collection."
                              : "No indexed NFTs found."}
                        </h3>
                        <p>
                          {search || collection !== "all"
                            ? "Try another search or clear your filters."
                            : route === "saved"
                              ? "Save any artwork with the heart. It will be waiting here."
                              : "The index may be catching up. Inspect a specific NFT or explore the sample art."}
                        </p>
                        {search || collection !== "all" ? (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => {
                              setSearch("");
                              setCollection("all");
                            }}
                          >
                            Clear filters
                          </button>
                        ) : route === "saved" ? (
                          <a className="button secondary" href="#collection">
                            Explore the collection
                            <ArrowRight size={16} />
                          </a>
                        ) : (
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => setInspect(true)}
                          >
                            <Plus size={16} />
                            Inspect an NFT
                          </button>
                        )}
                      </div>
                    )
                  )}
                  {nextPage && source === "wallet" && route !== "saved" && (
                    <button
                      type="button"
                      className="button secondary load-more"
                      disabled={loading}
                      onClick={() =>
                        void loadWallet(loadedAddress, true, nextPage)
                      }
                    >
                      {loading ? "Loading…" : "Load more NFTs"}
                      <ChevronDown size={17} />
                    </button>
                  )}
                  {route !== "saved" && (
                    <div className="collection-footnote">
                      <p>
                        {source === "sample"
                          ? "Original Grove illustrations for preview, not minted."
                          : "Indexed ERC-721 & ERC-1155 holdings. Metadata is supplied by each collection."}
                      </p>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => setInspect(true)}
                      >
                        <Plus size={15} />
                        Inspect an NFT
                      </button>
                    </div>
                  )}
                </section>
                {route === "overview" && (
                  <aside className="discovery-aside">
                    <section
                      className="game-feature"
                      aria-labelledby="game-feature-title"
                    >
                      <div className="feature-top">
                        <span>
                          <Gamepad2 size={17} />
                          The play break
                        </span>
                        <span className="free-label">Zero gas</span>
                      </div>
                      <div className="feature-art" aria-hidden="true">
                        <div className="feature-orbit" />
                        <img
                          className="feature-card back-card"
                          src="./art/bloom.svg"
                          alt=""
                        />
                        <div className="feature-card front-card">
                          <Leaf size={40} strokeWidth={1.2} />
                          <span>grove</span>
                        </div>
                        <Sparkles className="feature-sparkle" size={24} />
                      </div>
                      <h2 id="game-feature-title">Meet your match.</h2>
                      <p>
                        Your favorite art.
                        <br />A fresh little memory game.
                      </p>
                      <a className="button game-cta" href="#play">
                        Play Grove Match
                        <ArrowRight size={18} />
                      </a>
                      <p className="feature-fine">
                        Free browser play without transactions.
                      </p>
                    </section>
                    <section className="recent-games">
                      <div className="section-heading">
                        <h2>A little progress</h2>
                        <Trophy size={18} />
                      </div>
                      {history.length ? (
                        <>
                          <p className="muted">
                            Your last three games, on this device.
                          </p>
                          <ol>
                            {history.slice(0, 3).map((game) => (
                              <li key={game.id}>
                                <div className="result-icon">
                                  <Check size={17} />
                                </div>
                                <div>
                                  <strong>
                                    {game.moves} moves
                                    <span>{formatTime(game.seconds)}</span>
                                  </strong>
                                  <span>
                                    {new Date(game.date).toLocaleDateString(
                                      undefined,
                                      { month: "short", day: "numeric" },
                                    )}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </>
                      ) : (
                        <div className="progress-empty">
                          <span className="progress-line">
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                          <p>
                            No games yet. Your first personal best is one play
                            break away.
                          </p>
                          <a className="inline-link" href="#play">
                            Make your first match
                            <ArrowRight size={15} />
                          </a>
                        </div>
                      )}
                    </section>
                  </aside>
                )}
              </div>
            </>
          )}
          <footer className="footer">
            <p>
              <Leaf size={14} />
              Collect what you love. Play a little.
            </p>
            <div>
              <span>Independent project. Not affiliated with Robinhood.</span>
              <button type="button" onClick={() => setHelp(true)}>
                About Grove
                <ArrowUpRight size={14} />
              </button>
            </div>
          </footer>
        </main>
      </div>
      <div className="announcement" role="status" aria-live="polite">
        {notice && (
          <>
            <Check size={17} />
            <span>{notice}</span>
            <button
              className="icon-button"
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              <X size={17} />
            </button>
          </>
        )}
      </div>
      {detail && (
        <NftDetails
          nft={detail}
          saved={saved.some((n) => n.key === detail.key)}
          onSave={() => toggleSave(detail)}
          onClose={() => setDetail(null)}
        />
      )}
      {help && (
        <Modal title="A little about Grove" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p>
              Grove is an independent NFT dashboard and a place to take a play
              break on Robinhood Chain.
            </p>
            <h3>Explore a wallet</h3>
            <p>
              Paste any EVM address, or connect your wallet. NFTs are read from
              the public Blockscout index for Robinhood Chain, chain {chain.id}.
              Browse, search, and save your favorites.
            </p>
            <h3>When the index is unavailable</h3>
            <p>
              Use “Inspect an NFT” with a contract address and token ID. Grove
              checks ownership directly on Robinhood Chain. Some metadata hosts
              may not allow browser access.
            </p>
            <h3>Why the game costs nothing</h3>
            <p>
              Grove Match runs entirely in your browser. It sends no
              transaction, requires no signature, and offers no token rewards.
              Robinhood Chain transactions themselves still require ETH for gas.
            </p>
            <h3>What stays on your device</h3>
            <p>
              Favorites and your last 20 game scores are saved in this browser.
              There is no shared leaderboard. Wallet lookups are sent to the
              public explorer; NFT images may load from their metadata hosts.
            </p>
            <a
              className="button secondary"
              href="https://docs.robinhood.com/chain/connecting/"
              target="_blank"
              rel="noreferrer"
            >
              Robinhood Chain documentation
              <ArrowUpRight size={17} />
            </a>
          </div>
        </Modal>
      )}
      {inspect && (
        <InspectDialog
          initialWallet={loadedAddress || walletInput}
          onClose={() => setInspect(false)}
          onAdd={(nft, wallet, warning) => {
            request.current?.abort();
            setLoading(false);
            if (
              wallet.toLowerCase() !== loadedAddress.toLowerCase() ||
              source !== "wallet"
            ) {
              setItems([nft]);
              setNextPage(null);
            } else
              setItems((old) => [nft, ...old.filter((n) => n.key !== nft.key)]);
            setSource("wallet");
            setLoadedAddress(wallet);
            setWalletInput(wallet);
            setFetchError("");
            setWalletError("");
            setLastUpdated(
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            );
            setNotice(
              warning ||
                "Ownership verified on Robinhood Chain. NFT added to this view.",
            );
            setInspect(false);
            setDetail(nft);
          }}
        />
      )}
    </div>
  );
}

function InspectDialog({
  initialWallet,
  onClose,
  onAdd,
}: {
  initialWallet: string;
  onClose: () => void;
  onAdd: (nft: Nft, wallet: string, warning: string) => void;
}) {
  const [wallet, setWallet] = useState(initialWallet);
  const [contract, setContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [standard, setStandard] = useState<"ERC-721" | "ERC-1155">("ERC-721");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const form = useRef<HTMLFormElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const w = validateWallet(wallet),
      c = validateWallet(contract);
    if (
      !w ||
      !c ||
      !/^\d+$/.test(tokenId) ||
      tokenId.length > 78 ||
      BigInt(tokenId) >= 2n ** 256n
    ) {
      setInvalidField(!w ? "wallet" : !c ? "contract" : "token");
      setError(
        "Enter full EVM addresses and a nonnegative decimal token ID within uint256.",
      );
      form.current
        ?.querySelector<HTMLInputElement>(
          !w ? "#inspect-wallet" : !c ? "#inspect-contract" : "#inspect-token",
        )
        ?.focus();
      return;
    }
    setBusy(true);
    setError("");
    setInvalidField("");
    try {
      const result = await inspectNft(w, c, tokenId, standard);
      if (!alive.current) return;
      onAdd(result.nft, w, result.metadataWarning);
    } catch (e) {
      if (!alive.current) return;
      const message = e instanceof Error ? e.message : "";
      setError(
        message.startsWith("This wallet") || message.startsWith("The RPC")
          ? message
          : "Ownership could not be read. Check the network, contract, token standard and token ID, then try again.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <Modal title="Inspect an NFT" onClose={onClose}>
      <p className="modal-description">
        Know the contract and token ID? Verify this wallet’s ownership directly
        on Robinhood Chain.
      </p>
      <form ref={form} className="inspect-form" noValidate onSubmit={submit}>
        <label htmlFor="inspect-wallet">Wallet address</label>
        <input
          id="inspect-wallet"
          disabled={busy}
          aria-invalid={invalidField === "wallet"}
          aria-describedby={error ? "inspect-error" : undefined}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <label htmlFor="inspect-contract">NFT contract address</label>
        <input
          id="inspect-contract"
          disabled={busy}
          aria-invalid={invalidField === "contract"}
          aria-describedby={error ? "inspect-error" : undefined}
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <div className="form-columns">
          <div>
            <label htmlFor="inspect-token">Token ID</label>
            <input
              id="inspect-token"
              disabled={busy}
              aria-invalid={invalidField === "token"}
              aria-describedby={error ? "inspect-error" : undefined}
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="e.g. 42"
              inputMode="numeric"
              required
            />
          </div>
          <div>
            <label htmlFor="inspect-standard">Token standard</label>
            <select
              id="inspect-standard"
              disabled={busy}
              value={standard}
              onChange={(e) =>
                setStandard(e.target.value as "ERC-721" | "ERC-1155")
              }
            >
              <option>ERC-721</option>
              <option>ERC-1155</option>
            </select>
          </div>
        </div>
        {error && (
          <p className="inline-error" id="inspect-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy} type="submit">
          {busy ? (
            <LoaderCircle size={17} className="spinner" />
          ) : (
            <ShieldCheck size={17} />
          )}
          {busy ? "Verifying ownership…" : "Verify and view NFT"}
        </button>
        <p className="field-hint">Read-only. No transactions or fees.</p>
      </form>
    </Modal>
  );
}

export default App;
