import {  PublicKey } from '@solana/web3.js';

export type TokenInfo = {
  mintAddress: PublicKey,
  tokenName: string,
  tokenSymbol: string,
  tokenImageUrl: string,
  tags: Array<string>,
}
