import { useState } from 'react';

import { Input } from '@chakra-ui/react';

export type WcConnectProps = {
  uri?: string | undefined;
  session?: any | undefined;
  //  IWalletConnectSession
};

type WalletConnectFieldProps = {
  client?: any;
  //  IClientMeta;
  onConnect: ({ uri }: WcConnectProps) => Promise<void>;
};

const WalletConnectField = ({ onConnect }: WalletConnectFieldProps): React.ReactElement => {
  const [inputValue, setInputValue] = useState('');

  const onPaste = (event: React.ClipboardEvent) => {
    const connectWithUri = (data: string) => {
      if (data.startsWith('wc:')) {
        onConnect({ uri: data });
      }
    };

    setInputValue('');

    const items = event.clipboardData.items;

    for (const index in items) {
      const item = items[index];

      if (item.kind === 'string' && item.type === 'text/plain') {
        connectWithUri(event.clipboardData.getData('Text'));
      }
    }
  };

  return (
    <Input
      id="wc-uri"
      name="wc-uri"
      placeholder="Connection link"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onPaste={onPaste}
      autoComplete="off"
    />
  );
};

export default WalletConnectField;
