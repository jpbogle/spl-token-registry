import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import * as spl from "@solana/spl-token";
import idl from './spl_token_registry.json';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenInfo } from './TokenInfo';
import { PendingTokenAccount } from './PendingTokenInfo';
import { TOKEN_PROGRAM_ID } from '@project-serum/serum/lib/token-instructions';

const PROGRAM_ID = new web3.PublicKey(idl.metadata.address);
let VOTING_TOKEN_MINT = new web3.PublicKey("517PfUgFP3f52xHQzjjBfbTTCSmSVPzo5JeeiQEE9KWs");
// @ts-ignore
const PROGRAM_IDL : anchor.Idl = idl;
const PENDING_TOKEN_INFOS_SEED = "pending_token_infos";
const CONFIRM_OPTIONS: web3.ConfirmOptions = {
  preflightCommitment: "processed",
}

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: web3.PublicKey = new web3.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

export async function findAssociatedTokenAddress(
  walletAddress: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (await web3.PublicKey.findProgramAddress(
      [
          walletAddress.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          VOTING_TOKEN_MINT.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  ))[0];
}

export async function getAccountInfo(connection: web3.Connection, account: web3.PublicKey): Promise<spl.AccountInfo> {
  const token = new spl.Token(connection, VOTING_TOKEN_MINT, TOKEN_PROGRAM_ID, null);
  return await token.getAccountInfo(account);
}

export async function getMintInfo(connection: web3.Connection): Promise<spl.MintInfo> {
  const token = new spl.Token(connection, VOTING_TOKEN_MINT, TOKEN_PROGRAM_ID, null);
  return await token.getMintInfo();
}

export async function getPendingTokenAccountPubkey(): Promise<[web3.PublicKey, number]> {
  console.log(`Getting pending token infos PDA address for program ${PROGRAM_ID} and seed ${PENDING_TOKEN_INFOS_SEED}`);
  let [seededPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(PENDING_TOKEN_INFOS_SEED)],
    PROGRAM_ID,
  );
  return [seededPubkey, bump];
}

export async function initialize(wallet: WalletContextState, connection: web3.Connection): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey();
  
  // const token = new spl.Token(
  //   provider.connection,
  //   votingTokenMint.publicKey,
  //   spl.TOKEN_PROGRAM_ID,
  //   {
  //     publicKey: provider.wallet.publicKey,
  //     secretKey: Buffer.from("KKxQMhVRUYBGetdHV9Suf1XZjb7yygNu3nYRfBHpovoi2oyL99bY4SejLnQY5tzr7RCWqG4degCH7xuZzHQgAdG"),
  //   }
  // );

  // create token account
  const tokenMintPayer = anchor.web3.Keypair.generate();
  if (!VOTING_TOKEN_MINT) {
    const airdropSignature = await connection.requestAirdrop(tokenMintPayer.publicKey, web3.LAMPORTS_PER_SOL * 4);
    await connection.confirmTransaction(airdropSignature);
    const newMint = await spl.Token.createMint(
      provider.connection,
      tokenMintPayer,
      tokenMintPayer.publicKey,
      tokenMintPayer.publicKey,
      2,
      spl.TOKEN_PROGRAM_ID,
    );
    VOTING_TOKEN_MINT = newMint.publicKey;
    console.log("Mint created", VOTING_TOKEN_MINT);

    // mint tokens to user
    const voterTokenAccount = await newMint.createAssociatedTokenAccount(provider.wallet.publicKey);
    await newMint.mintTo( 
      voterTokenAccount,
      tokenMintPayer,
      [],
      1000,
    );
    console.log(`Account (${voterTokenAccount.toBase58()} received 1000 voting tokens`);
  }

  return program.rpc.initialize({ seed: anchor.utils.bytes.utf8.encode(PENDING_TOKEN_INFOS_SEED), bump }, {
    accounts: {
      pendingTokensAccount,
      user: provider.wallet.publicKey,
      votingTokenMint: VOTING_TOKEN_MINT,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    // signers: [votingTokenMint],
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

export async function voteFor(wallet: WalletContextState, connection: web3.Connection, splTokenProgramAddress: web3.PublicKey, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const voterTokenAccount = await findAssociatedTokenAddress(provider.wallet.publicKey);
  return program.rpc.voteFor(splTokenProgramAddress, {
    accounts: {
      pendingTokensAccount,
      voterTokenAccount,
      user: provider.wallet.publicKey,
      votingTokenMint: votingTokenMint,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
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

export async function getPendingTokenAccount(connection: web3.Connection): Promise<PendingTokenAccount> {
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const provider = new anchor.Provider(connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount)
  // @ts-ignore
  console.log(account.votingTokenMint.toBase58());
  // @ts-ignore
  return account;
}

export async function checkVote(wallet: WalletContextState, connection: web3.Connection, mintAddress: web3.PublicKey, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();

  // const seed = Buffer.from(anchor.utils.bytes.utf8.encode(firstPassedVote.tokenInfo.splTokenProgramAddress.toBase58().substring(0,18)));
  // const [accountToCreate, bump] = await web3.PublicKey.findProgramAddress(
  //   [seed],
  //   PROGRAM_ID
  // );
  // console.log("---->", web3.PublicKey.isOnCurve(accountToCreate.toBytes()), firstPassedVote, accountToCreate.toBase58(), bump);
  // console.log({seed, bump})

  const accountToCreate = anchor.web3.Keypair.fromSeed(mintAddress.toBytes());
  return program.rpc.checkVote(mintAddress, {
    accounts: {
      pendingTokensAccount,
      accountToCreate: accountToCreate.publicKey,
      user: program.provider.wallet.publicKey,
      votingTokenMint,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers: [accountToCreate],
  })
}

export async function withdrawVotingBalace(wallet: WalletContextState, connection: web3.Connection, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  const voterTokenAccount = await findAssociatedTokenAddress(provider.wallet.publicKey);
  return await program.rpc.withdrawVotingBalace({
    accounts: {
      pendingTokensAccount,
      voterTokenAccount,
      user: provider.wallet.publicKey,
      votingTokenMint,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
    }
  });
}

export async function cleanupExpired(wallet: WalletContextState, connection: web3.Connection, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, PROGRAM_ID, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey();
  return await program.rpc.cleanup({
    accounts: {
      pendingTokensAccount,
      votingTokenMint,
    }
  });
}