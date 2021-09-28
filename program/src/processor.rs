use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  system_instruction::create_account,
  program_pack::{Pack, Sealed},
  rent::Rent,
  msg,
  program_error::ProgramError,
  instruction::{AccountMeta},
  pubkey::Pubkey,
};
use crate::{state::{TokenInfo,PendingTokenInfo,PendingTokenInfos}};
use std::time::SystemTime;

const PDA_SEED: &[u8] = b"pending_token_infos";

pub struct Processor;
impl Processor {

  ///
  ///
  ///
  ///
  ///
  pub fn init_pending_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
  ) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer_account = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;

    // sanity check the pda account id
    let (pending_token_info_account_pk, bump_seed) = Pubkey::find_program_address(&[PDA_SEED], program_id);
    if (*pda_account.key != pending_token_info_account_pk) {
      return Err(ProgramError::IncorrectProgramId);
    }
    msg!("Finding pending_token_infos account: {}", pending_token_info_account_pk);
    msg!("payer account: {:?}", payer_account);

    // todo check if this is made already and throw error?
    let ix = solana_program::system_instruction::create_account(
      payer_account.key,
      &pending_token_info_account_pk,
      Rent::minimum_balance(&Rent::default(), PendingTokenInfo::LEN),
      PendingTokenInfos::LEN as u64,
      program_id,
    );

    // create PDA
    solana_program::program::invoke_signed(
        &ix,
        accounts,
        &[&[b"pending_token_infos", &[bump_seed]]],
    )?;
    pda_account.data.borrow_mut()[..PendingTokenInfos::LEN].fill(0);
    Ok(())
  }

  ///
  ///
  ///
  ///
  ///
  pub fn process_propose_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    token_info: &TokenInfo,
  ) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let pda_account = next_account_info(accounts_iter)?;

    // sanity check the pda account id
    let (pending_token_info_account_pk, bump_seed) = Pubkey::find_program_address(&[PDA_SEED], program_id);
    if (*pda_account.key != pending_token_info_account_pk) {
      return Err(ProgramError::IncorrectProgramId);
    }
    let mut data_bytes = pda_account.data.borrow_mut();
    let mut pending_token_infos = PendingTokenInfos::unpack_from_slice(&data_bytes).unwrap();
    pending_token_infos.pending_token_infos.push(PendingTokenInfo {
      token_info: *token_info,
      expiration: 1,
      votes: 0,
    });
    msg!("LENGTH: {:?}", pending_token_infos.pending_token_infos.len());
    pending_token_infos.pack_into_slice(&mut data_bytes);
    Ok(())
  }

  ///
  ///
  ///
  ///
  ///
  pub fn process_vote_for(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: i32,
    spl_token_program_address: Pubkey,
  ) -> ProgramResult {
    msg!("Voting for {:?} with amount {:?}", spl_token_program_address, amount);
    let accounts_iter = &mut accounts.iter();
    let pda_account = next_account_info(accounts_iter)?;
  
    // sanity check the pda account id
    let (pending_token_info_account_pk, bump_seed) = Pubkey::find_program_address(&[PDA_SEED], program_id);
    if (*pda_account.key != pending_token_info_account_pk) {
      return Err(ProgramError::IncorrectProgramId);
    }
    // todo check is owner has coins to vote with
    let mut data_bytes = pda_account.data.borrow_mut();
    let mut pending_token_infos = PendingTokenInfos::unpack_from_slice(&data_bytes).unwrap();
    let mut index: usize = usize::MAX;
    for (i, pending_token_info) in pending_token_infos.pending_token_infos.iter().enumerate() {
      // msg!("checking {:?}, amount {:?}", pending_token_info.token_info.spl_token_program_address, amount);
      // msg!("instruction pub key: {:?}", spl_token_program_address);
      if (pending_token_info.token_info.spl_token_program_address == spl_token_program_address) {
        // msg!("found {:?}, incrementing by {:?}", pending_token_info.token_info.spl_token_program_address, amount);
        index = i;
        break;
      }
    }
    // none found
    if index == usize::MAX {
      return Err(ProgramError::InvalidArgument);
    }
    pending_token_infos.pending_token_infos[index].votes += amount as i64;
    msg!("pending_token_infos: {:?}", pending_token_infos.pending_token_infos[index]);
    pending_token_infos.pack_into_slice(&mut data_bytes);
    Ok(())
  }
}