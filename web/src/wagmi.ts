import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botTestnet } from "./config";

export const wagmiConfig = createConfig({
  chains: [botTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [botTestnet.id]: http("https://rpc.bohr.life"),
  },
});
