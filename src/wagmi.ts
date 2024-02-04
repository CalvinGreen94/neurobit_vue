import { http, createConfig } from 'wagmi'
import { mainnet, sepolia,goerli } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, goerli],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'NeuroBit DEX-AI' }),
    walletConnect({ projectId: '0b1f3a0b1e7529f790075842cdf6fe61' }),
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [goerli.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
