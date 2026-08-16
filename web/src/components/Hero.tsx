const STAGES = ["Read", "Simulate", "Execute", "Verify"];

export function Hero() {
  return (
    <section className="wrap hero" id="home">
      <p className="eyebrow">BOT Chain · testnet 968</p>
      <h1>Agents shouldn’t execute blindly</h1>
      <p>
        Control plane for autonomous spend. The agent proposes a typed intent. Policy
        sits on-chain. The treasury never leaves the vault.
      </p>
      <ol className="hero-rail" aria-label="Control plane stages">
        {STAGES.map((stage, i) => (
          <li key={stage} style={{ animationDelay: `${0.28 + i * 0.07}s` }}>
            <i className={`dot n${i}`} />
            <span>{String(i + 1).padStart(2, "0")}</span>
            {stage}
          </li>
        ))}
      </ol>
      <a className="pill" href="#app">
        Open the rail
      </a>
    </section>
  );
}
