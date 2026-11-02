import { useState, useEffect } from "react";
import {
  Heart,
  ArrowUpRight,
  ImageOff,
  Copy,
  Check,
  Shapes,
} from "lucide-react";
import type { Nft } from "../lib/data";
import { EXPLORER } from "../lib/network";
import { Modal } from "./Modal";

export function Artwork({
  nft,
  className = "",
  fallbackImage,
}: {
  nft: Nft;
  className?: string;
  fallbackImage?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [nft.image]);
  if ((!nft.image || failed) && fallbackImage)
    return (
      <img
        className={className}
        src={fallbackImage}
        alt={`${nft.name}, sample illustration fallback`}
      />
    );
  return !nft.image || failed ? (
    <div
      className={`artwork-fallback ${className}`}
      role="img"
      aria-label={`Artwork unavailable for ${nft.name}`}
    >
      <ImageOff size={32} />
      <span>Artwork unavailable</span>
    </div>
  ) : (
    <img
      className={className}
      src={nft.image}
      alt={nft.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function NftCard({
  nft,
  saved,
  onSave,
  onOpen,
  list = false,
}: {
  nft: Nft;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  list?: boolean;
}) {
  return (
    <article className={`nft-card ${list ? "nft-list-row" : ""}`}>
      <button
        className="art-button"
        type="button"
        onClick={onOpen}
        aria-label={`View ${nft.name}`}
      >
        <Artwork nft={nft} />
        {nft.sample && <span className="art-tag">Sample art</span>}
      </button>
      <div className="nft-card-info">
        <p className="collection-name">{nft.collection}</p>
        <button type="button" className="nft-name" onClick={onOpen}>
          {nft.name}
        </button>
      </div>
      <button
        className={`favorite-button ${saved ? "is-saved" : ""}`}
        type="button"
        aria-label={`${saved ? "Unsave" : "Save"} ${nft.name}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

export function NftDetails({
  nft,
  saved,
  onSave,
  onClose,
}: {
  nft: Nft;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  return (
    <Modal title={nft.name} wide onClose={onClose}>
      <div className="detail-grid">
        <Artwork nft={nft} className="detail-art" />
        <div className="detail-copy">
          <p className="detail-collection">
            <Shapes size={17} />
            {nft.collection}
          </p>
          <p className="muted">{nft.description}</p>
          <dl className="detail-data">
            <div>
              <dt>Network</dt>
              <dd>{nft.sample ? "Sample gallery" : "Robinhood Chain"}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{nft.sample ? "Original art · not minted" : nft.standard}</dd>
            </div>
            {nft.tokenId && (
              <div>
                <dt>Token ID</dt>
                <dd className="break-value">{nft.tokenId}</dd>
              </div>
            )}
            {nft.quantity && (
              <div>
                <dt>Quantity</dt>
                <dd>{nft.quantity}</dd>
              </div>
            )}
          </dl>
          {nft.contract && (
            <>
              <p className="field-label">Contract</p>
              <div className="address-block">
                <span>{nft.contract}</span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Copy contract address"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(nft.contract!);
                      setCopied(true);
                    } catch {
                      setCopyError("Select the contract address to copy it.");
                    }
                  }}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>
              <p className="field-hint" role="status">
                {copied ? "Contract address copied." : copyError}
              </p>
            </>
          )}
          {!!nft.attributes?.length && (
            <dl className="traits">
              {nft.attributes.map((a, i) => (
                <div key={i}>
                  <dt>{a.trait_type}</dt>
                  <dd>{a.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {nft.sample && (
            <p className="sample-note">
              An original Grove illustration for trying the dashboard. It is not
              an NFT in your wallet.
            </p>
          )}
          <div className="detail-actions">
            <button type="button" className="button primary" onClick={onSave}>
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? "Unsave artwork" : "Save artwork"}
            </button>
            {nft.contract && (
              <a
                className="button secondary"
                href={`${EXPLORER}/token/${nft.contract}/instance/${nft.tokenId}`}
                rel="noreferrer"
                target="_blank"
              >
                View on explorer
                <ArrowUpRight size={17} />
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
