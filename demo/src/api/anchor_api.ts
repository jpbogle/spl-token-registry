import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from './spl_token_registry.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TokenInfo } from './TokenInfo';
import { PendingTokenInfo } from './PendingTokenInfo';

const PROGRAM_ID = new web3.PublicKey(idl.metadata.address);
// @ts-ignore
const PROGRAM_IDL : anchor.Idl = idl;

const CONFIRM_OPTIONS: web3.ConfirmOptions = {
  preflightCommitment: "processed",
}

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
]

export async function getProvider(wallet: anchor.Wallet) {
  /* create the provider and return it to the caller */
  /* network set to local network for now */
  const network = "http://127.0.0.1:8899";
  const connection = new web3.Connection(network, CONFIRM_OPTIONS.preflightCommitment);
  const provider = new anchor.Provider(
    connection, wallet, CONFIRM_OPTIONS,
  );
  return provider;
}


export async function getPendingTokenAccountPubkey(): Promise<[web3.PublicKey, number]> {
  const seed = "pending_token_infos";
  console.log(`Getting pending token infos PDA address for program ${PROGRAM_ID} and seed ${seed}`);
  let [seededPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(seed)],
    PROGRAM_ID,
  );
  return [seededPubkey, bump];
}

export async function initialize(wallet: WalletContextState, connection: web3.Connection) {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
  const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
    [seed],
    PROGRAM_ID
  );
  await program.rpc.initialize({ seed, bump }, {
    accounts: {
      pendingTokensAccount,
      user: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }
  });
}

export async function proposeToken(wallet: WalletContextState, connection: web3.Connection, tokenInfo: TokenInfo) {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  await program.rpc.propose(tokenInfo, {
    accounts: {
      pendingTokensAccount,
    }
  });
}

export async function voteFor(wallet: WalletContextState, connection: web3.Connection, splTokenProgramAddress: web3.PublicKey, amount: number) {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  return program.rpc.voteFor(new anchor.BN(amount), splTokenProgramAddress, {
    accounts: {
      pendingTokensAccount,
    }
  });
}

export async function getTokenInfos(connection: web3.Connection): Promise<Array<TokenInfo>> {
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  const accounts = await connection.getProgramAccounts(PROGRAM_ID);
  console.log(accounts);
  // const filteredAccounts = accounts.filter(({ pubkey, account }) => {
  //   return pubkey.toBase58() !== pendingTokensAccountPubkey.toBase58();
  // });
  // const tokenInfos = filteredAccounts.map(({ pubkey, account }) => {
  //   return TokenInfo.fromBytes(account.data);
  // });
  return [];
}

export async function getPendingTokenInfos(wallet: WalletContextState, connection: web3.Connection): Promise<Array<PendingTokenInfo>> {
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount)
  // const filteredAccounts = accounts.filter(({ pubkey, account }) => {
  //   return pubkey.toBase58() !== pendingTokensAccountPubkey.toBase58();
  // });
  // @ts-ignore
  return account.pendingTokenInfos;
}