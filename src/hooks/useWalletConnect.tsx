import { useState, useCallback, useEffect } from 'react';
import { useWeb3Context } from '../web3.context';
// import { areStringsEqual } from '../utils/strings';
// import { isObjectEIP712TypedData } from '../utils/eip712';
import { RpcRequest } from '../types/rpc';

import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { WcConnectProps } from '../components/WalletConnectField';

enum CONNECTION_STATUS {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

const core = new Core({
  projectId: '099e1ff8ded93df0432e37626e04e09d',
});

// const rejectWithMessage = (connector: any, id: number | undefined, message: string) => {
//   connector.rejectRequest({ id, error: { message } });
// };

const useWalletConnect = () => {
  const { signer, safe } = useWeb3Context();

  const [wallet, setWallet] = useState<IWeb3Wallet | undefined>(undefined); // [web3wallet, setWeb3Wallet
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.DISCONNECTED);
  const [pendingRequest] = useState<RpcRequest | undefined>(undefined);

  useEffect(() => {
    // iffe
    (async () => {
      const web3wallet = await Web3Wallet.init({
        core, // <- pass the shared `core` instance
        metadata: {
          name: 'ac app',
          description: 'AC Peer app',
          url: 'www.walletconnect.com',
          icons: ['https://walletconnect.org/walletconnect-logo.png'],
        },
      });
      setWallet(web3wallet);

      wallet?.on('session_request', async (proposal) => {
        if (safe) {
          wallet.approveSession({
            id: proposal.id,
            namespaces: {},
          });

          // setWcClientData(payload.params[0].peerMeta);
        }
      });
    })();
  }, [wallet, safe]);

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
      if (uri) {
        await wallet?.pair({
          uri,
        });
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      }
    },
    [wallet],
  );

  const wcDisconnect = useCallback(async () => {
    wallet?.disconnectSession({
      topic: 'disconnect',
      reason: {
        code: 0,
        message: 'User disconnected',
      },
    });
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
  }, [wallet]);

  // web3wallet.on('session_request', async (error, payload) => {
  //   if (error) {
  //     throw error;
  //   }
  //   if (safe) {
  //     web3wallet.approveSession({
  //       accounts: [safe.getAddress()],
  //       chainId: await safe.getChainId(),
  //     });

  //     setWcClientData(payload.params[0].peerMeta);
  //   }
  // });

  // const wcConnect = useCallback(
  //   async ({ uri, session }: { uri?: string; session?: IWalletConnectSession }) => {
  //     if (!signer || !safe || connector) return;

  //     setConnector(web3wallet);
  //     setWcClientData(web3wallet.metadata ?? undefined);
  //     setConnectionStatus(CONNECTION_STATUS.CONNECTED);

  //     web3wallet.on('session_request', async (error, payload) => {
  //       if (error) {
  //         throw error;
  //       }
  //       if (safe) {
  //         web3wallet.approveSession({
  //           accounts: [safe.getAddress()],
  //           chainId: await safe.getChainId(),
  //         });

  //         setWcClientData(payload.params[0].peerMeta);
  //       }
  //     });

  //     web3wallet.on('call_request', async (error, payload) => {
  //       if (error) {
  //         throw error;
  //       }

  //       const result = '0x';
  //       try {
  //         switch (payload.method) {
  //           case 'eth_sendTransaction': {
  //             setPendingRequest(payload);
  //             return;
  //           }

  //           case 'personal_sign': {
  //             const [, address] = payload.params;
  //             const safeAddress = safe?.getAddress() ?? '';

  //             if (!areStringsEqual(address, safeAddress)) {
  //               throw new Error('The address or message hash is invalid');
  //             }

  //             setPendingRequest(payload);
  //             return;
  //           }

  //           case 'eth_sign': {
  //             const [address] = payload.params;
  //             const safeAddress = safe?.getAddress() ?? '';

  //             if (!areStringsEqual(address, safeAddress)) {
  //               throw new Error('The address or message hash is invalid');
  //             }

  //             setPendingRequest(payload);
  //             break;
  //           }

  //           case 'eth_signTypedData':
  //           case 'eth_signTypedData_v4': {
  //             const [address, typedDataString] = payload.params;
  //             const safeAddress = safe?.getAddress() ?? '';
  //             const typedData = JSON.parse(typedDataString);

  //             if (!areStringsEqual(address, safeAddress)) {
  //               throw new Error('The address is invalid');
  //             }

  //             if (isObjectEIP712TypedData(typedData)) {
  //               setPendingRequest(payload);
  //               return;
  //             } else {
  //               throw new Error('Invalid typed data');
  //             }
  //           }
  //           default: {
  //             rejectWithMessage(wcConnector, payload.id, 'METHOD_NOT_SUPPORTED');
  //             break;
  //           }
  //         }

  //         wcConnector.approveRequest({
  //           id: payload.id,
  //           result,
  //         });
  //       } catch (err) {
  //         rejectWithMessage(wcConnector, payload.id, (err as Error).message);
  //       }
  //     });

  //     web3wallet.on('session_delete', (error) => {
  //       if (error) {
  //         throw error;
  //       }
  //       wcDisconnect();
  //     });
  //   },
  //   [wcDisconnect, signer, safe, connector],
  // );

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
