// some time there is error "process is not defined" appear from https://unpkg.com/node_modules/hey-listen/dist/hey-listen.es.js
//window.process = {env: {NODE_ENV: false}};
//window.Buffer = {from:function(){}};

import { Web3Modal } from 'https://unpkg.com/@web3modal/html@2.6.2/dist/cdn/bundle.js';
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
    WagmiCore,
    WagmiCoreChains,
    WagmiCoreConnectors
} from 'https://unpkg.com/@web3modal/ethereum';
//import { WalletConnectModal } from 'https://unpkg.com/@walletconnect/modal'
//import "https://unpkg.com/@walletconnect/ethereum-provider";
//const EthereumProvider = window['@walletconnect/ethereum-provider'].EthereumProvider;

const appName = Q.info.app;
const projectId = Q.getObject(['web3', appName, 'providers', 'walletconnect', 'projectId'], Q.Users.apps);

// Equivalent to importing from @wagmi/coremodule.exports
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
        new CoinbaseWalletConnector({ chains }),
    ],
    publicClient
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
Q.Users.Web3.web3Modal = new Web3Modal({projectId}, ethereumClient);

/*Q.Users.Web3.ethereumProvider = await EthereumProvider.init({
    projectId, // REQUIRED your projectId
    chains, // REQUIRED chain ids
    showQrModal: true, // REQUIRED set to "true" to use @walletconnect/modal
    metadata: {
        name: appName,
        //description: 'Demo Client as Wallet/Peer',
        url: Q.info.baseUrl,
        icons: []
    },
    qrModalOptions: {
        projectId,
        chains,
        enableAuthMode: true
    }, // OPTIONAL - `undefined` by default
});*/