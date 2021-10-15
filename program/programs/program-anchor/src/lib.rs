use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
use anchor_spl::token::{self, SetAuthority, Mint, Token, TokenAccount};
use spl_token::instruction::AuthorityType;
pub use spl_associated_token_account::{get_associated_token_address};

declare_id!("ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz");

const REQUIRED_VOTE_PERCENTAGE: f64 = 0.5;
const DEFAULT_VOTE_EXPIRATION: i64 = 60*60*24*7;

#[program]
mod spl_token_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _seeds: Seeds) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        pending_tokens_account.voting_token_mint = ctx.accounts.voting_token_mint.key();
        Ok(())
    }

    pub fn propose(ctx: Context<Propose>, ix: ProposeInstruction) -> ProgramResult {
        let token_info = ix.token_info;
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        if pending_tokens_account.pending_token_infos.iter().any(|t| t.token_info.mint_address == token_info.mint_address) {
            return Err(ErrorCode::AddressAlreadyPending.into())
        }
        // TODO check if it is an update
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let expiration = timestamp + DEFAULT_VOTE_EXPIRATION;
        pending_tokens_account.pending_token_infos.push(PendingTokenInfo {
            token_info: token_info.clone(),
            votes: 0,
            expiration: expiration,
            vote_type: ix.vote_type,
            contributors: Vec::new(),
        });
        Ok(())
    }

    pub fn vote_for(ctx: Context<VoteFor>, mint_address: Pubkey) -> ProgramResult {
        ////////////////////////////////
        // let account = ctx.accounts.voter_token_account.to_account_info();
        // let mint = ctx.accounts.voting_token_mint.to_account_info();
        // let authority = ctx.accounts..to_account_info();
        // msg!("authority = {:?}", authority);
        // msg!("account = {:?}", account);
        // let ix = spl_token::instruction::freeze_account(ctx.accounts.token_program.key, account.key, mint.key, authority.key, &[])?;
        // solana_program::program::invoke_signed(
        //     &ix,
        //     &[
        //         account.clone(),
        //         mint.clone(),
        //         ctx.accounts.token_program.to_account_info().clone(),
        //     ],
        //     &[],
        // )?;
        // freeze or set authority to PDA
        if ctx.accounts.voter_token_account.owner != ctx.accounts.pending_tokens_account.key() {
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.voter_token_account.to_account_info().clone(),
                current_authority: ctx.accounts.user.to_account_info().clone(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::set_authority(cpi_context, AuthorityType::AccountOwner, Some(ctx.accounts.pending_tokens_account.key()))?;
        }

        // voting
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let voter_token_account = &ctx.accounts.voter_token_account;
        let position = pending_tokens_account.pending_token_infos.iter().position(|i| i.token_info.mint_address == mint_address);
        if position == None {
            return Err(ErrorCode::TokenNotFound.into());
        }
        if pending_tokens_account.pending_token_infos[position.unwrap()].contributors.iter().any(|c| *c == voter_token_account.key()) {
            return Err(ErrorCode::AccountAlreadyVoted.into());
        }

        // increment votes
        pending_tokens_account.pending_token_infos[position.unwrap()].votes += voter_token_account.amount as i64;
        pending_tokens_account.pending_token_infos[position.unwrap()].contributors.push(voter_token_account.key());

        // remove expired votes
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= required_vote));
        Ok(())
    }

    pub fn withdraw_voting_balace(ctx: Context<WithdrawVotingBalanc>, seeds: Seeds) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        // remove expired votes
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= required_vote));
        
        // check if account is still in pending votes
        let voter_token_account = ctx.accounts.voter_token_account.key();
        if pending_tokens_account.pending_token_infos.iter().any(|t| t.contributors.iter().any(|c| *c == voter_token_account)) {
            return Err(ErrorCode::AccountStillVoting.into())
        }

        // unfreeze / return the account to the owner
        if ctx.accounts.voter_token_account.owner == ctx.accounts.pending_tokens_account.key() {
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.voter_token_account.to_account_info().clone(),
                current_authority: ctx.accounts.pending_tokens_account.to_account_info().clone(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let all_seeds = &[&seeds.seed[..], &[seeds.bump]];
            let seed_input = &[&all_seeds[..]];
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(seed_input);
            token::set_authority(cpi_context, AuthorityType::AccountOwner, Some(*ctx.accounts.user.key))?;
        }
        Ok(())
    }

    pub fn check_create_vote(ctx: Context<CheckCreateVote>, mint_address: Pubkey) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let approved_token = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap();
        ctx.accounts.current_token_info.token_info = approved_token.token_info.clone();
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= required_vote) && x.token_info.mint_address != mint_address);
        Ok(())
    }

    pub fn check_update_vote(ctx: Context<CheckUpdateVote>, mint_address: Pubkey) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let approved_token = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap();
        ctx.accounts.current_token_info.token_info = approved_token.token_info.clone();
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= required_vote) && x.token_info.mint_address != mint_address);
        Ok(())
    }

    pub fn check_delete_vote(ctx: Context<CheckDeleteVote>, mint_address: Pubkey) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let _res = ctx.accounts.current_token_info.close(ctx.accounts.user.to_account_info())?;
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= required_vote) && x.token_info.mint_address != mint_address);
        Ok(())
    }

    pub fn cleanup(ctx: Context<Cleanup>) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let required_vote = (ctx.accounts.voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64;
        pending_tokens_account.pending_token_infos.retain(|x| x.expiration >= timestamp || x.votes >= required_vote);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Seeds {
    pub bump: u8,
    pub seed: [u8; 19],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProposeInstruction {
    pub token_info: TokenInfo,
    pub vote_type: i64,
}

#[derive(Accounts)]
#[instruction(seeds: Seeds)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [seeds.seed.as_ref()],
        bump = seeds.bump,
        payer = user,
        space = 10240,
    )]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    // #[account(init, mint::decimals = 6, mint::authority = user, payer = user)]
    pub voting_token_mint: Account<'info, Mint>,
    pub user: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Propose<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
}

