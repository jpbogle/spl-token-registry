import * as BufferLayout from 'buffer-layout';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { PendingTokenInfo } from './PendingTokenInfo';


export class PendingTokenInfos {
  public pending_token_infos: Array<PendingTokenInfo>;

  static fromBytes(data): Array<PendingTokenInfo> { 
    const stepSize = 1024;
    let start = 0;
    const result = [];
    
    while (data[start] !== 0) {
      const chunk = data.slice(start, start + stepSize);
      result.push(PendingTokenInfo.fromBytes(chunk));
      start += stepSize;
    }
    console.log(result);
    return result;
  }
}