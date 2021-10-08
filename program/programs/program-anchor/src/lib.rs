use anchor_lang::prelude::*;

declare_id!("ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz");

const REQUIRED_VOTE_COUNT: i64 = 5;
// 60*60*24*7
const DEFAULT_VOTE_EXPIRATION: i64 = 60;

#[program]
mod spl_token_registry {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>, _seeds: Seeds) -> ProgramResult {
        Ok(())
    }

    pub fn propose(ctx: Context<Propose>, token_info: TokenInfo) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        for pending_token_info in pending_tokens_account.pending_token_infos.iter() {
            if pending_token_info.token_info.spl_token_program_address == token_info.spl_token_program_address {
                return Err(ErrorCode::AddressAlreadyPending.into())
            }
        }
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        let expiration = timestamp + DEFAULT_VOTE_EXPIRATION;
        pending_tokens_account.pending_token_infos.push(PendingTokenInfo {
            token_info: token_info.clone(),
            votes: 0,
            expiration: expiration,
        });
        Ok(())
    }

    pub fn vote_for(ctx: Context<VoteFor>, amount: i64, spl_token_program_address: Pubkey) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;

        let position = pending_tokens_account.pending_token_infos.iter().position(|i| i.token_info.spl_token_program_address == spl_token_program_address).unwrap();
        pending_tokens_account.pending_token_infos[position].votes += amount;

        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= REQUIRED_VOTE_COUNT));
        Ok(())
    }

    pub fn check_vote(ctx: Context<CheckVote>, spl_token_program_address: Pubkey) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let approved_token = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.spl_token_program_address == spl_token_program_address).unwrap();
        ctx.accounts.account_to_create.token_info = approved_token.token_info.clone();
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        pending_tokens_account.pending_token_infos.retain(|x| (x.expiration >= timestamp || x.votes >= REQUIRED_VOTE_COUNT) && x.token_info.spl_token_program_address != spl_token_program_address);
        Ok(())
    }

    pub fn cleanup(ctx: Context<Cleanup>) -> ProgramResult {
        let pending_tokens_account = &mut ctx.accounts.pending_tokens_account;
        let clock = Clock::get().unwrap();
        let timestamp = clock.unix_timestamp;
        pending_tokens_account.pending_token_infos.retain(|x| x.expiration >= timestamp || x.votes >= REQUIRED_VOTE_COUNT);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Seeds {
    pub bump: u8,
    pub seed: [u8; 19],
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
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Propose<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
}

#[derive(Accounts)]
pub struct VoteFor<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
}

#[derive(Accounts)]
#[instruction(spl_token_program_address: Pubkey)]
pub struct CheckVote<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
    #[account(
        init,
        // seeds = [seeds.seed.as_ref()],
        // bump = seeds.bump,
        payer = user,
        space = 1024,
        constraint = pending_tokens_account.pending_token_infos.iter().find(|x| x.token_info.spl_token_program_address == spl_token_program_address).unwrap().votes >= REQUIRED_VOTE_COUNT,
    )]
    pub account_to_create: Account<'info, TokenInfoAccount>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cleanup<'info> {
    #[account(mut)]
    pub pending_tokens_account: Account<'info, PendingTokenInfos>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TokenInfo {
	// Public key for the spl token program that this info is for
	pub spl_token_program_address: Pubkey,
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
}

#[account]
#[derive(Default)]
pub struct PendingTokenInfos {
    pub pending_token_infos: Vec<PendingTokenInfo>,
}

#[error]
pub enum ErrorCode {
    #[msg("Token already has a pending vote.")]
    AddressAlreadyPending,
    #[msg("Token not found.")]
    TokenNotFound,
}