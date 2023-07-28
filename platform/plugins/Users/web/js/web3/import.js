var projectId = Q.getObject(['web3', Q.info.app, 'providers', 'walletconnect', 'projectId'], Q.Users.apps);

import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
    WagmiCore,
    WagmiCoreChains,
    WagmiCoreConnectors
} from 'https://unpkg.com/@web3modal/ethereum@2.6.2'

import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.6.2'

// Equivalent to importing from @wagmi/core
const { configureChains, createConfig } = WagmiCore

// Equivalent to importing from @wagmi/core/chains
const { mainnet, polygon, polygonMumbai, goerli, bsc, bscTestnet } = WagmiCoreChains

// Equivalent to importing from @wagmi/core/providers
const { CoinbaseWalletConnector } = WagmiCoreConnectors

const chains = [mainnet, polygon, polygonMumbai, goerli, bsc, bscTestnet];
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: [
        ...w3mConnectors({ chains, version: 2, projectId }),
        new WagmiCoreConnectors.CoinbaseWalletConnector({ chains }),
    ],
    publicClient
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
Q.Users.Web3.web3Modal = new Web3Modal({ projectId }, ethereumClient);