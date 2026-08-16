# AgentRail

Simulate → Policy → Execute → Verify for AI agents on BOT Chain.

**Author:** Ujjwal Dubey ([@ujjwaldubey1](https://github.com/ujjwaldubey1) · [ujjwal07dubey@gmail.com](mailto:ujjwal07dubey@gmail.com))  
**Repo:** [github.com/ujjwaldubey1/AgentRail](https://github.com/ujjwaldubey1/AgentRail)  
**Grant application:** [GRANT.md](GRANT.md) (email copy + live explorer links).  
**Demo (frontend):** `cd web && npm install && npm run dev` — Inter landing + live Simulate / Execute panel.  
**Static snapshot:** [demo/index.html](demo/index.html) (explorer links only).

The agent never holds the treasury. It can only call `proposeAndExecute`. Policy failures **do not revert** — they emit `Decision(allowed=false)` so blocked attacks stay on-chain.

## What is in this repo

| Path | Role |
|---|---|
| `src/AgentRail.sol` | Vault + policy + receipts |
| `src/MockPayee.sol` | Demo recipient for native BOT |
| `test/AgentRail.t.sol` | Caps, allowlist, pause, replay, ERC-20 |
| `script/Deploy.s.sol` | Deploy to BOT testnet (chain 968) |
| `script/AgentActions.s.sol` | Demo: `allow` / `cap` / `inject` |
| `web/` | Landing + live dApp (Inter, BOT testnet 968) |

## BOT Chain Testnet

| | |
|---|---|
| Chain ID | `968` |
| RPC | `https://rpc.bohr.life` |
| Explorer | https://scan.bohr.life |
| Faucet | https://faucet.botchain.ai/en/basic |

Use two wallets: **owner** (holds funds, sets policy) and **agent** (session key, gas only).

## Setup

Install [Foundry](https://book.getfoundry.sh/getting-started/installation) (on this machine binaries live in `%USERPROFILE%\.foundry\bin`). Then:

```powershell
$env:Path = "$env:USERPROFILE\.foundry\bin;" + $env:Path
cd C:\Users\prajj\Documents\Projects\bot-chain-grant
copy .env.example .env
```

Edit `.env`:

- `PRIVATE_KEY` — owner key (the account with ~10 test BOT)
- `AGENT_ADDRESS` — the separate agent account

Do not commit `.env`.

```powershell
forge test -vv
```

## Deploy (testnet 968)

Send ~0.05 BOT on the owner for deploy gas. Keep the rest for the vault.

```powershell
# PowerShell: load env vars from .env (one line each KEY=value, no quotes)
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k, $v = $_.Split('=', 2)
  Set-Item -Path "Env:$k" -Value $v.Trim()
}

forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.bohr.life --broadcast
```

Copy `AgentRail` and `Payee` addresses from the log into `.env` as `RAIL_ADDRESS` and `PAYEE_ADDRESS`.

Fund the vault from MetaMask (owner): send **2 BOT** to `RAIL_ADDRESS`. Leave a little BOT on the owner for later admin txs. The agent should already have a little BOT for gas.

## Demo the four-stage loop

```powershell
# 1. Allowed payment (Simulate OK → Execute → Verify Decision OK)
$env:ACTION = "allow"
forge script script/AgentActions.s.sol:AgentActions --rpc-url https://rpc.bohr.life --broadcast

# 2. Over-cap drain (blocked, vault unchanged)
$env:ACTION = "cap"
forge script script/AgentActions.s.sol:AgentActions --rpc-url https://rpc.bohr.life --broadcast

# 3. Prompt-injected recipient (blocked)
$env:ACTION = "inject"
forge script script/AgentActions.s.sol:AgentActions --rpc-url https://rpc.bohr.life --broadcast
```

Add `AGENT_PRIVATE_KEY` to `.env` (agent account only — never the owner key). Confirm each tx on [scan.bohr.life](https://scan.bohr.life): look for `Decision` with `allowed` true/false.

## Policy (v1)

- Native BOT and allowlisted ERC-20
- Destination allowlist
- Optional selector allowlist when `data` is present
- Per-tx cap and UTC-day cap (`block.timestamp / 1 days`)
- Expiry, pause, action-id replay lock
- Owner-only `withdraw` / `setAgent` / `setPolicy`

`simulate(intent)` is the on-chain check you should `eth_call` **before** sending `proposeAndExecute`.

## Frontend

```powershell
cd web
npm install
npm run dev
```

Open the Vite URL. Connect Wallet, switch to BOT testnet 968 if asked. Use the **owner** account to send 0.2 BOT into the vault. Use the **agent** account for Allow / Cap drain / Inject.

Config (live testnet): [`web/src/config.ts`](web/src/config.ts).

## Live site (Vercel)

This is a static Vite app. No backend, no env vars, no Next.js. The chain (RPC `https://rpc.bohr.life` + vault in `web/src/config.ts`) is the backend.

The GitHub repo root is Foundry. Vercel must build **`web/`**. [`vercel.json`](vercel.json) at the repo root does that automatically:

- Install: `npm install --prefix web`
- Build: `npm run build --prefix web`
- Output: `web/dist`

If an existing Vercel project was pointed at the wrong folder:

1. Project → **Settings → General → Root Directory** → leave empty (repo root) **or** set to `web`
2. If Root Directory is `web`, Vercel detects Vite by itself; you can ignore the root `vercel.json`
3. **Deployments → Redeploy** the latest `main` commit

No Vercel environment variables are required. Visitors need MetaMask and BOT testnet 968 to use Connect / Simulate / Execute.
