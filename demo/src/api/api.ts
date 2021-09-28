/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  TransactionSignature,
} from '@solana/web3.js';
import { PendingTokenInfo } from './PendingTokenInfo';
import { PendingTokenInfos } from './PendingTokenInfos';
import { TokenInfo, TokenInfoLayout } from './TokenInfo';

import {
  getPayer,
  getRpcUrl,
  newAccountWithLamports,
} from './utils';

const PROGRAM_ID = new PublicKey('GEDXc3gaDgbmRwEyfQbxVaJBKGR43bioD3xmdqhQmnXL');

/**
 * The expected size of each program account.
 */
const PROGRAM_ACCOUNT_SIZE = 1024;
let payerKeyPair: Keypair;

export async function connect(): Promise<Connection> {
  console.log('Connecting...');
  const rpcUrl = await getRpcUrl();
  const connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
  return connection;
}

export async function getAccount(connection: Connection): Promise<Keypair>{
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', version);

  // Calculate the cost of sending transactions
  const { feeCalculator } = await connection.getRecentBlockhash();
  const fees = feeCalculator.lamportsPerSignature * 100;
  if (!payerKeyPair) {
    payerKeyPair = await Keypair.fromSecretKey(Buffer.from([148, 161, 116, 163, 111, 145, 196, 82, 63, 187, 73, 114, 193, 173, 170, 184, 193, 80, 39, 3, 17, 22, 168, 70, 206, 56, 25, 189, 185, 99, 90, 224, 92, 199, 15, 17, 97, 194, 228, 34, 118, 120, 179, 0, 255, 168, 219, 68, 26, 99, 15, 98, 215, 156, 179, 241, 172, 196, 34, 49, 206, 242, 211, 108]));
    // payerKeyPair = await Keypair.generate();;
  }

  // Airdrop if needed
  console.log('Using keypair: ', payerKeyPair.publicKey.toBase58(), payerKeyPair.secretKey);
  let lamports = await connection.getBalance(payerKeyPair.publicKey);
  if (lamports < fees) {
    console.log(`Requesting airport of ${fees - lamports} for payerKeyPair ${payerKeyPair.publicKey.toBase58()}`);
    const signature = await connection.requestAirdrop(
      payerKeyPair.publicKey,
      lamports,
    );
    await connection.confirmTransaction(signature);
  }

  // Check balance
  lamports = await connection.getBalance(payerKeyPair.publicKey);
  console.log(
    'Using payerKeyPair',
    payerKeyPair.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees',
  );

  // Check if pending token account has been initialized
  const pendingTokensAccountPubkey = await getPendingTokenAccountPubkey();
  const pendingTokenAccount = await connection.getAccountInfo(pendingTokensAccountPubkey);
  if (pendingTokenAccount === null) {
    console.log(`Account not found at seedKey (${pendingTokensAccountPubkey}) initializing now`);
    await initPendingTokensAccount(connection, payerKeyPair);
  }

  return payerKeyPair;
}

export async function getPendingTokenAccountPubkey(): Promise<PublicKey> {
  const seed = "pending_token_infos";
  console.log(`Getting pending token infos PDA address for program ${PROGRAM_ID} and seed ${seed}`);
  let [seededPubkey, n] = await PublicKey.findProgramAddress(
    [Buffer.from(seed)],
    PROGRAM_ID,
  );
  return seededPubkey;
}

export async function initPendingTokensAccount(connection: Connection, payer: Keypair): Promise<TransactionSignature> {
  console.log('Initializing pending tokens account from payer', payer);
  const seededPubkey = await getPendingTokenAccountPubkey();
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: payer.publicKey, isSigner: false, isWritable: true},
      {pubkey: new PublicKey(seededPubkey), isSigner: false, isWritable: true},
      {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([0b0, 0x2]),
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

export async function proposeToken(
  connection: Connection,
  payer: Keypair,
  address: string,
  name: string,
  symbol: string,
  imageUrl: string,
  tags: string,
): Promise<TransactionSignature> {
  console.log(`Proposing token to account ${payer.publicKey.toBase58()}`);
  console.log(name, symbol, imageUrl);
  const b = Buffer.alloc(512);
  b.fill(0);
  const addressb = Buffer.alloc(32);
  addressb.write(address);
  const nameb = Buffer.alloc(32);
  nameb.write(name);
  const symbolb = Buffer.alloc(32);
  symbolb.write(symbol);
  const image_urlb = Buffer.alloc(160);
  image_urlb.write(imageUrl);
  const tagsb = Buffer.alloc(128);
  tagsb.write(tags);

  TokenInfoLayout.encode({
    spl_program_address: addressb,
    name: nameb,
    symbol: symbolb,
    image_url: image_urlb,
    tags: tagsb,
   }, b)
  const pendingTokensAccountPubkey = await getPendingTokenAccountPubkey();
  const instruction = new TransactionInstruction({
    keys: [{pubkey: pendingTokensAccountPubkey, isSigner: false, isWritable: true}],
    programId: PROGRAM_ID,
    data: Buffer.concat([Buffer.from([0b0, 0b0]), b]),
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

export async function voteForToken(
  connection: Connection,
  payer: Keypair,
  amount: number,
  addressKeyToVoteFor: PublicKey,
  ): Promise<TransactionSignature> {
  const seededPubkey = await getPendingTokenAccountPubkey();
  console.log(`Voting for token ${addressKeyToVoteFor.toBase58()} in account ${seededPubkey.toBase58()}`);
  console.log(Buffer.from(PROGRAM_ID.toBase58()).length)
  const instruction = new TransactionInstruction({
    keys: [{pubkey: seededPubkey, isSigner: false, isWritable: true}],
    programId: PROGRAM_ID,
    data: Buffer.concat([
      Buffer.from([0b0, 0b1]),                            // version, instruction id
      Buffer.from([amount]),               // amount
      Buffer.from(addressKeyToVoteFor.toBytes()),                  // public key to vote for
    ]),
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

export async function getTokenInfo(connection: Connection, seededAccount: PublicKey): Promise<TokenInfo> {
  return TokenInfo.load(connection, seededAccount);
}


export async function getTokenInfos(connection: Connection,): Promise<Array<TokenInfo>> {
  const pendingTokensAccountPubkey = await getPendingTokenAccountPubkey();
  const accounts = await connection.getProgramAccounts(PROGRAM_ID);
  const filteredAccounts = accounts.filter(({ pubkey, account }) => {
    return pubkey.toBase58() !== pendingTokensAccountPubkey.toBase58();
  });
  const tokenInfos = filteredAccounts.map(({ pubkey, account }) => {
    return TokenInfo.fromBytes(account.data);
  });
  return tokenInfos;
}

export async function getPendingTokenInfos(connection: Connection): Promise<Array<PendingTokenInfo>> {
  const pendingTokensAccountPubkey = await getPendingTokenAccountPubkey();
  const account = await connection.getAccountInfo(pendingTokensAccountPubkey);
  return PendingTokenInfos.fromBytes(account.data);
}