import injectedModule from '@web3-onboard/injected-wallets';
import { ethers } from 'ethers';
import Onboard from '@web3-onboard/core';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import coinbaseWalletModule from '@web3-onboard/coinbase';
import ledgerModule from '@web3-onboard/ledger';
import gnosisModule from '@web3-onboard/gnosis';
import torusModule from '@web3-onboard/torus';
import walletConnectModule from '@web3-onboard/walletconnect';
import { getHexChainId, CHAIN_TOKEN_SYMBOL, CHAIN_NAME, CHAIN_RPC_URL } from './configuration';
import Safe from '@gnosis.pm/safe-core-sdk';
import { getSafe } from './utils/safe';

const injected = injectedModule();
const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true });
const ledger = ledgerModule({ projectId: '099e1ff8ded93df0432e37626e04e09d', walletConnectVersion: 2 });
const gnosis = gnosisModule();
const torus = torusModule();
const walletConnect = walletConnectModule({ projectId: '099e1ff8ded93df0432e37626e04e09d', requiredChains: [10] });

const onboard = Onboard({
  wallets: [injected, ledger, coinbaseWalletSdk, gnosis, torus, walletConnect],
  chains: [
    {
      id: getHexChainId(),
      token: CHAIN_TOKEN_SYMBOL,
      label: CHAIN_NAME,
      rpcUrl: CHAIN_RPC_URL,
    },
  ],
});

export const enum CONNECTION_STATUS {
  CONNECTED,
  DISCONNECTED,
  CONNECTING,
}

function Web3Provider({ children }: { children: ReactNode }) {
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signerChainId, setSignerChainId] = useState<number>(-1);
  const [safe, setSafe] = useState<Safe | null>(null);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);

  useEffect(() => {
    const state = onboard.state.select('wallets');
    const { unsubscribe } = state.subscribe((update) => {
      if (connectionStatus === CONNECTION_STATUS.CONNECTED && update.length === 0) {
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        setSigner(null);
        setProvider(null);
        setSafe(null);
        setSignerChainId(-1);
      }
    });

    // @ts-expect-error ethers is missing the listener type
    provider?.provider?.on('chainChanged', (chainId: string) => {
      setSignerChainId(parseInt(chainId, 16));
    });

    return () => {
      // @ts-expect-error ethers is missing the listener type
      provider?.provider?.removeAllListeners('chainChanged');

      // onboard throws an error if you call unsubscribe before it's "ready", seems like a bug
      try {
        unsubscribe();
      } catch (e) {}
    };
  }, [provider, connectionStatus]);

  const connect = async () => {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    const wallets = await onboard.connectWallet();

    if (wallets[0]) {
      await onboard.setChain({ chainId: getHexChainId() });
      try {
        const ethersProvider = new ethers.providers.Web3Provider(wallets[0].provider);
        const ethersSigner = ethersProvider.getSigner();
        const providerChainId = await wallets[0].provider.request({ method: 'eth_chainId' });
        const safeSdk = await getSafe(ethersSigner);

        setProvider(ethersProvider);
        setSignerChainId(Number(providerChainId));
        setSigner(ethersSigner);
        setSafe(safeSdk);
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      } catch (err) {
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        console.log(`error when connecting: ${err}`);
      }
    }
  };

  return (
    <Web3Context.Provider value={{ connect, provider, signer, signerChainId, safe, connectionStatus }}>
      {children}
    </Web3Context.Provider>
  );
}

type Web3ContextType = {
  signer: ethers.providers.JsonRpcSigner | null;
  provider: ethers.providers.Web3Provider | null;
  connect: () => Promise<void>;
  signerChainId: number;
  safe: Safe | null;
  connectionStatus: CONNECTION_STATUS;
};

const Web3Context = createContext<Web3ContextType>({
  signer: null,
  provider: null,
  connect: async () => void 0,
  signerChainId: -1,
  safe: null,
  connectionStatus: CONNECTION_STATUS.DISCONNECTED,
});

const useWeb3Context = () => {
  return useContext(Web3Context);
};

export { Web3Provider, useWeb3Context, onboard };
