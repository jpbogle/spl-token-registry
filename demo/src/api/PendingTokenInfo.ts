import * as BufferLayout from 'buffer-layout';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { TokenInfo, TOKEN_INFO_SIZE } from './TokenInfo';

export const PendingTokenInfoLayout: BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.blob(TOKEN_INFO_SIZE, "token_info"),
    BufferLayout.blob(8, "expiration"),
    BufferLayout.blob(8, "votes"),
  ],
);

export class PendingTokenInfo {
  public tokenInfo: TokenInfo;
  public expiration: number;
  public votes: number;

  constructor(decoded) {
    this.tokenInfo = TokenInfo.fromBytes(decoded.token_info);
    this.expiration = decoded.expiration[0];
    this.votes = decoded.votes[0];

  }

  static getLayout() : BufferLayout.Structure {
    return PendingTokenInfoLayout;
  }

  static fromBytes(data): PendingTokenInfo { 
    const decoded = this.getLayout().decode(data);
    return new PendingTokenInfo(decoded);
  }
}