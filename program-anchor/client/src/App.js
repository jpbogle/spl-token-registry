import './App.css';
import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from './idl.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
]

/* create an account  */
const baseAccount = anchor.web3.Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [value, setValue] = useState(null);
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new anchor.Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function createCounter() {    
    const provider = await getProvider()
    const program = new anchor.Program(idl, programID, provider);
    const [pendingTokensAccount, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"))],
      program.programId
    );
    console.log(program, pendingTokensAccount.toBase58());
    try {
      await program.rpc.initialize(bump, {
        accounts: {
          pendingTokensAccount,
          user: program.provider.wallet.publicKey,
          // rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      });
    } catch (err) {
      console.log("WTF error: ", err);
    }
  }

  async function increment() {
    const provider = await getProvider();
    const program = new anchor.Program(idl, programID, provider);
    await program.rpc.increment({
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setValue(account.count.toString());
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={createCounter}>Create counter</button>)
          }
          {
            value && <button onClick={increment}>Increment counter</button>
          }

          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>Please create the counter.</h3>
            )
          }
        </div>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;