#[derive(Accounts)]
#[instruction(mint_address: Pubkey)]
pub struct VoteFor<'info> { 
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        mut,
        constraint = voter_token_account.owner == *user.key || (
            voter_token_account.owner == *pending_tokens_account.to_account_info().key
            && voter_token_account.to_account_info().key() == get_associated_token_address(user.key, voting_token_mint.to_account_info().key)
        )
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    #[account(constraint = pending_tokens_account.voting_token_mint == *voting_token_mint.to_account_info().key)]
    pub voting_token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawVotingBalanc<'info> { 
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        mut,
        constraint = voter_token_account.owner == *pending_tokens_account.to_account_info().key
        && voter_token_account.to_account_info().key() == get_associated_token_address(user.key, voting_token_mint.to_account_info().key)
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    #[account(constraint = pending_tokens_account.voting_token_mint == *voting_token_mint.to_account_info().key)]
    pub voting_token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(mint_address: Pubkey)]
pub struct CheckCreateVote<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        init,
        payer = user,
        space = 1024,
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().votes >= ((voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64),
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().vote_type == 0,
    )]
    pub current_token_info: Account<'info, TokenInfoAccount>,
    pub user: Signer<'info>,
    #[account(constraint = pending_tokens_account.voting_token_mint == *voting_token_mint.to_account_info().key)]
    pub voting_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mint_address: Pubkey)]
pub struct CheckUpdateVote<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        mut,
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().votes >= ((voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64),
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().vote_type == 1,
        constraint = mint_address == current_token_info.token_info.mint_address,
    )]
    pub current_token_info: Account<'info, TokenInfoAccount>,
    pub user: Signer<'info>,
    #[account(constraint = pending_tokens_account.voting_token_mint == *voting_token_mint.to_account_info().key)]
    pub voting_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mint_address: Pubkey)]
pub struct CheckDeleteVote<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        mut,
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().votes >= ((voting_token_mint.supply as f64 * REQUIRED_VOTE_PERCENTAGE) as i64),
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.mint_address == mint_address).unwrap().vote_type == 2,
        constraint = mint_address == current_token_info.token_info.mint_address,
    )]
    pub current_token_info: Account<'info, TokenInfoAccount>,
    pub user: Signer<'info>,
    #[account(constraint = pending_tokens_account.voting_token_mint == *voting_token_mint.to_account_info().key)]
    pub voting_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cleanup<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    pub voting_token_mint: Account<'info, Mint>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TokenInfo {
	// Public key for the spl token program that this info is for
	pub mint_address: Pubkey,
	// String name for this token
	pub token_name: String,
	// String symbol for this token
	pub token_symbol: String,
	// String image url for this token
	pub token_image_url: String,
	// List of string tags that apply to this token
	pub tags: Vec<String>,
}

#[account]
#[derive(Debug)]
pub struct TokenInfoAccount {
	pub token_info: TokenInfo,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PendingTokenInfo {
	pub token_info: TokenInfo,
	// unix timestamp for the expiration of this pending token info
	pub expiration: i64,
	// 64bit signed int for number of approval votes this pending token has received
	pub votes: i64,
    // contributors to the vote
    pub contributors: Vec<Pubkey>,
    // vote type
    pub vote_type: i64,
}

#[account]
#[derive(Default)]
pub struct PendingTokenInfos {
    pub pending_token_infos: Vec<PendingTokenInfo>,
    pub voting_token_mint: Pubkey,
}

// #[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
// pub enum VoteType {
//     CREATE = 0,
//     UPDATE = 1,
//     DELETE = 2,
// }

#[error]
pub enum ErrorCode {
    #[msg("Token already has a pending vote.")]
    AddressAlreadyPending,
    #[msg("Token not found.")]
    TokenNotFound,
    #[msg("Account has already contributed to this vote.")]
    AccountAlreadyVoted,
    #[msg("Account still contributing to in progress vote.")]
    AccountStillVoting,
}