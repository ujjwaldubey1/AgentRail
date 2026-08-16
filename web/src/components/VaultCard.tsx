import { useState } from "react";
import { useBalance, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { agentRailAbi } from "../abi/agentRail";
import { ADDRESSES, EXPLORER, botTestnet } from "../config";
import { IconCopy, IconArrow } from "../icons";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function VaultCard() {
  const [copied, setCopied] = useState(false);
  const { data: vaultBal } = useBalance({ address: ADDRESSES.vault, chainId: botTestnet.id });
  const { data: version } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "policyVersion",
    chainId: botTestnet.id,
  });
  const { data: paused } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "paused",
    chainId: botTestnet.id,
  });

  async function copy() {
    await navigator.clipboard.writeText(ADDRESSES.vault).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const bot = vaultBal ? Number(formatEther(vaultBal.value)).toFixed(4) : "—";

  return (
    <aside className="vault-card">
      <div className="vault-head">
        <h2>Vault Overview</h2>
        <span className={`live-pill ${paused ? "off" : ""}`}>
          <i />
          {paused ? "Paused" : "Live"}
        </span>
      </div>
      <p className="vault-bal">
        {bot} <small>BOT</small>
      </p>
      <dl>
        <div>
          <dt>Chain</dt>
          <dd>BOT Chain Testnet (ID 968)</dd>
        </div>
        <div>
          <dt>Vault</dt>
          <dd>
            {short(ADDRESSES.vault)}
            <button type="button" className="icon-btn" onClick={() => void copy()} aria-label="Copy vault address">
              <IconCopy />
            </button>
            {copied ? <span className="copied">copied</span> : null}
          </dd>
        </div>
        <div>
          <dt>Policy version</dt>
          <dd>{version !== undefined ? String(version) : "—"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`status-pill ${paused ? "off" : ""}`}>{paused ? "Paused" : "Active"}</span>
          </dd>
        </div>
      </dl>
      <a className="text-link" href={`${EXPLORER}/address/${ADDRESSES.vault}`} target="_blank" rel="noreferrer">
        View full details <IconArrow size={14} />
      </a>
    </aside>
  );
}
