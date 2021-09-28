import * as BufferLayout from 'buffer-layout';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

export const TOKEN_INFO_SIZE = 512;

export const TokenInfoLayout: BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.blob(32, "spl_program_address"),
    BufferLayout.blob(32, "name"),
    BufferLayout.blob(32, "symbol"),
    BufferLayout.blob(160, "image_url"),
    BufferLayout.blob(128, "tags"),
    BufferLayout.blob(128),
  ],
);

export class TokenInfo {
  public id: string;
  public spl_program_address: PublicKey;
  public name: string;
  public symbol: string;
  public image_url: string;
  public tags: Array<string>;

  constructor(decoded) {
    this.spl_program_address = new PublicKey(decoded.spl_program_address);
    this.id = this.spl_program_address.toBase58();
    this.name = TokenInfo.parseStringBuffer(decoded.name);
    this.symbol = TokenInfo.parseStringBuffer(decoded.symbol);
    this.image_url = TokenInfo.parseStringBuffer(decoded.image_url);
    this.tags = TokenInfo.parseStringBuffer(decoded.tags).split(',').filter((i) => i.length > 1);
  }

  static parseStringBuffer(buf) {
    return Buffer.from(buf).toString().replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, "");
  }

  static getLayout() : BufferLayout.Structure {
    return TokenInfoLayout;
  }

  static async load(
    connection: Connection,
    address: PublicKey,
  ) {
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo === null) {
      throw "Load error account is null";
    }
    const { owner, data } = accountInfo;
    const decoded = this.getLayout().decode(data);
    return new TokenInfo(decoded);
  }

  static fromBytes(data): TokenInfo { 
    const decoded = this.getLayout().decode(data);
    return new TokenInfo(decoded);
  }
}