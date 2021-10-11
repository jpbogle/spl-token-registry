const assert = require("assert");
const anchor = require("@project-serum/anchor");
const web3 = require('@solana/web3.js');
const spl = require("@solana/spl-token");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

describe("spl-token-registry", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SplTokenRegistry;
  // const votingTokenMint = anchor.web3.Keypair.generate();
  let votingTokenMint = null;
  let voterTokenAccount = null;

  it("Initializes pending token accounts", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );

    votingTokenMint = await spl.Token.createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.payer.publicKey,
      null,
      2,
      TOKEN_PROGRAM_ID
    );

    try {
      await program.rpc.initialize({ seed, bump }, {
        accounts: {
          pendingTokensAccount,
          user: provider.wallet.publicKey,
          votingTokenMint: votingTokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        // signers: [votingTokenMint],
      });
      const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
      assert.ok(account.votingTokenMint.equals(votingTokenMint.publicKey));
    } catch (err) {
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
        mintAddress: new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
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
      const UTC_seconds_now = Math.floor(Date.now() / 1000);

      // check expiration
      assert.ok(account.pendingTokenInfos[0].expiration > UTC_seconds_now);
      assert.ok(account.pendingTokenInfos[0].expiration <= UTC_seconds_now + (60*60*24*7));
    } catch (err) {
      console.log("Error: ", err);
      throw Error(err);
    }
  });

  it("Does now allow proposing the same token twice", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.propose({
        mintAddress: new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
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
    
    // create token account
    const token = new spl.Token(
      provider.connection,
      votingTokenMint.publicKey,
      TOKEN_PROGRAM_ID,
      provider.wallet.payer,
    );
    
    // mint tokens to user
    voterTokenAccount = await token.createAssociatedTokenAccount(provider.wallet.publicKey);
    await token.mintTo(
      voterTokenAccount,
      provider.wallet.publicKey,
      [],
      100,
    );

    await program.rpc.voteFor(new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
      accounts: {
        pendingTokensAccount,
        voterTokenAccount,
        user: provider.wallet.publicKey,
        votingTokenMint: votingTokenMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    });
    const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
    assert.equal(account.pendingTokenInfos[0].votes, 100);
  });

  it("Does not allow voting for a token that doesnt exist", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.voteFor(new web3.PublicKey("NTFuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
        accounts: {
          pendingTokensAccount,
          voterTokenAccount,
          user: provider.wallet.publicKey,
          votingTokenMint: votingTokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,  
        }
      });
      throw Error("Expected to get an error");
    } catch (err) {
      assert.equal(err.code, 301);
    }
  });

  // it("Does not allow for voting more than tokens you have", async () => {
  //   const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
  //   const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
  //     [seed],
  //     program.programId
  //   );
    
  //   // create token account
  //   const token = new spl.Token(
  //     provider.connection,
  //     votingTokenMint.publicKey,
  //     TOKEN_PROGRAM_ID,
  //     provider.wallet.payer,
  //   );

  //   try {
  //     await program.rpc.voteFor(new anchor.BN(10000), new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
  //       accounts: {
  //         pendingTokensAccount,
  //         voterTokenAccount,
  //         user: provider.wallet.publicKey,
  //         votingTokenMint: votingTokenMint.publicKey,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //       }
  //     });
  //     throw Error("Expected to get an error");
  //   } catch (err) {
  //     assert.equal(err.code, 143);
  //   }
  //   const account = await program.account.pendingTokenInfos.fetch(pendingTokensAccount);
  //   assert.equal(account.pendingTokenInfos[0].votes, 100);
  // });

  it("Does not allow for voting for the same thing again", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.voteFor(new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"), {
        accounts: {
          pendingTokensAccount,
          voterTokenAccount,
          user: provider.wallet.publicKey,
          votingTokenMint: votingTokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      });
    } catch(err) {
      assert.equal(err.code, 302);
    }
  });

  it("Does not allow for withdrawing voting balance while voting", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.withdrawVotingBalace({
        accounts: {
          pendingTokensAccount,
          voterTokenAccount,
          user: provider.wallet.publicKey,
          votingTokenMint: votingTokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      });
    } catch(err) {
      assert.equal(err.code, 303);
    }
  });

  it("Does not allow for withdrawing voting balance while voting", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    try {
      await program.rpc.withdrawVotingBalace({
        accounts: {
          pendingTokensAccount,
          voterTokenAccount,
          user: provider.wallet.publicKey,
          votingTokenMint: votingTokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      });
    } catch(err) {
      assert.equal(err.code, 303);
    }
  });

  it("Does check vote", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    const publicKeyToVoteFor = new web3.PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt");
    const accountToCreate = anchor.web3.Keypair.fromSeed(publicKeyToVoteFor.toBytes());
    await program.rpc.checkVote(publicKeyToVoteFor, {
      accounts: {
        pendingTokensAccount,
        accountToCreate: accountToCreate.publicKey,
        user: program.provider.wallet.publicKey,
        votingTokenMint: votingTokenMint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [accountToCreate],
    })
  });

  it("Does allow cleanup to run", async () => {
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("pending_token_infos"));
    const [pendingTokensAccount, bump] = await web3.PublicKey.findProgramAddress(
      [seed],
      program.programId
    );
    await program.rpc.cleanup({
      accounts: {
        pendingTokensAccount,
        votingTokenMint: votingTokenMint.publicKey,
      }
    });
  });
});
