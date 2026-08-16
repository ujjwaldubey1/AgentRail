# AgentRail — BOT Chain Ecosystem Grant Application

**Applicant:** Ujjwal Dubey  
**GitHub:** [ujjwaldubey1](https://github.com/ujjwaldubey1) · **Repo:** [AgentRail](https://github.com/ujjwaldubey1/AgentRail)  
**Email:** ujjwal07dubey@gmail.com  
**X:** [x.com/ujjwal07dubey](https://x.com/ujjwal07dubey)  
**Project:** AgentRail  
**Track:** AI agents / infrastructure  
**Network:** BOT Chain Testnet (chain ID 968)  
**Status:** Live contracts + on-chain attack demos  
**Ask:** Milestone-based ecosystem grant + BOT Labs technical matching  

One line: **AI agents should not execute blindly. AgentRail is a BOT-native control plane: Simulate → Policy → Execute → Verify. The agent never holds the treasury.**

---

## Problem

BOT Chain positions itself as an AI-native L1. Public research from the team is clear: a language model can *propose* a payment, but it must not move value by itself. A normal EOA key is not an agent architecture. Prompt injection, hallucinated calldata, or a runaway loop can drain it.

Their own checklist (Research Series + [payments article](https://medium.com/@BOTChain_ai/how-ai-agents-make-blockchain-payments-wallets-permissions-and-gas-sponsorship-3592410fb8cd)):

1. Typed intent, never free-form model output  
2. Simulate before send  
3. Deterministic policy *outside* the model  
4. Execute only if policy passes  
5. Verify receipt, events, and balances — a tx hash is not payment  
6. Record every decision, including refusals  

The L1 exposes EVM, RPC, explorer, and an EOA paymaster spec. It does not yet ship an agent wallet, versioned permission engine, or a complete Simulate → Execute → Verify product. That is the gap AgentRail fills.

---

## Solution

Funds sit in `AgentRail`. Two keys, never the same address:

| Role | Can |
|---|---|
| **Owner** | Set policy, pause, withdraw, rotate agent |
| **Agent** | Call `proposeAndExecute` only |

`simulate(intent)` is eth_call’d before broadcast. If policy fails, `proposeAndExecute` **does not revert**. It emits `Decision(allowed=false, reason)` and returns false, so blocked attacks are permanent on-chain receipts.

Policy (v1): destination allowlist, token allowlist, optional selector allowlist, per-tx cap, UTC-day cap, expiry, pause, `actionId` replay lock.

Loop: **Read → Simulate → Execute → Verify** (BOT Chain’s words).

---

## Live proof (testnet 968)

Do not take our word for it. These txs are already on [scan.bohr.life](https://scan.bohr.life).

| | Address |
|---|---|
| AgentRail vault | [`0x254AceA1E7411EA396a6a8802316206cFfB14171`](https://scan.bohr.life/address/0x254AceA1E7411EA396a6a8802316206cFfB14171) |
| Allowlisted payee | [`0x8bf5319Db9cD308D52bA8f4a6c04267FfaA08049`](https://scan.bohr.life/address/0x8bf5319Db9cD308D52bA8f4a6c04267FfaA08049) |
| Owner | [`0x184E46634F2E21d88365ffC2bF58a83e315f3c8c`](https://scan.bohr.life/address/0x184E46634F2E21d88365ffC2bF58a83e315f3c8c) |
| Agent (gas only) | [`0xb0Bb213DC381287c6A0D0A279ac9Cf423e7A340e`](https://scan.bohr.life/address/0xb0Bb213DC381287c6A0D0A279ac9Cf423e7A340e) |

| Demo | Simulate | On-chain | Vault |
|---|---|---|---|
| **Allow** — 0.1 BOT to payee | `OK` | [tx](https://scan.bohr.life/tx/0xbd15aefe5b7d22061ed6e210e7465a33a483ac5ad93f9ba0414e7e2df1edb374) | 2.0 → 1.9 BOT |
| **Cap** — 1000 BOT drain | `CAP` | [tx](https://scan.bohr.life/tx/0x377f176631987a2b35944eef1634079f61a0454074c8983a2af1213b5cb72a4e) | unchanged |
| **Inject** — unknown recipient | `TARGET` | [tx](https://scan.bohr.life/tx/0x4ade5df4c51666db856d10e27b939e24505990a35ca1d144a409ec5e76e4ff28) | unchanged |

Create tx: [`0xf3829f78…`](https://scan.bohr.life/tx/0xf3829f786a54ade7bb54951561dad7501ad79995849f944b91a6e3286745f8aa)

Tests: `forge test` — 13 passing (caps, allowlist, pause, replay, ERC-20, call-fail).

---

## Why this belongs on BOT Chain

- Native tBOT in the vault; BOT gas on every agent action  
- Uses official testnet RPC (`https://rpc.bohr.life`) and explorer  
- Matches the Aug 2026 BOT Chain themes: agent wallets, permission controls, autonomous protection, verifiable payments  
- Next integrations: [EOA paymaster](https://dev-docs.botchain.ai/docs/Developers/eoa-paymaster/) for gas sponsorship, B DEX as an allowlisted router, CaryPact job settlement receipts  

Differentiation: existing spend-vault demos fence value. AgentRail adds **pre-flight simulate**, **no-revert blocked receipts**, and a **verify** step after inclusion. That is the control plane BOT’s research describes, not another DEX or wallet.

---

## 90-day milestones (suggested grant schedule)

| Days | Deliverable | On-chain metric |
|---|---|---|
| 0–30 | SDK (`simulate` / `execute` / `verify`), public demo UI, 3 more policy reasons documented | ≥50 agent `Decision` events; ≥10 unique blocked attacks |
| 31–60 | EOA paymaster path; agent session-key rotation; B DEX allowlisted swap demo | ≥200 sponsored or native agent txs |
| 61–90 | Mainnet deploy after review; Agent identity stub (`agentId` → owner → session key); grant report | Mainnet vault + public docs; BOT gas attributable to AgentRail |

We are happy to adjust milestones to BOT Labs’ KPI format (weekly/monthly on-chain settlement).

---

## Ask

- Ecosystem grant (milestone-based) for engineering, audit, and testnet/mainnet gas  
- Dedicated BOT Labs account manager for paymaster + explorer + wallet listing  
- Official ecosystem certification and DApp portal placement when mainnet is ready  

We are not asking for a token launch. AgentRail is infrastructure: it should increase *other* BOT applications’ ability to run agents safely, which increases fee flow on a zero-inflation chain.

---

## How to apply

1. Open the [BOT Chain](https://www.botchain.ai/en) Ecosystem Support Program form, **or**  
2. Email **ecosystem@BOTChain.info** with the body below. Attach **WHITEPAPER.pdf** (print `WHITEPAPER.html` to PDF) or [WHITEPAPER.md](WHITEPAPER.md).

### Email body (copy)

**To:** ecosystem@BOTChain.info  
**Subject:** AgentRail — Simulate → Execute → Verify control plane (BOT testnet live)

Hello BOT Labs / Ecosystem team,

I am applying to the Ecosystem Support / BOT Infrastructure Grant.

AgentRail is a live BOT Chain testnet product that enforces Read → Simulate → Execute → Verify for autonomous agents. The agent never holds treasury funds. Policy failures emit on-chain `Decision` receipts instead of reverting, so blocked attacks are auditable.

Live vault: https://scan.bohr.life/address/0x254AceA1E7411EA396a6a8802316206cFfB14171  

Proof txs:  
- Allowed 0.1 BOT: https://scan.bohr.life/tx/0xbd15aefe5b7d22061ed6e210e7465a33a483ac5ad93f9ba0414e7e2df1edb374  
- Blocked over-cap drain: https://scan.bohr.life/tx/0x377f176631987a2b35944eef1634079f61a0454074c8983a2af1213b5cb72a4e  
- Blocked prompt-injected recipient: https://scan.bohr.life/tx/0x4ade5df4c51666db856d10e27b939e24505990a35ca1d144a409ec5e76e4ff28  

This maps directly to BOT Chain’s published agent-payment framework (typed intent, simulation, versioned policy, settlement verification).

I would like a milestone-based grant and a BOT Labs account manager to sequence paymaster integration and mainnet. Full write-up is attached.

Thank you,  
Ujjwal Dubey  
GitHub: https://github.com/ujjwaldubey1  
Repo: https://github.com/ujjwaldubey1/AgentRail  
X: https://x.com/ujjwal07dubey  
Email: ujjwal07dubey@gmail.com
