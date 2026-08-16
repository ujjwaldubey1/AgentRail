import { IconBolt, IconCheck, IconSearch, IconShield, IconVerified } from "../icons";

const STEPS = [
  {
    n: "01",
    title: "Simulate",
    body: "Agent proposes a typed intent. Client simulates via eth_call.",
    status: "Ready",
    tone: "purple",
    Icon: IconSearch,
  },
  {
    n: "02",
    title: "Policy",
    body: "On-chain policy checks caps, allowlists, selectors and more.",
    status: "OK",
    tone: "green",
    Icon: IconShield,
  },
  {
    n: "03",
    title: "Execute",
    body: "Only the agent can call proposeAndExecute. Funds move if allowed.",
    status: "Pending",
    tone: "orange",
    Icon: IconBolt,
  },
  {
    n: "04",
    title: "Verify",
    body: "Verify events, receipts and balances. Every decision is on-chain.",
    status: "Verified",
    tone: "blue",
    Icon: IconVerified,
  },
] as const;

export function How() {
  return (
    <section className="wrap how" id="how">
      <div className="flow">
        {STEPS.map((s, i) => (
          <article className="flow-card" key={s.title}>
            {i > 0 ? <span className="dash" aria-hidden /> : null}
            <span className="num">{s.n}</span>
            <s.Icon className={`ico ${s.tone}`} />
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className={`st ${s.tone}`}>
              {s.tone === "green" || s.tone === "purple" || s.tone === "blue" ? <IconCheck size={14} /> : null}
              {s.status}
            </div>
          </article>
        ))}
      </div>
      <p className="flow-foot">
        Every decision is <strong>provable</strong>. Every refusal is <strong>permanent</strong>.
      </p>
    </section>
  );
}
