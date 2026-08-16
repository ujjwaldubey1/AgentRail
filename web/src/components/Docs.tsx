import { ADDRESSES, EXPLORER, GITHUB } from "../config";

const REASONS = [
  ["OK", "Intent passed. Vault will pay."],
  ["CAP", "Amount is above the per-tx cap."],
  ["DAILY", "Amount would exceed the UTC-day cap."],
  ["TARGET", "Recipient is not on the destination allowlist."],
  ["TOKEN", "Asset is not allowlisted."],
  ["REPLAY", "actionId is zero or already used."],
  ["PAUSED", "Owner paused the rail."],
  ["SELECTOR", "Calldata selector is not allowlisted."],
];

export function Docs() {
  return (
    <main className="docs wrap">
      <p className="eyebrow">Documentation</p>
      <h1>How AgentRail works</h1>
      <p className="lede">
        Simulate → Policy → Execute → Verify. Two keys. The agent never holds the treasury.
      </p>

      <section>
        <h2>Roles</h2>
        <div className="docs-grid">
          <article>
            <h3>Owner</h3>
            <p>Deposits BOT, sets caps and allowlists, pauses, withdraws, rotates the agent. This is the human or protocol key.</p>
          </article>
          <article>
            <h3>Agent</h3>
            <p>Gas only. May call <code>proposeAndExecute</code>. Cannot change policy or take the vault.</p>
          </article>
          <article>
            <h3>Visitor</h3>
            <p>Any other wallet. Can connect and read this public proof vault. Cannot spend it.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>Loop</h2>
        <ol className="docs-steps">
          <li>
            <strong>Read.</strong> Build a typed intent: payee, token, amount, deadline, actionId. No free-form model text.
          </li>
          <li>
            <strong>Simulate.</strong> <code>eth_call simulate(intent)</code> before you sign. The UI shows OK, CAP, TARGET, and the rest.
          </li>
          <li>
            <strong>Execute.</strong> Only the agent sends <code>proposeAndExecute</code>. Policy failure does not revert. It emits <code>Decision(allowed=false)</code>.
          </li>
          <li>
            <strong>Verify.</strong> Wait for inclusion. Open the explorer. Check logs and balances. A hash is not payment.
          </li>
        </ol>
      </section>

      <section>
        <h2>Policy reasons</h2>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {REASONS.map(([code, meaning]) => (
              <tr key={code}>
                <td>
                  <code>{code}</code>
                </td>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Network</h2>
        <table className="docs-table">
          <tbody>
            <tr>
              <th>Name</th>
              <td>BOT Chain Testnet</td>
            </tr>
            <tr>
              <th>RPC</th>
              <td>
                <code>https://rpc.bohr.life</code>
              </td>
            </tr>
            <tr>
              <th>Chain ID</th>
              <td>968</td>
            </tr>
            <tr>
              <th>Symbol</th>
              <td>BOT</td>
            </tr>
            <tr>
              <th>Explorer</th>
              <td>
                <a href={EXPLORER} target="_blank" rel="noreferrer">
                  scan.bohr.life
                </a>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="note">ChainList 968 is Datagram. Do not use it. Add BOT testnet with the RPC above.</p>
      </section>

      <section>
        <h2>Live vault</h2>
        <table className="docs-table">
          <tbody>
            <tr>
              <th>Vault</th>
              <td>
                <a href={`${EXPLORER}/address/${ADDRESSES.vault}`} target="_blank" rel="noreferrer">
                  {ADDRESSES.vault}
                </a>
              </td>
            </tr>
            <tr>
              <th>Payee</th>
              <td>{ADDRESSES.payee}</td>
            </tr>
            <tr>
              <th>Owner</th>
              <td>{ADDRESSES.owner}</td>
            </tr>
            <tr>
              <th>Agent</th>
              <td>{ADDRESSES.agent}</td>
            </tr>
          </tbody>
        </table>
        <p className="note">
          This site’s App panel is wired to that vault. Connecting any other wallet shows role Other.
          Source and SDK-bound code:{" "}
          <a href={GITHUB} target="_blank" rel="noreferrer">
            github.com/ujjwaldubey1/AgentRail
          </a>
          .
        </p>
      </section>
    </main>
  );
}
