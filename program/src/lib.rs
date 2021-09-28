pub mod state;
pub mod error;
pub mod instruction;
pub mod processor;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    log::{sol_log_params, sol_log_slice},
    msg,
		program_pack::{Pack},
    program_error::ProgramError,
    pubkey::Pubkey,
};
use std::str;

use crate::{state::TokenInfo, instruction::TokenInfoInstruction};
use crate::{processor::Processor};

entrypoint!(process_instruction);
fn process_instruction(
	program_id: &Pubkey,
	accounts: &[AccountInfo],
	instruction_data: &[u8],
) -> ProgramResult {
	let instruction = TokenInfoInstruction::unpack(instruction_data)?;

	match instruction {
		TokenInfoInstruction::ProposeToken { token_info } => {
				msg!("Instruction: ProposeToken");
				Processor::process_propose_token(program_id, accounts, &token_info)
		}
		TokenInfoInstruction::VoteFor { amount, spl_token_program_address } => {
				msg!("Instruction: VoteFor");
				Processor::process_vote_for(program_id, accounts, amount, spl_token_program_address)
		}
		TokenInfoInstruction::InitPendingTokens {} => {
			msg!("Instruction: InitPendingTokens");
			Processor::init_pending_token(program_id, accounts)
	}
	}
}