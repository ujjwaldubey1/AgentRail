import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther, getAddress, keccak256, parseEther, stringToHex, zeroAddress } from "viem";
import { agentRailAbi } from "../abi/agentRail";
import { ADDRESSES, EXPLORER, botTestnet } from "../config";

type Kind = "allow" | "cap" | "inject";

function decodeReason(value?: `0x${string}`) {
  if (!value) return "";
  const hex = value.slice(2);
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = Number.parseInt(hex.slice(i, i + 2), 16);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out || value;
}

function buildIntent(kind: Kind) {
  const to = getAddress(kind === "inject" ? ADDRESSES.injectTarget : ADDRESSES.payee);
  const amount = kind === "cap" ? parseEther("1000") : parseEther("0.1");
  return {
    to,
    token: zeroAddress,
    amount,
    data: "0x" as const,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
    actionId: keccak256(stringToHex(`${kind}:${Date.now()}`)),
  };
}

export function AppPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: vaultBal, refetch: refetchVault } = useBalance({
    address: ADDRESSES.vault,
    chainId: botTestnet.id,
  });
  const { data: dailyCap, refetch: refetchCap } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "remainingDailyCap",
    chainId: botTestnet.id,
  });
  const { data: perTx } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "perTxCap",
    chainId: botTestnet.id,
  });
  const { data: onchainOwner } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "owner",
    chainId: botTestnet.id,
  });
  const { data: onchainAgent } = useReadContract({
    address: ADDRESSES.vault,
    abi: agentRailAbi,
    functionName: "agent",
    chainId: botTestnet.id,
  });

  const role = useMemo(() => {
    if (!address) return "Disconnected";
    if (onchainOwner && address.toLowerCase() === onchainOwner.toLowerCase()) return "Owner";
    if (onchainAgent && address.toLowerCase() === onchainAgent.toLowerCase()) return "Agent";
    return "Other";
  }, [address, onchainAgent, onchainOwner]);

  const wrongChain = isConnected && chainId !== botTestnet.id;
  const { writeContractAsync, isPending: writing } = useWriteContract();
  const { sendTransactionAsync, isPending: sending } = useSendTransaction();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [sim, setSim] = useState<{ allowed: boolean; reason: string } | null>(null);
  const [status, setStatus] = useState(
    "Connect MetaMask. Owner deposits. Agent runs Simulate → Execute → Verify.",
  );
  const [tone, setTone] = useState<"ok" | "bad" | "">("");

  async function deposit() {
    try {
      setTone("");
      const tx = await sendTransactionAsync({
        to: ADDRESSES.vault,
        value: parseEther("0.2"),
      });
      setHash(tx);
      setStatus("Deposit submitted. Verifying inclusion…");
    } catch (e) {
      setTone("bad");
      setStatus(e instanceof Error ? e.message : "Deposit failed");
    }
  }

  async function execute(kind: Kind) {
    try {
      setTone("");
      const intent = buildIntent(kind);
      setStatus(`Read ${kind}. Simulating…`);
      if (!publicClient) throw new Error("No RPC client");
      const [allowed, reason] = await publicClient.readContract({
        address: ADDRESSES.vault,
        abi: agentRailAbi,
        functionName: "simulate",
        args: [intent],
      });
      const label = decodeReason(reason);
      setSim({ allowed, reason: label });
      setStatus(`Simulate ${label}. Executing…`);
      const tx = await writeContractAsync({
        address: ADDRESSES.vault,
        abi: agentRailAbi,
        functionName: "proposeAndExecute",
        args: [intent],
      });
      setHash(tx);
      setTone(allowed ? "ok" : "bad");
      setStatus(`Executed. simulate=${label}. Waiting for receipt…`);
    } catch (e) {
      setTone("bad");
      setStatus(e instanceof Error ? e.message : "Execute failed");
    }
  }

  useEffect(() => {
    if (!isSuccess) return;
    void refetchVault();
    void refetchCap();
  }, [isSuccess, refetchCap, refetchVault]);

  return (
    <section className="wrap" id="app">
      <div className="app-panel">
        <h2>App</h2>
        <p className="panel-lead">
          Simulate → Execute → Verify on BOT testnet. Policy failures stay on-chain.
        </p>

        {wrongChain ? (
          <p className="warn">
            Wrong network.{" "}
            <button className="btn-primary" disabled={switching} onClick={() => switchChain({ chainId: botTestnet.id })}>
              Switch to BOT 968
            </button>
          </p>
        ) : null}

        {role === "Other" ? (
          <p className="warn">
            Connected as other. Switch MetaMask to the agent account to execute, or owner to deposit.
          </p>
        ) : null}

        <div className="stats">
          <div className="stat">
            <span>Role</span>
            <strong>{role}</strong>
          </div>
          <div className="stat">
            <span>Vault</span>
            <strong>{vaultBal ? `${Number(formatEther(vaultBal.value)).toFixed(3)} BOT` : "—"}</strong>
          </div>
          <div className="stat">
            <span>Per-tx cap</span>
            <strong>{perTx ? `${formatEther(perTx)} BOT` : "—"}</strong>
          </div>
          <div className="stat">
            <span>Daily remaining</span>
            <strong>{dailyCap !== undefined ? `${formatEther(dailyCap)} BOT` : "—"}</strong>
          </div>
        </div>

        <div className="actions">
          {role === "Owner" ? (
            <button className="btn-primary" disabled={sending || waiting} onClick={() => void deposit()}>
              Send 0.2 BOT to vault
            </button>
          ) : null}
          <button
            className="btn-primary"
            disabled={writing || waiting || role !== "Agent"}
            onClick={() => void execute("allow")}
          >
            Allow 0.1
          </button>
          <button
            className="btn-ghost"
            disabled={writing || waiting || role !== "Agent"}
            onClick={() => void execute("cap")}
          >
            Cap drain
          </button>
          <button
            className="btn-ghost"
            disabled={writing || waiting || role !== "Agent"}
            onClick={() => void execute("inject")}
          >
            Inject recipient
          </button>
        </div>

        <div className={`log ${tone}`}>
          {status}
          {sim ? (
            <div>
              Simulate: {sim.allowed ? "OK" : sim.reason}
            </div>
          ) : null}
          {hash ? (
            <div>
              Verify{" "}
              <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">
                {hash.slice(0, 10)}…
              </a>
              {waiting ? " (pending)" : isSuccess ? " (confirmed)" : ""}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
