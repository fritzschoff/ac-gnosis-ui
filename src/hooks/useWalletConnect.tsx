import { useState, useCallback, useEffect } from 'react';
import { useWeb3Context } from '../web3.context';
// import { areStringsEqual } from '../utils/strings';
// import { isObjectEIP712TypedData } from '../utils/eip712';
import { RpcRequest } from '../types/rpc';
import { Core } from '@walletconnect/core';
import { WcConnectProps } from '../components/WalletConnectField';
import { SignClient } from '@walletconnect/sign-client';
import { SignClient as SignClientType } from '@walletconnect/sign-client/dist/types/client';

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

  const [wallet, setWallet] = useState<SignClientType | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.DISCONNECTED);
  const [pendingRequest] = useState<RpcRequest | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const signClient = await SignClient.init({
        projectId: '099e1ff8ded93df0432e37626e04e09d',
        relayUrl: 'wss://relay.walletconnect.org',
        core: core,
      });
      setWallet(signClient);
      // const web3wallet = await Web3Wallet.init({
      //   core, // <- pass the shared `core` instance
      //   metadata: {
      //     name: 'ac app',
      //     description: 'AC Peer app',
      //     url: 'www.walletconnect.com',
      //     icons: ['https://walletconnect.org/walletconnect-logo.png'],
      //   },
      // });
      // setWallet(web3wallet);

      // wallet?.on('session_request', async (proposal) => {
      //   if (safe) {
      //     wallet.approveSession({
      //       id: proposal.id,
      //       namespaces: {},
      //     });
      //   }
      // });
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
      }
    },
    [wallet],
  );

  wallet?.on('session_proposal', (event) => {
    console.log(event);
    wallet.approve({
      id: event.id,
      namespaces: {
        eip155: {
          accounts: ['eip155:10:0xe2eeF82ACA1c3405cF9640B40cbD6148182E8bA6'],
          methods: ['personal_sign', 'eth_sendTransaction'],
          events: ['accountsChanged'],
        },
      },
    });
  });

  const wcDisconnect = useCallback(async () => {
    // wallet?.disconnect({
    //   topic: 'disconnect',
    //   reason: {
    //     code: 0,
    //     message: 'User disconnected',
    //   },
    // });
    // setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
  }, []); // wallet

  // wallet?.on('session_request', async (args) => {
  //   if (safe) {
  //     wallet?.approveSession({
  //       accounts: [safe.getAddress()] as any[],
  //       chainId: await safe.getChainId(),
  //     });

  //     // setWcClientData(payload.params[0].peerMeta);
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
