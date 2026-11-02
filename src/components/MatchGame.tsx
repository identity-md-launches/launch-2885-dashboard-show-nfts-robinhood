import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Leaf,
  Check,
  Clock,
  MousePointer2,
} from "lucide-react";
import { SAMPLES, type Nft, type GameRecord } from "../lib/data";
import { Artwork } from "./NftCard";

type Tile = { id: string; nft: Nft; backupImage?: string };
function makeDeck(art: Nft[]): Tile[] {
  const source = [...art, ...SAMPLES]
    .filter(
      (item, index, all) =>
        all.findIndex((n) => n.key === item.key) === index &&
        (!item.image || all.findIndex((n) => n.image === item.image) === index),
    )
    .slice(0, 6);
  const unusedArt = SAMPLES.filter(
    (sample) => !source.some((nft) => nft.image === sample.image),
  );
  const faces = source.map((nft) => ({
    nft,
    backupImage: nft.sample ? undefined : unusedArt.shift()?.image,
  }));
  const cards = [
    ...faces.map((face) => ({ id: `${face.nft.key}:a`, ...face })),
    ...faces.map((face) => ({ id: `${face.nft.key}:b`, ...face })),
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MatchGame({
  art,
  history,
  onComplete,
}: {
  art: Nft[];
  history: GameRecord[];
  onComplete: (record: GameRecord) => void;
}) {
  const [deck, setDeck] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState<"ready" | "playing" | "paused" | "complete">(
    "ready",
  );
  const [announcement, setAnnouncement] = useState("");
  const [deckName, setDeckName] = useState("Grove sample art");
  const intervalStart = useRef(0);
  const playedSeconds = useRef(0);
  const gameArea = useRef<HTMLElement>(null);
  const previousMode = useRef(mode);
  useEffect(() => {
    if (deck.length)
      gameArea.current
        ?.querySelector<HTMLButtonElement>(".memory-card:not(:disabled)")
        ?.focus({ preventScroll: true });
  }, [deck]);
  useEffect(() => {
    const selector =
      mode === "complete"
        ? ".game-complete button"
        : mode === "paused" ||
            (mode === "playing" && previousMode.current === "paused")
          ? ".game-controls button"
          : "";
    if (selector)
      gameArea.current
        ?.querySelector<HTMLButtonElement>(selector)
        ?.focus({ preventScroll: true });
    previousMode.current = mode;
  }, [mode]);
  const best = history.length
    ? [...history].sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)[0]
    : undefined;
  useEffect(() => {
    if (mode !== "playing") return;
    intervalStart.current = Date.now();
    const interval = window.setInterval(
      () =>
        setSeconds(
          playedSeconds.current +
            Math.floor((Date.now() - intervalStart.current) / 1000),
        ),
      250,
    );
    const pauseOnHide = () => {
      if (document.hidden) {
        playedSeconds.current += Math.floor(
          (Date.now() - intervalStart.current) / 1000,
        );
        setSeconds(playedSeconds.current);
        setMode("paused");
      }
    };
    document.addEventListener("visibilitychange", pauseOnHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", pauseOnHide);
    };
  }, [mode]);
  useEffect(() => {
    if (flipped.length !== 2 || mode !== "playing") return;
    const [a, b] = flipped.map((id) => deck.find((t) => t.id === id)!);
    if (a.nft.key === b.nft.key) {
      const nextMatched = [...matched, a.nft.key];
      setMatched(nextMatched);
      setFlipped([]);
      setAnnouncement(
        `${a.nft.name} matched. ${nextMatched.length} of 6 pairs found.`,
      );
      if (nextMatched.length === 6) {
        const elapsed =
          playedSeconds.current +
          Math.floor((Date.now() - intervalStart.current) / 1000);
        setSeconds(elapsed);
        setMode("complete");
        onComplete({
          id: crypto.randomUUID(),
          moves,
          seconds: elapsed,
          date: new Date().toISOString(),
          deck: deckName,
        });
      }
    } else {
      setAnnouncement("No match. Try another pair.");
      const delay = setTimeout(() => setFlipped([]), 850);
      return () => clearTimeout(delay);
    }
  }, [flipped, mode]);
  function start() {
    setDeck(makeDeck(art));
    setDeckName(
      art.some((n) => !n.sample)
        ? "Wallet art + Grove samples"
        : "Grove sample art",
    );
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    playedSeconds.current = 0;
    setMode("playing");
    setAnnouncement("Game started. Find all six matching pairs.");
  }
  function pause() {
    playedSeconds.current += Math.floor(
      (Date.now() - intervalStart.current) / 1000,
    );
    setSeconds(playedSeconds.current);
    setMode("paused");
  }
  function flip(tile: Tile) {
    if (
      mode !== "playing" ||
      flipped.length === 2 ||
      flipped.includes(tile.id) ||
      matched.includes(tile.nft.key)
    )
      return;
    setFlipped((old) => [...old, tile.id]);
    setAnnouncement(`${tile.nft.name} revealed.`);
    if (flipped.length === 1) setMoves((m) => m + 1);
  }
  return (
    <div className="game-page">
      <a href="#overview" className="back-link">
        <ArrowLeft size={17} />
        Back to overview
      </a>
      <div className="page-title game-title">
        <div>
          <h1>Grove Match</h1>
          <p>Six pairs. A little focus. Zero gas.</p>
        </div>
        <span className="soft-tag">
          <Leaf size={15} />
          Free to play
        </span>
      </div>
      <div className="game-layout">
        <section
          ref={gameArea}
          className="game-area"
          aria-label="Memory matching game"
        >
          <div className="game-scoreboard">
            <div>
              <MousePointer2 size={18} />
              <span>
                Moves<strong>{moves}</strong>
              </span>
            </div>
            <div>
              <Check size={18} />
              <span>
                Pairs<strong>{matched.length} / 6</strong>
              </span>
            </div>
            <div>
              <Clock size={18} />
              <span>
                Time<strong>{formatTime(seconds)}</strong>
              </span>
            </div>
          </div>
          {mode === "ready" ? (
            <div className="game-ready">
              <div className="ready-art" aria-hidden="true">
                <img src="./art/sage.svg" alt="" />
                <img src="./art/bloom.svg" alt="" />
              </div>
              <h2>A familiar face. Twice.</h2>
              <p>
                Turn over two cards to find a pair.
                <br />
                Match all six in as few moves as you can.
              </p>
              <button className="button primary" type="button" onClick={start}>
                <Play size={18} fill="currentColor" />
                Start game
              </button>
              <p className="field-hint">
                Use touch, or Tab and Enter to turn cards.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`memory-board ${mode === "paused" ? "is-paused" : ""}`}
                aria-label="12 matching cards"
              >
                {deck.map((tile, index) => {
                  const found = matched.includes(tile.nft.key),
                    revealed = flipped.includes(tile.id) || found;
                  return (
                    <button
                      type="button"
                      className={`memory-card ${revealed ? "is-revealed" : ""} ${found ? "is-matched" : ""}`}
                      key={tile.id}
                      onClick={() => flip(tile)}
                      disabled={mode !== "playing" || found}
                      aria-label={
                        mode === "paused"
                          ? `Card ${index + 1}, paused`
                          : revealed
                            ? `${tile.nft.name}${found ? ", matched" : ", revealed"}`
                            : `Turn card ${index + 1}`
                      }
                      aria-pressed={revealed}
                    >
                      {revealed && mode !== "paused" ? (
                        <>
                          <Artwork
                            nft={tile.nft}
                            fallbackImage={tile.backupImage}
                          />
                          {found && (
                            <span className="matched-check">
                              <Check size={17} />
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Leaf size={30} strokeWidth={1.5} />
                          <span className="sr-only">Face down</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="game-controls">
                {mode === "playing" && (
                  <button className="button secondary" onClick={pause}>
                    <Pause size={17} />
                    Pause game
                  </button>
                )}
                {mode === "paused" && (
                  <button
                    className="button primary"
                    onClick={() => {
                      setMode("playing");
                      setAnnouncement("Game resumed.");
                    }}
                  >
                    <Play size={17} />
                    Resume game
                  </button>
                )}
                {mode !== "complete" && (
                  <button className="button text-button" onClick={start}>
                    <RotateCcw size={17} />
                    Restart
                  </button>
                )}
              </div>
              {mode === "paused" && (
                <p className="game-instruction">
                  Game paused. The timer has stopped and cards are hidden.
                </p>
              )}
              {mode === "playing" && (
                <p className="game-instruction">
                  Choose two cards. Match the artwork to keep the pair.
                </p>
              )}
              {mode === "complete" && (
                <div className="game-complete">
                  <Trophy size={28} />
                  <h2>A perfect little break.</h2>
                  <p>
                    All six pairs in {moves} moves and {formatTime(seconds)}.
                  </p>
                  <button
                    type="button"
                    className="button primary"
                    onClick={start}
                  >
                    <RotateCcw size={17} />
                    Play again
                  </button>
                  <p className="field-hint">
                    Your result is saved on this device.
                  </p>
                </div>
              )}
            </>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {announcement}
          </div>
        </section>
        <aside className="game-aside">
          <div className="best-block">
            <Trophy size={23} />
            <h2>Your personal best</h2>
            {best ? (
              <>
                <strong className="best-number">{best.moves} moves</strong>
                <p>
                  {formatTime(best.seconds)} ·{" "}
                  {new Date(best.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </>
            ) : (
              <p>Finish your first game to set a score.</p>
            )}
            <span className="field-hint">Saved in this browser only</span>
          </div>
          <div className="game-rules">
            <h2>Just play.</h2>
            <p>
              Every round is free. No wallet, signatures, tokens, or gas
              required.
            </p>
            <p>
              Grove Match runs in your browser. It uses up to six loaded NFTs,
              with sample art filling any spaces.
            </p>
            <p>
              Unavailable NFT artwork uses distinct sample illustrations. Scores
              are personal, not on-chain. There are no prizes or token rewards.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
