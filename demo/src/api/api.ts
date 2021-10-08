import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from './spl_token_registry.json';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenInfo } from './TokenInfo';
import { PendingTokenInfo } from './PendingTokenInfo';

const PROGRAM_ID = new web3.PublicKey(idl.metadata.address);
// @ts-ignore
const PROGRAM_IDL : anchor.Idl = idl;
const PENDING_TOKEN_INFOS_SEED = "pending_token_infos";


const CONFIRM_OPTIONS: web3.ConfirmOptions = {
  preflightCommitment: "processed",
}

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
  console.log(`Getting pending token infos PDA address for program ${PROGRAM_ID} and seed ${PENDING_TOKEN_INFOS_SEED}`);
  let [seededPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(PENDING_TOKEN_INFOS_SEED)],
    PROGRAM_ID,
  );
  return [seededPubkey, bump];
}

export async function initialize(wallet: WalletContextState, connection: web3.Connection) {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  await program.rpc.initialize({ seed: anchor.utils.bytes.utf8.encode(PENDING_TOKEN_INFOS_SEED), bump }, {
    accounts: {
      pendingTokensAccount,
      user: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }
  });
}

export async function proposeToken(wallet: WalletContextState, connection: web3.Connection, tokenInfo: TokenInfo): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  return await program.rpc.propose(tokenInfo, {
    accounts: {
      pendingTokensAccount,
    },
  });
}

export async function voteFor(wallet: WalletContextState, connection: web3.Connection, splTokenProgramAddress: web3.PublicKey, amount: number): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  return program.rpc.voteFor(new anchor.BN(amount), splTokenProgramAddress, {
    accounts: {
      pendingTokensAccount,
    }
  });
}

export async function getTokenInfo(connection, splTokenProgramAddress: web3.PublicKey): Promise<TokenInfo> {
  const provider = new anchor.Provider(connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const accountToCreate = anchor.web3.Keypair.fromSeed(splTokenProgramAddress.toBytes());
  // @ts-ignore
  return await program.account.tokenInfoAccount.fetch(accountToCreate.publicKey);
}

export async function getTokenInfos(connection: web3.Connection): Promise<Array<TokenInfo>> {
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const provider = new anchor.Provider(connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const accounts = await connection.getProgramAccounts(PROGRAM_ID);
  const filteredAccounts = accounts.filter(({ pubkey, account }) => {
    return pubkey.toBase58() !== pendingTokensAccount.toBase58();
  });
  const resp = await Promise.all(filteredAccounts.map(async (account) => {
    try {
      const data = await program.account.tokenInfoAccount.fetch(account.pubkey);
      // @ts-ignore
      return data.tokenInfo;
    } catch (e) {
      console.log(`Error fetching account ${account.pubkey}: ${e}`);
      return null;
    }
  }));
  // @ts-ignore
  return resp.filter((i) => i != null);
}

export async function getPendingTokenInfos(connection: web3.Connection): Promise<Array<PendingTokenInfo>> {
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const provider = new anchor.Provider(connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount)
  // @ts-ignore
  return account.pendingTokenInfos;
}

export async function checkVote(wallet: WalletContextState, connection: web3.Connection, pendingTokenInfos: Array<PendingTokenInfo>): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const firstPassedVote = pendingTokenInfos.find((i) => i.votes.toNumber() >= 0);

  // const seed = Buffer.from(anchor.utils.bytes.utf8.encode(firstPassedVote.tokenInfo.splTokenProgramAddress.toBase58().substring(0,18)));
  // const [accountToCreate, bump] = await web3.PublicKey.findProgramAddress(
  //   [seed],
  //   PROGRAM_ID
  // );
  // console.log("---->", web3.PublicKey.isOnCurve(accountToCreate.toBytes()), firstPassedVote, accountToCreate.toBase58(), bump);
  // console.log({seed, bump})

  const accountToCreate = anchor.web3.Keypair.fromSeed(firstPassedVote.tokenInfo.splTokenProgramAddress.toBytes());
  return await program.rpc.checkVote(firstPassedVote.tokenInfo.splTokenProgramAddress, {
    accounts: {
      pendingTokensAccount,
      accountToCreate: accountToCreate.publicKey,
      user: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers: [accountToCreate],
  });
}

export async function cleanupExpired(wallet: WalletContextState, connection: web3.Connection): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  return await program.rpc.cleanup({
    accounts: {
      pendingTokensAccount,
    }
  });
}