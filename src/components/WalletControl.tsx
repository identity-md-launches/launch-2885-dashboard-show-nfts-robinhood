import { useEffect, useState } from "react";
import {
  useConnection,
  useConnect,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import {
  Wallet,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { Modal } from "./Modal";
import { chain, EXPLORER } from "../lib/network";
import { shortAddress } from "../lib/data";

const OPEN_IN = [
  {
    id: "metamask",
    name: "MetaMask",
    href: (url: string) =>
      `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, "")}`,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    href: (url: string) =>
      `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
  },
  {
    id: "rabby",
    name: "Rabby",
    href: (url: string) =>
      `https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=${encodeURIComponent(url)}`,
  },
  {
    id: "phantom",
    name: "Phantom",
    href: (url: string) =>
      `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}`,
  },
];

export function WalletControl() {
  const { address, isConnected, chainId } = useConnection();
  const { connectors, connect, isPending, variables, error, reset } =
    useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
  } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    !connectors.some((c) => c.type === "injected" && c.id !== "injected");
  const named = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  const listed = [
    ...connectors.filter((c) => c.type === "injected"),
    ...connectors.filter((c) => c.type !== "injected"),
  ].filter((c) => !(c.id === "injected" && named));
  const label = (c: Connector) =>
    c.id === "injected"
      ? "Browser wallet"
      : c.id === "coinbaseWalletSDK"
        ? mobile
          ? "Coinbase Smart Wallet"
          : "Coinbase Wallet"
        : c.name;
  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);
  const wrongChain = isConnected && chainId !== chain.id;
  return (
    <>
      <button
        className={`wallet-button ${isConnected ? "is-connected" : ""}`}
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        aria-haspopup="dialog"
      >
        <Wallet size={17} />
        <span>
          {wrongChain
            ? "Switch to Robinhood Chain"
            : address
              ? shortAddress(address)
              : "Connect wallet"}
        </span>
        {isConnected && <ChevronDown size={15} />}
      </button>
      {open && (
        <Modal
          title={isConnected ? "Your wallet" : "Connect a wallet"}
          onClose={() => setOpen(false)}
        >
          {address && isConnected ? (
            <>
              <p className="modal-description">
                Connected for read-only access. Grove never asks you to sign or
                spend.
              </p>
              <div className="address-block">
                <span>{address}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Copy wallet address"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(address);
                      setCopied(true);
                    } catch {
                      setCopyError(
                        "Copy is unavailable. Select the address above to copy it.",
                      );
                    }
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p role="status" className="field-hint">
                {copied ? "Address copied." : copyError}
              </p>
              <div className="wallet-rows">
                {wrongChain && (
                  <button
                    className="wallet-row"
                    type="button"
                    disabled={isSwitching}
                    onClick={() => switchChain({ chainId: chain.id })}
                  >
                    <Globe size={24} />
                    <span>
                      {isSwitching
                        ? "Switching network…"
                        : "Switch to Robinhood Chain"}
                    </span>
                  </button>
                )}
                <a
                  className="wallet-row"
                  href={`${EXPLORER}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={24} />
                  <span>View wallet on explorer</span>
                  <ArrowUpRight size={18} />
                </a>
                <button
                  className="wallet-row"
                  type="button"
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                >
                  <LogOut size={24} />
                  <span>Disconnect</span>
                </button>
              </div>
              {switchError && (
                <p role="status" className="inline-error">
                  Network switch was declined or unavailable. Retry, or add
                  chain 4663 in your wallet settings.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="modal-description">
                Find your NFTs on Robinhood Chain. No signature needed.
              </p>
              <div className="wallet-rows">
                {mobile &&
                  OPEN_IN.map((w) => (
                    <a
                      key={w.id}
                      className="wallet-row"
                      href={w.href(location.href)}
                    >
                      <img
                        src={`./wallets/${w.id}.svg`}
                        alt=""
                        width={28}
                        height={28}
                      />
                      <span>Open in {w.name}</span>
                      <ArrowUpRight size={18} />
                    </a>
                  ))}
                {listed
                  .filter((c) => !mobile || c.type !== "injected")
                  .map((c) => (
                    <button
                      key={c.uid}
                      className="wallet-row"
                      type="button"
                      onClick={() => connect({ connector: c })}
                      disabled={isPending}
                    >
                      {c.icon ? (
                        <img src={c.icon} alt="" width={28} height={28} />
                      ) : c.id === "coinbaseWalletSDK" ? (
                        <img
                          src="./wallets/coinbase.svg"
                          alt=""
                          width={28}
                          height={28}
                        />
                      ) : (
                        <Wallet size={28} />
                      )}
                      <span>
                        {label(c)}
                        {isPending && variables?.connector === c
                          ? " · opening…"
                          : ""}
                      </span>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
              </div>
              <div className="wallet-feedback" role="status">
                {error
                  ? "Connection was declined or the wallet is unavailable. Choose a wallet to try again."
                  : "You can also paste an address to explore without connecting."}
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
