import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import * as spl from "@solana/spl-token";
import idl from './spl_token_registry.json';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenInfo } from './TokenInfo';
import { PendingTokenAccount } from './PendingTokenInfo';
import { EnvironmentContextValues } from 'common/Connection';

// const PROGRAM_ID = new web3.PublicKey(idl.metadata.address);
// let VOTING_TOKEN_MINT = new web3.PublicKey("517PfUgFP3f52xHQzjjBfbTTCSmSVPzo5JeeiQEE9KWs");
// @ts-ignore
const PROGRAM_IDL : anchor.Idl = idl;
const PENDING_TOKEN_INFOS_SEED = "pending_token_infos";
const CONFIRM_OPTIONS: web3.ConfirmOptions = {
  preflightCommitment: "processed",
}

export async function findAssociatedTokenAddress(
  walletAddress: web3.PublicKey,
  mintAddress: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (await web3.PublicKey.findProgramAddress(
      [
          walletAddress.toBuffer(),
          spl.TOKEN_PROGRAM_ID.toBuffer(),
          mintAddress.toBuffer(),
      ],
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
  ))[0];
}

export async function getAccountInfo(ctx: EnvironmentContextValues, account: web3.PublicKey): Promise<spl.AccountInfo> {
  const token = new spl.Token(ctx.connection, ctx.environment.votingTokenMint, spl.TOKEN_PROGRAM_ID, null);
  return await token.getAccountInfo(account);
}

export async function getMintInfo(ctx: EnvironmentContextValues): Promise<spl.MintInfo> {
  const token = new spl.Token(ctx.connection, ctx.environment.votingTokenMint, spl.TOKEN_PROGRAM_ID, null);
  return await token.getMintInfo();
}

export async function getPendingTokenAccountPubkey(programId: web3.PublicKey): Promise<[web3.PublicKey, number]> {
  console.log(`Getting pending token infos PDA address for program ${programId} and seed ${PENDING_TOKEN_INFOS_SEED}`);
  let [seededPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(PENDING_TOKEN_INFOS_SEED)],
    programId,
  );
  return [seededPubkey, bump];
}

export async function createVotingTokenAccount(wallet: WalletContextState, ctx: EnvironmentContextValues): Promise<web3.PublicKey> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const associatedAddress = await findAssociatedTokenAddress(wallet.publicKey, ctx.environment.votingTokenMint);
  await wallet.sendTransaction(
    new web3.Transaction().add(
      spl.Token.createAssociatedTokenAccountInstruction(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        ctx.environment.votingTokenMint,
        associatedAddress,
        wallet.publicKey,
        wallet.publicKey,
      ),
    ),
    ctx.connection
  );

  return associatedAddress;
}

export async function initMint(wallet: WalletContextState, ctx: EnvironmentContextValues): Promise<web3.PublicKey> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const tokenMintPayer = anchor.web3.Keypair.generate();
  const airdropSignature = await ctx.connection.requestAirdrop(tokenMintPayer.publicKey, web3.LAMPORTS_PER_SOL * 4);
  await ctx.connection.confirmTransaction(airdropSignature);
  const newMint = await spl.Token.createMint(
    provider.connection,
    tokenMintPayer,
    tokenMintPayer.publicKey,
    tokenMintPayer.publicKey,
    2,
    spl.TOKEN_PROGRAM_ID,
  );
  console.log("Mint created", newMint.publicKey.toBase58());

  // mint tokens to user
  const voterTokenAccount = await newMint.createAssociatedTokenAccount(provider.wallet.publicKey);
  await newMint.mintTo( 
    voterTokenAccount,
    tokenMintPayer,
    [],
    1000,
  );
  console.log(`Account ${voterTokenAccount.toBase58()} received 1000 voting tokens mint ${newMint.publicKey.toBase58()}`);
  return newMint.publicKey
}

