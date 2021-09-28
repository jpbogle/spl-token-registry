use borsh::{
	BorshDeserialize,
	BorshSerialize,
};
use solana_program::{
  program_error::ProgramError,
  program_pack::{Pack, Sealed},
  pubkey::Pubkey,
	msg,
};
use std::time::SystemTime;
use std::str;
use arrayref::{array_ref, array_refs};

#[derive(Debug, Clone, Copy)]
#[repr(packed)]
pub struct TokenInfo {
	// Public key for the spl token program that this info is for
	pub spl_token_program_address: Pubkey,
	// String name for this token
	pub token_name: [u8; 32],
	// String symbol for this token
	pub token_symbol: [u8; 32],
	// String image url for this token
	pub token_image_url: [u8; 160],
	// List of string tags that apply to this token
	pub tags: [u8; 128],
}

impl Sealed for TokenInfo {}

impl Pack for TokenInfo {
	const LEN: usize = 512;

	fn pack_into_slice(&self, dst: &mut [u8]) {
		let bytes = self.spl_token_program_address.to_bytes();
		dst[0..32].copy_from_slice(&bytes);

		let bytes = self.token_name;
		dst[32..32+bytes.len()].copy_from_slice(&bytes);
		dst[32+bytes.len()..64].fill(0);

		let symbol_bytes = self.token_symbol;
		dst[64..64+symbol_bytes.len()].copy_from_slice(&symbol_bytes);
		dst[64+symbol_bytes.len()..96].fill(0);

		let image_bytes = self.token_image_url;
		dst[96..96+image_bytes.len()].copy_from_slice(&image_bytes);
		dst[96+image_bytes.len()..256].fill(0);

		let tag_bytes = self.tags;		
		dst[256..256+tag_bytes.len()].copy_from_slice(&tag_bytes);
		dst[256+tag_bytes.len()..384].fill(0);

		// padding for future upgrades
		dst[384..].fill(0);
	}

	fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
		if src.len() < 512 {
			return Err(ProgramError::AccountDataTooSmall)
		}
		let src = array_ref![src, 0, TokenInfo::LEN];
		let (
			spl_token_program_address,
			token_name,
			token_symbol,
			token_image_url,
			tags,
			_padding,
		) = array_refs![src, 32, 32, 32, 160, 128, 128];
		Ok(TokenInfo {
			spl_token_program_address: Pubkey::new_from_array(*spl_token_program_address),
			token_name: *token_name,
			token_symbol: *token_symbol,
			token_image_url: *token_image_url,
			tags: *tags,
		})
	}
}

#[derive(Debug, Clone, Copy)]
#[repr(packed)]
pub struct PendingTokenInfo {
	// token info that is pending approval
	pub token_info: TokenInfo,
	// unix timestamp for the expiration of this pending token info
	pub expiration: i64,
	// 64bit signed int for number of approval votes this pending token has received
	pub votes: i64,
  // array of pub keys name coin accounts that have voted, max 256
}

impl Sealed for PendingTokenInfo {}

impl Pack for PendingTokenInfo {
	const LEN: usize = 1024;

	fn pack_into_slice(&self, dst: &mut [u8]) {
		self.token_info.pack_into_slice(&mut dst[0..512]);
		dst[512..520].copy_from_slice(&self.expiration.to_ne_bytes());
		dst[520..528].copy_from_slice(&self.votes.to_ne_bytes());
		dst[528..].fill(0);
	}

	fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
		if src.len() < 1024 {
			return Err(ProgramError::AccountDataTooSmall)
		}
		let src = array_ref![src, 0, PendingTokenInfo::LEN];
		let (
			token_info_bytes,
			expiration,
			votes,
			_padding,
		) = array_refs![src, 512, 8, 8, 496];
		let token_info = TokenInfo::unpack_from_slice(token_info_bytes).unwrap();

		Ok(PendingTokenInfo {
			token_info: token_info,
			expiration: i64::from_ne_bytes(*expiration),
			votes: i64::from_ne_bytes(*votes),
		})
	}
}

#[derive(Debug, Clone)]
#[repr(packed)]
pub struct PendingTokenInfos {
	pub pending_token_infos: Vec<PendingTokenInfo>,
}

impl Sealed for PendingTokenInfos {}

impl Pack for PendingTokenInfos {
	const LEN: usize = PendingTokenInfo::LEN * 10;

	fn pack_into_slice(&self, dst: &mut [u8]) {
		for (i, pending_token_info) in self.pending_token_infos.iter().enumerate() {
			let offset = i*PendingTokenInfo::LEN;
			pending_token_info.pack_into_slice(&mut dst[offset..offset+PendingTokenInfo::LEN]);
		}
	}

	fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
		let src = array_ref![src, 0, PendingTokenInfos::LEN];
		let mut start = 0;
		let mut pending_token_infos: Vec<PendingTokenInfo> = Vec::new();
		while true {
			let (&[first_byte]) = array_ref![src, start, 1];
			if start >= Self::LEN || first_byte == 0 {
				break;
			}
			let (pending_token_info_bytes) = array_ref![src, start, PendingTokenInfo::LEN];
			let pending_token_info = PendingTokenInfo::unpack_from_slice(pending_token_info_bytes).unwrap();
			pending_token_infos.push(pending_token_info);
			start += PendingTokenInfo::LEN;
		}
		Ok(PendingTokenInfos {
			pending_token_infos: pending_token_infos,
		})
	}
}