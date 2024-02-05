import { useState, useCallback, useEffect } from 'react';
import { useWeb3Context } from '../web3.context';
import { RpcRequest } from '../types/rpc';
import { Core } from '@walletconnect/core';
import { WcConnectProps } from '../components/WalletConnectField';
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';
import { Web3Wallet as Web3WalletType } from '@walletconnect/web3wallet/dist/types/client';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';

enum CONNECTION_STATUS {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

const core = new Core({
  projectId: 'b8433306393b78ff75897e7f76f7d411',
});

const useWalletConnect = () => {
  const { signer, safe } = useWeb3Context();
  const [wallet, setWallet] = useState<Web3WalletType | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.DISCONNECTED);
  const [pendingRequest, setPendingRequest] = useState<RpcRequest | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!wallet) {
        const signClient = await Web3Wallet.init({
          core,
          metadata: {
            name: 'Ambassador Council',
            description: 'Safe integration for Ambassador Council',
            url: 'https://ambassador-council.web.app/',
            icons: [],
          },
        });
        setWallet(signClient);
      }
    })();
  }, [wallet, safe]);

  const approveRequest = (id?: number, hash?: string) => {
    console.log('approveRequest', id, hash, signer);
  };

  const rejectRequest = (id?: number, message?: string) => {
    console.log(wallet, id, message);
  };
  const wcDisconnect = useCallback(
    async (topic?: string) => {
      if (topic) {
        wallet?.core.pairing.disconnect({ topic });
      } else {
        const pairings = wallet?.core.pairing.getPairings();
        if (pairings && pairings[0]?.topic) {
          await Promise.all(
            pairings.map(async (pair) => {
              return await wallet?.core.pairing.disconnect({ topic: pair.topic });
            }),
          );
        }
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      }
    },
    [wallet],
  );

  const onSessionProposal = useCallback(
    async ({ id, params }: Web3WalletTypes.SessionProposal) => {
      try {
        const approvedNamespaces = buildApprovedNamespaces({
          proposal: params,
          supportedNamespaces: {
            eip155: {
              chains: ['eip155:10'],
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
                'eth_sendRawTransaction',
                'eth_sendTransaction',
              ],
              events: ['accountsChanged', 'chainChanged'],
              accounts: ['eip155:10:' + safe?.getAddress()],
            },
          },
        });
        await wallet?.approveSession({
          id,
          relayProtocol: params.relays[0].protocol,
          namespaces: approvedNamespaces,
        });
      } catch (error) {
        console.error(error);
        await wallet?.rejectSession({
          id,
          reason: getSdkError('USER_REJECTED'),
        });
      }
    },
    [safe, wallet],
  );

  const wcConnect = useCallback(
    async ({ uri }: WcConnectProps) => {
      if (uri && safe && wallet) {
        try {
          const { topic } = await wallet.core.pairing.pair({
            uri,
          });
          await wallet.core.pairing.ping({ topic });
          setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        } catch (error) {
          console.error('cant pair', JSON.stringify(error));
          await wcDisconnect();
        }

        wallet?.on('session_request', async (params) => {
          switch (params.params.request.method) {
            case 'eth_sendTransaction': {
              setPendingRequest({
                id: params.id,
                jsonrpc: 'https://mainnet.optimism.io',
                method: params.params.request.method,
                params: params.params.request.params,
              });
              return;
            }
          }
        });

        wallet?.on('session_proposal', onSessionProposal);

        wallet?.on('session_delete', (error) => {
          if (error) {
            throw error;
          }
          wcDisconnect();
        });
      }
    },
    [wallet, safe, wcDisconnect, onSessionProposal],
  );

  const wcClientData = wallet?.metadata ?? undefined;

  return {
    wcClientData,
    wcConnect,
    wcDisconnect,
    connectionStatus,
    pendingRequest,
    approveRequest,
    rejectRequest,
    wallet,
  };
};

export { useWalletConnect, CONNECTION_STATUS };
