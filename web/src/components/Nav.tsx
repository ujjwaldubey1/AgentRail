import { useAccount, useConnect, useDisconnect } from "wagmi";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Nav() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  return (
    <header className="wrap nav">
      <a className="brand" href="#home">
        <span className="logo" />
        AgentRail
      </a>
      <nav className="nav-links">
        <a className="active" href="#home">
          Home
        </a>
        <a href="#how">How it works</a>
        <a href="#proofs">Proofs</a>
        <a href="#app">App</a>
      </nav>
      {isConnected ? (
        <button className="pill" onClick={() => disconnect()}>
          {short(address)}
        </button>
      ) : (
        <button
          className="pill"
          disabled={isPending || !connector}
          onClick={() => connector && connect({ connector })}
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}
