import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Proofs } from "./components/Proofs";
import { AppPanel } from "./components/AppPanel";
import { ADDRESSES, EXPLORER, GITHUB, TWITTER } from "./config";
import { wagmiConfig } from "./wagmi";
import "./styles.css";

const queryClient = new QueryClient();

function How() {
  const steps = [
    ["Read", "Typed intent: payee, asset, amount, actionId. No free-form model text."],
    ["Simulate", "eth_call simulate() before signing. Catch CAP / TARGET / REPLAY."],
    ["Execute", "Agent calls proposeAndExecute. Treasury stays in the vault."],
    ["Verify", "Wait for inclusion. Inspect Decision logs and balances."],
  ] as const;
  return (
    <section className="wrap" id="how" style={{ paddingBottom: 24 }}>
      <div className="section-head">
        <h2>How it works</h2>
      </div>
      <div className="steps">
        {steps.map(([title, body], i) => (
          <article className="step" key={title}>
            <h3>
              {i + 1}. {title}
            </h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="wrap footer">
      <a className="visit" href={`${EXPLORER}/address/${ADDRESSES.vault}`} target="_blank" rel="noreferrer">
        View contract →
      </a>
      <div>
        Live on BOT Chain testnet 968. Agent never holds the treasury.
      </div>
      <div className="socials">
        <a href={TWITTER} target="_blank" rel="noreferrer">
          X
        </a>
        <a href={GITHUB} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="https://dev-docs.botchain.ai/docs/intro/" target="_blank" rel="noreferrer">
          Docs
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="dotgrid">
          <Nav />
          <Hero />
        </div>
        <div className="dotgrid-dark dark">
          <How />
          <Proofs />
          <AppPanel />
          <Footer />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
