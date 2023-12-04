import { useState, useCallback, useEffect } from 'react';
import { useWeb3Context } from '../web3.context';
// import { areStringsEqual } from '../utils/strings';
// import { isObjectEIP712TypedData } from '../utils/eip712';
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
}) as any;

// const rejectWithMessage = (connector: any, id: number | undefined, message: string) => {
//   connector.rejectRequest({ id, error: { message } });
// };

const useWalletConnect = () => {
  const { signer, safe } = useWeb3Context();

  const [wallet, setWallet] = useState<Web3WalletType | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.DISCONNECTED);
  const [pendingRequest, setPendingRequest] = useState<RpcRequest | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const signClient = await Web3Wallet.init({
        core,
        metadata: {
          name: 'Demo app',
          description: 'Demo Client as Wallet/Peer',
          url: 'www.walletconnect.com',
          icons: [],
        },
      });
      setWallet(signClient);
    })();
  }, [!!wallet, safe]);

  const approveRequest = (id?: number, hash?: string) => {
    console.log('approveRequest', id, hash, signer);
    // wallet?.approveSession({
    //   id: id ?? 0,
    //   namespaces: {
    //     eip712: [
    //       {
    //         accounts: [safe?.getAddress() ?? ''],
    //         events: ['tx.txhash'],
    //         chains: ['10'],
    //         methods: ['eth_sendTransaction'],
    //       },
    //     ],
    //   },
    // });
  };

  const rejectRequest = (id?: number, message?: string) => {
    console.log('rejectRequest', id, message);
  };

  const wcConnect = useCallback(
    async ({ uri }: WcConnectProps) => {
      if (uri && safe && wallet) {
        await wallet.core.pairing.pair({
          uri,
        });
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);

        wallet?.on('session_proposal', onSessionProposal);

        wallet?.on('session_request', async (params) => {
          // const result = '0x';

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

          //     case 'personal_sign': {
          //       const [, address] = payload.params;
          //       const safeAddress = safe?.getAddress() ?? '';

          //       if (!areStringsEqual(address, safeAddress)) {
          //         throw new Error('The address or message hash is invalid');
          //       }

          //       setPendingRequest(payload);
          //       return;
          //     }

          //     case 'eth_sign': {
          //       const [address] = payload.params;
          //       const safeAddress = safe?.getAddress() ?? '';

          //       if (!areStringsEqual(address, safeAddress)) {
          //         throw new Error('The address or message hash is invalid');
          //       }

          //       setPendingRequest(payload);
          //       break;
          //     }

          //     case 'eth_signTypedData':
          //     case 'eth_signTypedData_v4': {
          //       const [address, typedDataString] = payload.params;
          //       const safeAddress = safe?.getAddress() ?? '';
          //       const typedData = JSON.parse(typedDataString);

          //       if (!areStringsEqual(address, safeAddress)) {
          //         throw new Error('The address is invalid');
          //       }

          //       if (isObjectEIP712TypedData(typedData)) {
          //         setPendingRequest(payload);
          //         return;
          //       } else {
          //         throw new Error('Invalid typed data');
          //       }
          //     }
          //     default: {
          //       rejectWithMessage(wcConnector, payload.id, 'METHOD_NOT_SUPPORTED');
          //       break;
          //     }
          //   }

          //   wcConnector.approveRequest({
          //     id: payload.id,
          //     result,
          //   });
          // } catch (err) {
          //   rejectWithMessage(wcConnector, payload.id, (err as Error).message);
          // }
        });

        wallet?.on('session_delete', (error) => {
          if (error) {
            throw error;
          }
          wcDisconnect();
        });
      }
    },
    [wallet],
  );

  async function onSessionProposal({ id, params }: Web3WalletTypes.SessionProposal) {
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
      const session = await wallet?.approveSession({
        id,
        relayProtocol: params.relays[0].protocol,
        namespaces: approvedNamespaces,
      });
      console.log(session);
    } catch (error) {
      console.error(error);
      await wallet?.rejectSession({
        id,
        reason: getSdkError('USER_REJECTED'),
      });
    }
  }

  const wcDisconnect = useCallback(async () => {
    wallet?.disconnectSession({
      topic: 'disconnect',
      reason: {
        code: 0,
        message: 'User disconnected',
      },
    });
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
  }, [!!wallet]);

  // const approveRequest = useCallback(
  //   (id: number, result: any) => {
  //     if (!connector) return;
  //     connector.approveRequest({ id, result });
  //     setPendingRequest(undefined);
  //   },
  //   [connector],
  // );

  // const rejectRequest = useCallback(
  //   async (id: number, message: any) => {
  //     if (!connector) return;
  //     rejectWithMessage(connector, id, message);
  //   },
  //   [connector],
  // );

  // useEffect(() => {
  //   if (!connector && !triedToReinitiateTheSession.current) {
  //     const session = localStorage.getItem('walletconnect');
  //     if (session) {
  //       wcConnect({ session: JSON.parse(session) });
  //       triedToReinitiateTheSession.current = true;
  //     }
  //   }
  // }, [connector, wcConnect, safe, wcDisconnect]);

  const wcClientData = wallet?.metadata ?? undefined;

  return { wcClientData, wcConnect, wcDisconnect, connectionStatus, pendingRequest, approveRequest, rejectRequest };
};

export { useWalletConnect, CONNECTION_STATUS };
