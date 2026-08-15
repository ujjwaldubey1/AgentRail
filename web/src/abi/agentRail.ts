export const agentRailAbi = [
  {
    type: "function",
    name: "simulate",
    stateMutability: "view",
    inputs: [
      {
        name: "intent",
        type: "tuple",
        components: [
          { name: "to", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "deadline", type: "uint64" },
          { name: "actionId", type: "bytes32" },
        ],
      },
    ],
    outputs: [
      { name: "allowed", type: "bool" },
      { name: "reason", type: "bytes32" },
    ],
  },
  {
    type: "function",
    name: "proposeAndExecute",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "intent",
        type: "tuple",
        components: [
          { name: "to", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "deadline", type: "uint64" },
          { name: "actionId", type: "bytes32" },
        ],
      },
    ],
    outputs: [{ name: "allowed", type: "bool" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "agent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "remainingDailyCap",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "perTxCap",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
