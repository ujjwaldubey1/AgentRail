import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { How } from "./components/How";
import { Overview } from "./components/Overview";
import { Proofs } from "./components/Proofs";
import { AppPanel } from "./components/AppPanel";
import { Docs } from "./components/Docs";
import { CONTACT_EMAIL, GITHUB, TWITTER } from "./config";
import { wagmiConfig } from "./wagmi";
import "./styles.css";

const queryClient = new QueryClient();

function readHash() {
  return window.location.hash || "#home";
}

function Footer() {
  return (
    <footer className="wrap footer">
      <div>Version 1.0 · 16 August 2026 · Public testnet live</div>
      <div className="socials">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
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
    <div className="site">
      <Nav page={page} hash={hash} />
      {page === "home" ? (
        <>
          <Hero />
          <How />
          <Overview />
          <Proofs />
          <AppPanel />
        </>
      ) : (
        <Docs />
      )}
      <Footer />
    </div>
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
