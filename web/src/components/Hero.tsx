import { ADDRESSES, EXPLORER } from "../config";
import { IconArrow, IconExternal } from "../icons";
import { VaultCard } from "./VaultCard";

export function Hero() {
  return (
    <section className="wrap hero" id="home">
      <div className="hero-copy">
        <p className="live-badge">
          <i />
          Live on BOT Chain testnet 968
        </p>
        <h1>
          Agents shouldn’t execute <span>blindly</span>.
        </h1>
        <p className="lede">
          A Simulate → Policy → Execute → Verify control plane for AI agents on BOT Chain. The agent
          never holds the treasury.
        </p>
        <div className="hero-actions">
          <a className="btn-primary" href="#app">
            Launch dApp <IconArrow />
          </a>
          <a className="btn-ghost" href={`${EXPLORER}/address/${ADDRESSES.vault}`} target="_blank" rel="noreferrer">
            View on Explorer <IconExternal />
          </a>
        </div>
      </div>

      <div className="hero-art" aria-hidden>
        <div className="orbit" />
        <div className="orbit o2" />
        <div className="cube">
          <span className="face ft" />
          <span className="face rt" />
          <span className="face tp" />
        </div>
      </div>

      <VaultCard />
    </section>
  );
}