export async function initialize(wallet: WalletContextState, ctx: EnvironmentContextValues): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  
  // const token = new spl.Token(
  //   provider.ctx.connection,
  //   votingTokenMint.publicKey,
  //   spl.TOKEN_PROGRAM_ID,
  //   {
  //     publicKey: provider.wallet.publicKey,
  //     secretKey: Buffer.from("KKxQMhVRUYBGetdHV9Suf1XZjb7yygNu3nYRfBHpovoi2oyL99bY4SejLnQY5tzr7RCWqG4degCH7xuZzHQgAdG"),
  //   }
  // );

  // create token account
  const tokenMintPayer = anchor.web3.Keypair.generate();
  if (!ctx.environment.votingTokenMint) {
    const airdropSignature = await ctx.connection.requestAirdrop(tokenMintPayer.publicKey, web3.LAMPORTS_PER_SOL * 4);
    await ctx.connection.confirmTransaction(airdropSignature);
    const newMint = await spl.Token.createMint(
      provider.connection,
      tokenMintPayer,
      tokenMintPayer.publicKey,
      tokenMintPayer.publicKey,
      2,
      spl.TOKEN_PROGRAM_ID,
    );
    ctx.environment.votingTokenMint = newMint.publicKey;
    console.log("Mint created", ctx.environment.votingTokenMint);

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
      votingTokenMint: ctx.environment.votingTokenMint,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    // signers: [votingTokenMint],
  });
}

export async function proposeToken(wallet: WalletContextState, ctx: EnvironmentContextValues, tokenInfo: TokenInfo): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  return await program.rpc.propose(tokenInfo, {
    accounts: {
      pendingTokensAccount,
    },
  });
}

export async function voteFor(wallet: WalletContextState, ctx: EnvironmentContextValues, splTokenProgramAddress: web3.PublicKey, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  const voterTokenAccount = await findAssociatedTokenAddress(provider.wallet.publicKey, ctx.environment.votingTokenMint);
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

export async function getTokenInfo(ctx: EnvironmentContextValues, splTokenProgramAddress: web3.PublicKey): Promise<TokenInfo> {
  const provider = new anchor.Provider(ctx.connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const accountToCreate = anchor.web3.Keypair.fromSeed(splTokenProgramAddress.toBytes());
  // @ts-ignore
  return await program.account.tokenInfoAccount.fetch(accountToCreate.publicKey);
}

export async function getTokenInfos(ctx: EnvironmentContextValues): Promise<Array<TokenInfo>> {
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  const provider = new anchor.Provider(ctx.connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const accounts = await ctx.connection.getProgramAccounts(ctx.environment.programId);
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

export async function getPendingTokenAccount(ctx: EnvironmentContextValues): Promise<PendingTokenAccount> {
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  const provider = new anchor.Provider(ctx.connection, null, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount)
  // @ts-ignore
  console.log(account.votingTokenMint.toBase58());
  // @ts-ignore
  return account;
}

export async function checkVote(wallet: WalletContextState, ctx: EnvironmentContextValues, mintAddress: web3.PublicKey, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);

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

export async function withdrawVotingBalace(wallet: WalletContextState, ctx: EnvironmentContextValues, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  const voterTokenAccount = await findAssociatedTokenAddress(provider.wallet.publicKey, ctx.environment.votingTokenMint);
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

export async function cleanupExpired(wallet: WalletContextState, ctx: EnvironmentContextValues, votingTokenMint: web3.PublicKey): Promise<string> {
  if (!wallet.connected) throw Error("Wallet not connected");
  const provider = new anchor.Provider(ctx.connection, wallet, CONFIRM_OPTIONS);
  const program = new anchor.Program(PROGRAM_IDL, ctx.environment.programId, provider);
  const [pendingTokensAccount, _bump] = await getPendingTokenAccountPubkey(ctx.environment.programId);
  return await program.rpc.cleanup({
    accounts: {
      pendingTokensAccount,
      votingTokenMint,
    }
  });
}