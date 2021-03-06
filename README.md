## SPL Token Registry

![SPL Token Registry](demo/public/assets/logo4.png "SPL Token Registry")

## Inspiration
Currently in the solana ecosystem there is no trustworthy on-chain source of truth for the existing SPL tokens. There is token-list on github (https://github.com/solana-labs/token-list/blob/main/src/tokens/solana.tokenlist.json) that someone can submit a pull request to add a new mint that includes the mint program address along with other metadata about like token like name, symbol, image, and tags, but this is stored on github and governed by the repo owners. In the context of defi applications like Serum, Mango, Raydium and others, the source of truth for this metadata about the token must be gathered from somewhere and reading from this github list is not a scaeleable decentralized approach. Instead I am proposing an on-chain registry that stores this information and is govered by a voting token (SVOTE) - solana vote.

## What it does
The SPL Token Registry stores the metadata for a token mint in a program owned account. It also has a voting system in place where anyone can propose a new token by inputting their desired mint address and associated metadata. When a user proposes a new token a new vote is initiated and there is an expiration for that vote. Holders of the voting token (SVOTE) can contribute votes to that pending token according to the number of voting tokens they have. If the vote receives enough votes before expiration, the vote can be executed and the token becomes officially listed on the list of tokens. If the token does not receive enough votes, it will expire and be removed from the pending list of votes. 

The SPL token registry also comes with a typescript API for integrating with this program and query the list of official tokens. This can be used by anyone who needs to have a trustworthy source of this data in their application. Querying this at runtime in your defi app will also allow the app to dynamically stay up to date with the official governed list of approved tokens on Solana.

## How we built it
Originally, I explored the solana ecosystem and built the simple model that stores token information including name, mint address, image, symbol and tags from scratch using native solana bindings. Referring to SPL library and serum I built custom instruction dispatch and account serialize and deserialization. This was a great experience to get familiar with Solana, but ultimately I knew that at some point using anchor (https://github.com/project-serum/anchor) would be the way forward to ensure that the program was easily testable, readable and auditable. Once I felt comfortable understanding the internals, I rebuilt this program using anchor. Using anchor also simplified a lot of the more complex things about solana like PDAs and CPIs. 

In the second phase of the project I went to build the voting system for proposing and voting on new token information. The program has a PDA that stores pending votes and keeps track of the expiration and votes and vote contributors. There is then a permissionless crank that can be executed to check if the vote has passed or expired and accordingly deletes the vote if its expired or creates a new account that persists that token information. The account address can be derived from the mint address so you can look them up directly, or you can use the javascript API which gets all accounts owned by the program and deserializes them into token info objects. In order to ensure voters can vote on multiple votes at a time but cannot transfer their tokens, the voter must transfer ownership of their voting account holding their tokens to the program while they are actively participating in any votes.

## Challenges we ran into
Building without anchor had a host of challenges around serialization and deserialization of accounts and just the learning curve to understanding the solana program model and how best to model this program. For example, by storing all pending votes in a single PDA, it means we can display them easily and check votes and contributors across all pending votes easily but it also means that the size of the pending votes account is limited.

The biggest challenge in the voting protocol was probably weighing the tradeoff that I wanted someone with voting power to be able to vote on multiple proposals at once but it was tricky to allow for this while also preventing someone from voting once, transfering their voting tokens to someone else and then having that person vote again. The solution I came up with for this was either transfering the token account ownership to the program while you are participating in a vote so that you cannot transfer funds. Alternatively the program could have freeze authority, and freeze the voters token account. I made a PR to allow for setting freeze authorities and freezing accounts with anchor, but went with ownership transfer because it allows for the potential to vote with tokens that the program may not be freeze authority of. Then, when someone wants to take ownership back of their voting account, they execute the withdraw_voting_balance instruction which will check if that wallet is the former owner of the account (associated account) and also ensure that user is not currently participating in any active votes, and if so it will transfer the ownership back. 

## Accomplishments that we're proud of
I am proud of the speed at which I developed this project. Being new to solana I made a ton of progress understanding the programming model and building out this program from the ground up the first time around. Doing this before using the anchor framework gave me a good understanding on the internals of anchor and the value it can provide to a solana developer.

## Testing instructions
```
git clone https://github.com/jpbogle/spl-token-registry.git
cd spl-token-registry/program/tests
npm install
cd ..
anchor test
```

## What's next for SPL Token Registry
SPL Token Registry can be the source of truth for token metadata on chain. It is currently deployed on devnet and testnet and can be deployed to mainnet and voting tokens can be minted and airdropped to those willing to participate in governance of the token registry. The next steps are to find a community of people that understand the value of having an on-chain registry and are willing to participate in governance of the platform. Additional features that need to be build are ways to vote to remove tokens, and the UI should be tested with some more people to ensure its ease of use. In addition the libraries for getting this token information can be improved and integrated with projects around the solana ecosystem. If the registry gets very large an indexing protocol also could be considered. 