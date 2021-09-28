import { ConnectionProvider } from 'common/Connection';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { WalletProvider} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import WithHeader, { HeaderLink } from 'common/WithHeader';
import { ErrorBoundary } from 'common/ErrorBoundary';
import Registry from 'registry/Registry';
import Voting from 'registry/Voting';
import Propose from 'registry/Propose';

export default function Routes() {
  return (
      <ConnectionProvider>
        <WalletProvider wallets={[getPhantomWallet()]} autoConnect>
          <WalletModalProvider>
            <BrowserRouter basename={'/'}>
              <Switch>
                <Route exact path="/" component={() => (
                  <WithHeader selected={HeaderLink.FIND}>
                    <ErrorBoundary>
                      <Registry />
                    </ErrorBoundary>
                  </WithHeader>
                )} />
                <Route exact path="/vote" component={() => (
                  <WithHeader selected={HeaderLink.VOTE}>
                    <ErrorBoundary>
                      <Voting />
                    </ErrorBoundary>
                  </WithHeader>
                )} />
                <Route exact path="/propose" component={() => (
                  <WithHeader selected={HeaderLink.PROPOSE}>
                    <ErrorBoundary>
                      <Propose />
                    </ErrorBoundary>
                  </WithHeader>
                )} />
              </Switch>
            </BrowserRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
  );
}