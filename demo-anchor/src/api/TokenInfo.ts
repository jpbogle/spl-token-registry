import {  PublicKey } from '@solana/web3.js';

export type TokenInfo = {
  splTokenProgramAddress: PublicKey,
  tokenName: string,
  tokenSymbol: string,
  tokenImageUrl: string,
  tags: Array<string>,
}
