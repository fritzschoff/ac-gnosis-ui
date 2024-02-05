import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { theme } from '@synthetixio/v3-theme';
import { Web3Provider } from './web3.context';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <ColorModeScript initialColorMode="dark" />
        <App />
      </Web3Provider>
    </ChakraProvider>
  </React.StrictMode>,
);
