use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum TokenNameError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<TokenNameError> for ProgramError {
    fn from(e: TokenNameError) -> Self {
        ProgramError::Custom(e as u32)
    }
}