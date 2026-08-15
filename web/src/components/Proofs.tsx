import { EXPLORER, PROOFS } from "../config";

export function Proofs() {
  return (
    <section className="wrap" id="proofs">
      <div className="section-head">
        <h2>Live testnet proofs</h2>
        <span className="chip">BOT 968</span>
      </div>
      <div className="cards">
        {PROOFS.map((p) => (
          <a
            key={p.id}
            className="card"
            href={`${EXPLORER}/tx/${p.hash}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className={`well ${p.well}`}>{p.meta === "blocked" ? "×" : "✓"}</div>
            <h3>{p.title}</h3>
            <div className="meta">
              ♦ {p.meta} · {p.subtitle}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
