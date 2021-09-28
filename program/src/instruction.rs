use solana_program::{pubkey::Pubkey, program_error::ProgramError, msg, program_pack::Pack};
use arrayref::{array_ref, array_refs};
use crate::error::TokenNameError::InvalidInstruction;
use crate::{state::TokenInfo};

pub enum TokenInfoInstruction {
    InitPendingTokens {},
    /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 4. `[]` The rent sysvar
    /// 5. `[]` The token program
    ProposeToken {
      token_info: TokenInfo,
    },
    /// Accepts a trade
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person taking the trade
    /// 1. `[writable]` The taker's token account for the token they send
    /// 2. `[writable]` The taker's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The PDA's temp token account to get tokens from and eventually close
    /// 4. `[writable]` The initializer's main account to send their rent fees to
    /// 5. `[writable]` The initializer's token account that will receive tokens
    /// 6. `[writable]` The escrow account holding the escrow info
    /// 7. `[]` The token program
    /// 8. `[]` The PDA account
    VoteFor {
      amount: i32,
      spl_token_program_address: Pubkey,
    },
}

impl TokenInfoInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&[version], &[instruction_id], data) = array_refs![input, 1, 1; ..;];
        msg!("Program invocation v{:} instruction {:}", version, instruction_id);
        if version != 0 {
          return Err(ProgramError::InvalidInstructionData);
        }
        Ok(match (version, instruction_id) {
            (0, 0) => {
              // let (arg0, rest) = array_refs![data, 32; ..;];
              // let str_data = String::from_utf8(rest.to_vec()).unwrap();
              // // .map_err(|err| {
              // //   ProgramError::InvalidInstructionData
              // // })?;
              // let args: Vec<&str> = str_data.split(",").collect();
              // msg!("Arguments: {:?}", args);
              // msg!("Pubkey: {:?}", arg0);
              let data_array = array_ref![data, 0, 512];
              let token_info = TokenInfo::unpack_from_slice(data_array).unwrap();
              Self::ProposeToken {
                token_info: token_info
              }
            },
            (0, 1) => {
              let (&[amount], spl_token_program_address, _rest) = array_refs![data, 1, 32; ..;];
              msg!("instruction pub key: {:?}", spl_token_program_address);
              msg!("instruction pub key: {:?}", String::from_utf8(spl_token_program_address.to_vec()));
              msg!("instruction pub key: {:?}", Pubkey::new(spl_token_program_address));
              Self::VoteFor {
                amount: amount as i32,
                spl_token_program_address: Pubkey::new(spl_token_program_address),
              }
            },
            (0, 2) => {
              Self::InitPendingTokens {}
            }
            _ => return Err(InvalidInstruction.into()),
        })
    }

    // fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
    //     let amount = input
    //         .get(..8)
    //         .and_then(|slice| slice.try_into().ok())
    //         .map(u64::from_le_bytes)
    //         .ok_or(InvalidInstruction)?;
    //     Ok(amount)
    // }
}