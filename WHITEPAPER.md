# AgentRail

**A Simulate → Policy → Execute → Verify control plane for AI agents on BOT Chain**

Version 1.0 · 16 August 2026 · Public testnet live  
**Applicant:** Ujjwal Dubey  
**Email:** ujjwal07dubey@gmail.com · **X:** [x.com/ujjwal07dubey](https://x.com/ujjwal07dubey)  
**GitHub:** [github.com/ujjwaldubey1/AgentRail](https://github.com/ujjwaldubey1/AgentRail)

---

## Abstract

BOT Chain is an AI-native EVM L1. Language models can already *propose* payments. They must not *hold* an unrestricted treasury key. Prompt injection, hallucinated calldata, or a runaway loop will drain a normal EOA.

**AgentRail** is a BOT-native control plane for that gap. Funds sit in a vault. Two keys, never the same address: an **owner** who sets policy, and an **agent** who may only call `proposeAndExecute`. Clients `eth_call` `simulate(intent)` before they sign. If policy fails, execution **does not revert**. It emits `Decision(allowed=false, reason)` and returns false, so blocked attacks are permanent on-chain receipts. After inclusion, the client verifies logs and balances. A transaction hash is not payment.

AgentRail is live on BOT Chain Testnet (chain ID **968**). The vault, three first-class attack demos, and a public dApp already exist. This paper is the whitepaper / pitch for the BOT Chain Ecosystem Support Program. We are not launching a token. We are asking for milestone-based support so other BOT applications can run agents without handing them the treasury.

---

## 1. One-line pitch

**Agents should not execute blindly. AgentRail is the rail they execute on.**

| | |
|---|---|
| Category | AI agent infrastructure / permissioned payments |
| Chain | BOT Chain Testnet, ID 968 |
| Native asset | BOT (vault + gas) |
| Status | Live contracts + dApp + on-chain proofs |
| Ask | Milestone grant + BOT Labs technical matching (paymaster, explorer, listing) |

---

## 2. Problem

BOT Labs’ published agent-payment checklist is correct:

1. Typed intent, never free-form model output.
2. Simulate before send.
3. Deterministic policy *outside* the model.
4. Execute only if policy passes.
5. Verify receipt, events, and balances.
6. Record every decision, including refusals.

The L1 already ships EVM, RPC, explorer, and an EOA paymaster spec. It does **not** yet ship a complete Simulate → Execute → Verify product with versioned policy and refusal receipts.

If a team puts BOT in an agent’s EOA:

- A prompt-injected “pay this new address” succeeds.
- A hallucinated amount of 1000 BOT succeeds if the key has it.
- A failed or reverted tx is easy to hide; there is often no durable “we said no” record.

That is not an agent architecture. It is a hot wallet with extra steps.

---

## 3. Solution

### 3.1 Split keys

| Role | Holds | Can do |
|---|---|---|
| **Owner** | Treasury policy | Deposit, withdraw, pause, set caps / allowlists, rotate agent |
| **Agent** | Gas only | Call `proposeAndExecute(Intent)` |
| **Visitor** | Own wallet | Read vault and proofs; cannot spend someone else’s vault |

Owner and agent **cannot** be the same address. The treasury is the contract. Compromising the agent key cannot empty the vault past policy.

### 3.2 Typed intent

```text
Intent {
  to, token,      // token = address(0) means native BOT
  amount,
  data,           // optional calldata; selector must be allowlisted
  deadline,
  actionId        // replay lock
}
```

The model proposes this struct. It does not craft raw transactions against the treasury.

### 3.3 The four-stage loop

**Read → Simulate → Execute → Verify**

1. **Read.** Build a typed `Intent` (payee, asset, amount, `actionId`).
2. **Simulate.** `eth_call` `simulate(intent)`. Reason codes: `OK`, `CAP`, `TARGET`, `TOKEN`, `DAILY`, `REPLAY`, `PAUSED`, `EXPIRED`, `DEADLINE`, `SELECTOR`, `CALL_FAIL`.
3. **Execute.** Only the agent may call `proposeAndExecute`. Policy failure emits `Decision` and returns `false`. Unauthorized non-agent callers still revert.
4. **Verify.** Wait for inclusion. Inspect `Decision` logs, vault balance, and payee balance.

### 3.4 Why refusals do not revert

A revert is easy to ignore. An included tx with `allowed=false` and reason `TARGET` or `CAP` is an audit trail. Grant reviewers and future operators can prove the rail *blocked* an attack, not only that a payment succeeded.

---

## 4. Policy engine (v1)

All checks run on-chain in `_checkPolicy`. The owner versions policy via `setPolicy` (`policyVersion` increments).

| Check | Failure reason |
|---|---|
| Vault paused | `PAUSED` |
| Policy expiry | `EXPIRED` |
| Intent deadline | `DEADLINE` |
| Zero or reused `actionId` | `REPLAY` |
| Token not allowlisted (`address(0)` = native BOT) | `TOKEN` |
| Destination not allowlisted | `TARGET` |
| Calldata present but selector not allowlisted | `SELECTOR` |
| Amount zero or above per-tx cap | `CAP` |
| Amount above remaining UTC-day cap | `DAILY` |
| External call failed after a pass | `CALL_FAIL` |

Live demo policy: **0.5 BOT** per tx, **2.0 BOT** per UTC day, native BOT allowed, one payee allowlisted.

---

## 5. How a new user interacts

The live dApp is a **public proof vault**. A stranger who connects MetaMask is a **visitor** (role **Other**). They can see balance, caps, and explorer proofs. They cannot click Allow / Cap / Inject on *this* vault. That is intentional.

A real user is someone who wants an AI or bot to spend BOT **without giving it the treasury key**.

**Owner (human / protocol)**

1. Creates two keys (owner + agent).
2. Deploys `AgentRail(owner, agent)` and sets policy.
3. Deposits BOT into the vault (native `receive`, same pattern as “Send 0.2 BOT”).
4. Hands the agent address — not the owner key — to the bot.

**Agent (session key / model)**

1. Proposes an intent.
2. Simulates.
3. If `OK`, executes; vault pays the allowlisted payee.
4. If `CAP` / `TARGET` / …, the tx still lands. No BOT moves. The refusal is public.

There is no app login, no AgentRail backend, and no database. The browser talks to MetaMask and `https://rpc.bohr.life`. The contract is the backend.

---

## 6. Architecture

```text
MetaMask / agent signer
        │
        ▼
   AgentRail dApp (Vite + wagmi + viem)
        │  eth_call simulate
        │  proposeAndExecute if agent
        │  native send if owner
        ▼
   AgentRail vault  ── native BOT / ERC-20
        │
        ▼
   scan.bohr.life   Decision logs, balances
```

Stack: Solidity 0.8.24 (Foundry), 13 passing tests (caps, allowlist, pause, replay, ERC-20, call-fail). Frontend: Vite, React, TypeScript, wagmi v2. No Next.js, no Node API.

---

## 7. Live deployment (BOT testnet 968)

| | Address / URL |
|---|---|
| Vault | [`0x254AceA1E7411EA396a6a8802316206cFfB14171`](https://scan.bohr.life/address/0x254AceA1E7411EA396a6a8802316206cFfB14171) |
| Allowlisted payee | [`0x8bf5319Db9cD308D52bA8f4a6c04267FfaA08049`](https://scan.bohr.life/address/0x8bf5319Db9cD308D52bA8f4a6c04267FfaA08049) |
| Owner | [`0x184E46634F2E21d88365ffC2bF58a83e315f3c8c`](https://scan.bohr.life/address/0x184E46634F2E21d88365ffC2bF58a83e315f3c8c) |
| Agent (gas only) | [`0xb0Bb213DC381287c6A0D0A279ac9Cf423e7A340e`](https://scan.bohr.life/address/0xb0Bb213DC381287c6A0D0A279ac9Cf423e7A340e) |
| Create tx | [`0xf3829f786a54ade7bb54951561dad7501ad79995849f944b91a6e3286745f8aa`](https://scan.bohr.life/tx/0xf3829f786a54ade7bb54951561dad7501ad79995849f944b91a6e3286745f8aa) |
| RPC | `https://rpc.bohr.life` |
| Explorer | https://scan.bohr.life |
| Repo | https://github.com/ujjwaldubey1/AgentRail |

### Canonical proofs (first broadcast)

| Demo | Simulate | Result | Tx |
|---|---|---|---|
| Allow 0.1 BOT to payee | `OK` | Vault 2.0 → 1.9 BOT | [0xbd15aefe…](https://scan.bohr.life/tx/0xbd15aefe5b7d22061ed6e210e7465a33a483ac5ad93f9ba0414e7e2df1edb374) |
| Cap drain 1000 BOT | `CAP` | Vault unchanged | [0x377f1766…](https://scan.bohr.life/tx/0x377f176631987a2b35944eef1634079f61a0454074c8983a2af1213b5cb72a4e) |
| Inject unknown recipient | `TARGET` | Vault unchanged | [0x4ade5df4…](https://scan.bohr.life/tx/0x4ade5df4c51666db856d10e27b939e24505990a35ca1d144a409ec5e76e4ff28) |

### Independent UI replay (16 August 2026)

Same vault, public dApp, MetaMask:

| Step | Tx |
|---|---|
| Owner deposit 0.2 BOT | [0x5ce5e694…](https://scan.bohr.life/tx/0x5ce5e69481edeb453d97cc9eb11212817440781474f2393f27c4b61ae7e755a3) |
| Agent Allow 0.1 | [0x0d8289a8…](https://scan.bohr.life/tx/0x0d8289a895babe5b91bb7c48bc8f4927778324c11c6ee95b7763a3c85467f6a7) |
| Agent Cap drain (blocked) | [0x0a75e727…](https://scan.bohr.life/tx/0x0a75e7272636f2e35c28e51942f957ba6be734e5d0774c8818a448c32d1f98a3) |
| Agent Inject (blocked `TARGET`) | [0x435ca100…](https://scan.bohr.life/tx/0x435ca100f27ce261569f84e152a81a287ab119a68ac5116faba104accfe95987) |

Explorer **Success** on Cap and Inject is correct: the transaction included, the payment did not.

---

## 8. Why BOT Chain

- Native tBOT in the vault; BOT gas on every agent action.
- Official testnet RPC and explorer, not a fork-only demo.
- Aligns with BOT Chain themes: agent wallets, permission controls, autonomous protection, verifiable payments.
- Next integrations the L1 already documents: [EOA paymaster](https://dev-docs.botchain.ai/docs/Developers/eoa-paymaster/) (gas sponsorship so the agent can be empty), B DEX as an allowlisted router, CaryPact job settlement receipts.

**Differentiation.** Spend-limit vaults already exist. AgentRail adds pre-flight `simulate`, **no-revert blocked receipts**, and a mandatory verify step. That is the control plane BOT’s research describes, not another DEX or consumer wallet.

A zero-inflation chain earns fees when *other* applications run safely. AgentRail is infrastructure for those applications.

---

## 9. What exists vs what the grant funds

**Now (testnet)**

- `AgentRail.sol` + tests
- Deployed vault and payee
- Live dApp: connect, switch to 968, owner deposit, agent Allow / Cap / Inject
- Public GitHub under [ujjwaldubey1](https://github.com/ujjwaldubey1/AgentRail)

**Not yet (grant milestones)**

- Factory / “create my vault” for new owners
- TypeScript SDK (`simulate` / `execute` / `verify`)
- Paymaster-sponsored agent gas
- Session-key rotation UX
- Allowlisted B DEX swap demo
- Mainnet + identity stub (`agentId` → owner → session key)

---

## 10. 90-day milestones

| Days | Deliverable | On-chain metric |
|---|---|---|
| 0–30 | SDK, public create-vault / policy UI, documented policy reasons | ≥50 agent `Decision` events; ≥10 unique blocked attacks |
| 31–60 | EOA paymaster path; session-key rotation; B DEX allowlisted swap | ≥200 sponsored or native agent txs |
| 61–90 | Mainnet after review; agent identity stub; grant report | Mainnet vault + public docs; BOT gas attributable to AgentRail |

We will fit BOT Labs’ weekly / monthly settlement KPIs if required.

---

## 11. Ask

- Milestone-based ecosystem grant for engineering, audit, and testnet / mainnet gas.
- A BOT Labs account manager for paymaster, explorer, and wallet listing.
- Ecosystem certification and DApp portal placement when mainnet is ready.

We are **not** asking for a token launch, market-making, or CEX listing. Success is other teams settling agent payments through AgentRail so BOT fee flow rises without new inflation.

---

## 12. Risks and limits (honest)

- **v1 policy is allowlist + caps**, not a full programming language. Complex jobs need more selectors and routers.
- **The public dApp operates one demo vault.** New users cannot spend it; they need their own deploy until the factory ships.
- **Testnet only.** Mainnet requires review.
- **Agent still needs gas** until paymaster integration.
- **The model can still propose garbage.** The rail’s job is to refuse it on-chain, not to make the model honest.

---

## 13. Team and contact

**Ujjwal Dubey** — applicant and maintainer.

- GitHub: https://github.com/ujjwaldubey1  
- Repo: https://github.com/ujjwaldubey1/AgentRail  
- Email: ujjwal07dubey@gmail.com  
- X: https://x.com/ujjwal07dubey  

Primary wallet for grant correspondence (owner EOA, not the contract):  
`0x184E46634F2E21d88365ffC2bF58a83e315f3c8c`

---

## Appendix A — Network

| Field | Value |
|---|---|
| Network name | BOT Chain Testnet |
| RPC | `https://rpc.bohr.life` |
| Chain ID | 968 |
| Symbol | BOT |
| Explorer | https://scan.bohr.life |
| Faucet | https://faucet.botchain.ai/en/basic |

Do not use ChainList’s chain 968 (Datagram). That is a different network.

## Appendix B — Interface (agent path)

```solidity
function simulate(Intent calldata intent)
    external view returns (bool allowed, bytes32 reason);

function proposeAndExecute(Intent calldata intent)
    external returns (bool allowed);
```

Non-agent `proposeAndExecute` reverts `Unauthorized()`. Failed policy does not.

---

*AgentRail v1.0. Attach this file to the BOT Chain Ecosystem Support Program form or email ecosystem@BOTChain.info.*
