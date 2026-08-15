import { defineChain } from "viem";

export const botTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.bohr.life"] },
  },
  blockExplorers: {
    default: { name: "BOTScan", url: "https://scan.bohr.life" },
  },
});

export const ADDRESSES = {
  vault: "0x254AceA1E7411EA396a6a8802316206cFfB14171" as const,
  payee: "0x8bf5319Db9cD308D52bA8f4a6c04267FfaA08049" as const,
  owner: "0x184E46634F2E21d88365ffC2bF58a83e315f3c8c" as const,
  agent: "0xb0Bb213DC381287c6A0D0A279ac9Cf423e7A340e" as const,
  injectTarget: "0xA11CE00000000000000000000000000000000000" as const,
};

export const EXPLORER = "https://scan.bohr.life";
export const TWITTER = "https://x.com/ujjwal07dubey";
export const GITHUB = "https://github.com/ujjwaldubey1/AgentRail";
export const CONTACT_EMAIL = "ujjwal07dubey@gmail.com";

export const PROOFS = [
  {
    id: "allow",
    title: "Allow 0.1",
    subtitle: "Paid to allowlisted payee",
    well: "lime" as const,
    meta: "0.1 BOT",
    hash: "0xbd15aefe5b7d22061ed6e210e7465a33a483ac5ad93f9ba0414e7e2df1edb374",
  },
  {
    id: "cap",
    title: "Cap drain",
    subtitle: "1000 BOT blocked",
    well: "purple" as const,
    meta: "blocked",
    hash: "0x377f176631987a2b35944eef1634079f61a0454074c8983a2af1213b5cb72a4e",
  },
  {
    id: "inject",
    title: "Inject target",
    subtitle: "Unknown recipient blocked",
    well: "red" as const,
    meta: "blocked",
    hash: "0x4ade5df4c51666db856d10e27b939e24505990a35ca1d144a409ec5e76e4ff28",
  },
];
