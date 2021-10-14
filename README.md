## SPL Token Registry

![SPL Token Registry](demo/public/assets/logo4.png "SPL Token Registry")

## Inspiration
Currently in the solana ecosystem there is no trustworthy on-chain source of truth for the existing SPL tokens. There is token-list on github (https://github.com/solana-labs/token-list/blob/main/src/tokens/solana.tokenlist.json) that someone can submit to add a new mint that includes the mint program address along with other metadata about like token like name, symbol, image, and tags, but this is stored on github and owned by the repo owners. In the context of defi applications like Serum and others, the source of truth for this metadata about the token must be gathered from somewhere and reading from this github list is not a scaeleable decentralized approach. Instead I am proposing an on-chain registry that stores this information and is govered by a voting token (SVOTE) - solana vote.

## What it does
The SPL Token Registry stores the metadata for a token mint in a program owned account. It also has a voting system in place where anyone can propose a new token by inputting their desired mint address and associated metadata. When a user proposes a new token a new vote is initiated and there is an expiration for that vote. Holders of the voting token (SVOTE) can contribute votes to that pending token according to the number of voting tokens they have. If the vote receives enough votes before expiration, the vote can be executed and the token becomes officially listed on the list of tokens. If the token does not receive enough votes, it will expire and be removed from the pending list of votes. 

The SPL token registry also comes with a typescript API for integrating with this program and query the list of official tokens. This can be used by anyone who needs to have a trustworthy source of this data in their application. Querying this at runtime in your defi app will also allow the app to dynamically stay up to date with the official governed list of approved tokens on Solana.

## How we built it
Originally, I explored the solana ecosystem and built the simple model that stores token information including name, mint address, image, symbol and tags. 

## Challenges we ran into

## Accomplishments that we're proud of

## What we learned

## What's next for SPL Token Registry
