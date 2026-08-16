import { useAccount, useConnect, useDisconnect } from "wagmi";
import { IconLogo, IconWallet } from "../icons";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const LINKS = [
  { href: "#home", label: "Home", id: "home" },
  { href: "#how", label: "How it works", id: "how" },
  { href: "#proofs", label: "Proofs", id: "proofs" },
  { href: "#app", label: "App", id: "app" },
  { href: "#docs", label: "Docs", id: "docs" },
] as const;

type NavProps = { page: "home" | "docs"; hash: string };

export function Nav({ page, hash }: NavProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];
  const section = hash.replace("#", "") || "home";

  return (
    <header className="wrap nav">
      <a className="brand" href="#home">
        <IconLogo />
        AgentRail
        <span className="chain-tag">BOT Chain</span>
      </a>
      <nav className="nav-links">
        {LINKS.map((link) => {
          const active =
            page === "docs"
              ? link.id === "docs"
              : link.id === "docs"
                ? false
                : section === link.id || (link.id === "home" && (section === "" || section === "home"));
          return (
            <a key={link.id} className={active ? "active" : undefined} href={link.href}>
              {link.label}
            </a>
          );
        })}
      </nav>
      {isConnected ? (
        <button className="btn-primary" onClick={() => disconnect()}>
          {short(address)}
        </button>
      ) : (
        <button
          className="btn-primary"
          disabled={isPending || !connector}
          onClick={() => connector && connect({ connector })}
        >
          <IconWallet />
          Connect Wallet
        </button>
      )}
    </header>
  );
}
