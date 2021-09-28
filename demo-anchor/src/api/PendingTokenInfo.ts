import {  PublicKey } from '@solana/web3.js';
import { TokenInfo } from './TokenInfo';
import * as anchor from '@project-serum/anchor';

export type PendingTokenInfo = {
  tokenInfo: TokenInfo,
  votes: anchor.BN,
  expiration: anchor.BN,
}