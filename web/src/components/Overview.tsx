import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { agentRailAbi } from "../abi/agentRail";
import { ADDRESSES, EXPLORER, PROOFS, botTestnet } from "../config";
import { IconCheck, IconShield } from "../icons";

export function Overview() {
  const { data: perTx } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "perTxCap",
    chainId: botTestnet.id,
  });
  const { data: daily } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "dailyCap",
    chainId: botTestnet.id,
  });

  return (
    <section className="wrap overview">
      <article className="ov-card">
        <h3>Why AgentRail?</h3>
        <ul>
          <li>
            <IconCheck size={16} /> Agents can propose, not hold keys
          </li>
          <li>
            <IconCheck size={16} /> Policy lives on-chain, outside the model
          </li>
          <li>
            <IconCheck size={16} /> Blocked attacks emit Decision receipts
          </li>
          <li>
            <IconCheck size={16} /> A tx hash is not payment — verify balances
          </li>
        </ul>
      </article>

      <article className="ov-card">
        <h3>Live proofs</h3>
        <ul>
          {PROOFS.map((p) => (
            <li key={p.id}>
              <IconShield size={16} />
              <a href={`${EXPLORER}/tx/${p.hash}`} target="_blank" rel="noreferrer">
                {p.title} · {p.meta}
              </a>
            </li>
          ))}
          <li>
            <IconShield size={16} /> 13 tests passing
          </li>
        </ul>
      </article>

      <article className="ov-card caps">
        <h3>Policy limits (live)</h3>
        <div className="cap-row">
          <div>
            <span>Per-tx cap</span>
            <strong>{perTx !== undefined ? `${formatEther(perTx)} BOT` : "—"}</strong>
          </div>
          <div>
            <span>Daily cap (UTC)</span>
            <strong>{daily !== undefined ? `${formatEther(daily)} BOT` : "—"}</strong>
          </div>
        </div>
      </article>

      <article className="ov-card chain">
        <h3>Built for BOT Chain</h3>
        <ul>
          <li>EVM L1 · AI-native infrastructure</li>
          <li>RPC https://rpc.bohr.life</li>
          <li>Official explorer scan.bohr.life</li>
        </ul>
        <div className="sphere" aria-hidden>
          <span />
          <span />
          <p>BOT Chain AI-native L1</p>
        </div>
      </article>
    </section>
  );
}
