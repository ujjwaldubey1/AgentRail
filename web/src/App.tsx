import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Proofs } from "./components/Proofs";
import { AppPanel } from "./components/AppPanel";
import { Docs } from "./components/Docs";
import { ADDRESSES, EXPLORER, GITHUB, TWITTER } from "./config";
import { wagmiConfig } from "./wagmi";
import "./styles.css";

const queryClient = new QueryClient();

function readHash() {
  return window.location.hash || "#home";
}

function How() {
  const steps = [
    ["Read", "Typed intent: payee, asset, amount, actionId. No free-form model text."],
    ["Simulate", "eth_call simulate() before signing. Catch CAP / TARGET / REPLAY."],
    ["Execute", "Agent calls proposeAndExecute. Treasury stays in the vault."],
    ["Verify", "Wait for inclusion. Inspect Decision logs and balances."],
  ] as const;
  return (
    <section className="wrap" id="how">
      <div className="section-head">
        <h2>How it works</h2>
      </div>
      <div className="steps">
        {steps.map(([title, body], i) => (
          <article className="step" key={title}>
            <span className="num">{String(i + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
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
        View contract
      </a>
      <div>Live on BOT Chain testnet 968. The agent never holds the treasury.</div>
      <div className="socials">
        <a href={TWITTER} target="_blank" rel="noreferrer">
          X
        </a>
        <a href={GITHUB} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="#docs">Docs</a>
      </div>
    </footer>
  );
}

function AppShell() {
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const onHash = () => setHash(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const page = hash.startsWith("#docs") ? "docs" : "home";

  useEffect(() => {
    if (page === "docs") window.scrollTo(0, 0);
  }, [page]);

  return (
    <>
      <div className="dotgrid">
        <Nav page={page} hash={hash} />
        {page === "home" ? <Hero /> : <Docs />}
      </div>
      {page === "home" ? (
        <div className="dotgrid-dark dark">
          <How />
          <Proofs />
          <AppPanel />
          <Footer />
        </div>
      ) : (
        <div className="docs-foot">
          <Footer />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
