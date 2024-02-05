import {
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Button,
  Spinner,
  useColorMode,
} from '@chakra-ui/react';
import TransactionList from './components/TransactionList';
import CreateTransaction from './components/CreateTransaction';
import HandleOwners from './components/HandleOwners';
import History from './components/History';
import { useWeb3Context, CONNECTION_STATUS } from './web3.context';
import { getChainId } from './configuration';
import SwitchNetworkButton from './components/SwitchNetworkButton';
import WalletConnectTab from './components/WalletConnectTab';
import { useEffect } from 'react';

const chainId = getChainId();

const App = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { signerChainId, connect, connectionStatus } = useWeb3Context();
  const disconnected = connectionStatus === CONNECTION_STATUS.DISCONNECTED;
  const wrongSignerNetwork = signerChainId !== -1 && signerChainId !== chainId;
  const connecting = connectionStatus === CONNECTION_STATUS.CONNECTING;

  useEffect(() => {
    if (colorMode === 'light') {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);

  let content: React.ReactElement;
  switch (true) {
    case disconnected:
      content = <Button onClick={connect}>Connect Wallet</Button>;
      break;
    case connecting:
      content = <Spinner />;
      break;
    case wrongSignerNetwork:
      content = <SwitchNetworkButton targetChainId={chainId} targetNetworkName="Optimism" />;
      break;
    default:
      content = (
        <Tabs align="center" w="100%" isLazy>
          <TabList>
            <Tab>Wallet Connect</Tab>
            <Tab>Create Transaction</Tab>
            <Tab>Remove {'&'} Add Owner</Tab>
            <Tab>Queue</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <WalletConnectTab />
            </TabPanel>
            <TabPanel>
              <CreateTransaction />
            </TabPanel>
            <TabPanel>
              <HandleOwners />
            </TabPanel>
            <TabPanel>
              <TransactionList />
            </TabPanel>
            <TabPanel>
              <History />
            </TabPanel>
          </TabPanels>
        </Tabs>
      );
  }

  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      maxW="100vw"
      gap="2"
      bg="navy.900"
      h="100vh"
      pt="100px"
    >
      <Heading>Ambassador Council Safe</Heading>
      {content}
    </Container>
  );
};

export default App;
