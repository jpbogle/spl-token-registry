const assert = require("assert");
const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;
const web3 = require('@solana/web3.js');

describe("spl-token-registry", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SplTokenRegistry;
  it("Initializes pending token accounts", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.initialize({ seed, bump }, {
        accounts: {
          pendingTokensAccount,
          user: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      });
      const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
      assert.ok(account.pendingTokenInfos != null);
    } catch (err) {
      console.log("Error: ", err);
      throw Error(err);
    }
  });

  it("Allows for new pending token to be added", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.propose({
        splTokenProgramAddress: new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
        tokenName: "Serum",
        tokenSymbol: "SRM",
        tokenImageUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
        tags: ["defi", "dex"],
      }, {
        accounts: {
          pendingTokensAccount,
        }
      });
      const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
      assert.ok(account.pendingTokenInfos.length > 0);
      assert.equal(account.pendingTokenInfos[0].votes, 0);
    } catch (err) {
      console.log("Error: ", err);
      throw Error(err);
    }
  });

  it("Does now allow voting for a token twice for new pending token to be added", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.propose({
        splTokenProgramAddress: new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
        tokenName: "Serum2",
        tokenSymbol: "SRM2",
        tokenImageUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
        tags: ["defi", "dex"],
      }, {
        accounts: {
          pendingTokensAccount,
        }
      });
      throw Error("Expected to get an error");
    } catch (err) {
      assert.equal(err.code, 300);
    }
  });

  it("Allows for voting for a token", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.voteFor(new anchor.BN(100), new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
        accounts: {
          pendingTokensAccount,
        }
      });
      const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
      assert.equal(account.pendingTokenInfos[0].votes, 100);
    } catch (err) {
      console.log("Error: ", err);
      throw Error(err);
    }
  });

  it("Does now allow voting for a token that doesnt exist", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.voteFor(new anchor.BN(100), new web3.PublicKey("NTFuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
        accounts: {
          pendingTokensAccount,
        }
      });
      throw Error("Expected to get an error");
    } catch (err) {
      assert.equal(err.code, 301);
    }
  });
});
