import { EXPLORER, PROOFS } from "../config";
import { IconCheck, IconX } from "../icons";

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
            <div className={`stripe ${p.well}`} />
            <div className={`mark ${p.well}`}>
              {p.meta === "blocked" ? <IconX size={18} /> : <IconCheck size={18} />}
            </div>
            <h3>{p.title}</h3>
            <p className="meta">
              {p.meta}
              <span> · {p.subtitle}</span>
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
