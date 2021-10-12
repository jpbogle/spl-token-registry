import { useEffect, useState } from 'react';
import { useEnvironmentCtx } from 'common/EnvironmentProvider';
import { StyledButton } from 'common/Buttons';
import * as api from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { notify } from './Notification';

export function useVotingPower(): number {
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [votingPower, setVotingPower] = useState(null);
  useEffect(() => {
    (async function checkInit() {
      if (wallet && wallet.connected && ctx.environment.votingTokenMint) {
        const associatedTokenAccount = await api.findAssociatedTokenAddress(wallet.publicKey, ctx.environment.votingTokenMint);
        api.getAccountInfo(ctx, associatedTokenAccount)
        .then((accountInfo) => setVotingPower(accountInfo.amount.toNumber()))
        .catch((e) => {
          console.log(e);
          setVotingPower(-1);
        })
      }
    })()
    return () => {};
  }, [wallet, ctx]);
  return votingPower;
}

export function VotingPower() {
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const votingPower = useVotingPower();
  if (wallet && wallet.connected && votingPower != null) {
    if (!ctx.environment.votingTokenMint) {
      return (
        <StyledButton
          style={{ width: 'auto', margin: '0px 10px' }}
          onClick={() => api.initMint(wallet, ctx)
            .then((account) => notify({ message: 'Succes', description: 'Mint created', txid: account.toBase58() }))
            .catch((e) => console.log(e))
          }
        >
          No Voting Mint (init)
        </StyledButton>
      )
    } else if (votingPower < 0) {
      return (
        <StyledButton
          style={{ width: 'auto', margin: '0px 10px' }}
          onClick={() => api.createVotingTokenAccount(wallet, ctx)
            .then((account) => notify({ message: 'Succes', description: 'Voting token account created', txid: account.toBase58() }))
            .catch((e) => console.log(e))
          }
        >
          No Voting Account (init)
        </StyledButton>
      )
    } else {
      return <div id="voting-power">Voting Power: {votingPower} STRVC</div>
    }
  } else {
    return <></>
  }
} 