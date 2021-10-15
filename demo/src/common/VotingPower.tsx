import { useEffect, useState } from 'react';
import { useEnvironmentCtx } from 'common/EnvironmentProvider';
import { StyledButton } from 'common/Buttons';
import * as api from 'api/api';
import * as spl from "@solana/spl-token";
import { useWallet } from '@solana/wallet-adapter-react';
import { notify } from './Notification';
import { useError } from './ErrorProvider';

export function useTokenAccountInfo(isChecked: boolean, setIsChecked: Function): spl.AccountInfo {
  const [error, setError] = useError();
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [accountInfo, setAccountInfo] = useState(null);
  useEffect(() => {
    (async function checkInit() {
      if (wallet && wallet.connected && ctx.environment.votingTokenMint) {
        setError(null);
        const associatedTokenAccount = await api.findAssociatedTokenAddress(wallet.publicKey, ctx.environment.votingTokenMint);
        api.getAccountInfo(ctx, associatedTokenAccount)
        .then((accountInfo) => setAccountInfo(accountInfo))
        .catch((e) => {
          setError(e);
        })
        .finally(() => setIsChecked(true));
      }
    })()
    return () => {};
  }, [wallet, ctx, isChecked]);
  return accountInfo;
}

export function VotingPower() {
  const [error, setError] = useError();
  const [isChecked, setIsChecked] = useState(false);
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const accountInfo = useTokenAccountInfo(isChecked, setIsChecked);
  if (wallet && wallet.connected && isChecked) {
    if (!ctx.environment.votingTokenMint) {
      return (
        <StyledButton
          style={{ width: 'auto', margin: '0px 10px' }}
          onClick={() => api.initMint(wallet, ctx)
            .then((account) => notify({ message: 'Success', description: 'Mint created', txid: account.toBase58() }))
            .catch((e) => setError(e))
          }
        >
          No Voting Mint (init)
        </StyledButton>
      )
    } else if (!accountInfo) {
      return (
        <StyledButton
          style={{ width: 'auto', margin: '0px 10px' }}
          onClick={() => api.createVotingTokenAccount(wallet, ctx)
            .then((account) => {
              notify({ message: 'Success', description: 'Voting token account created', txid: account.toBase58() });
              setIsChecked(false);
            })
            .catch((e) => setError(e))
          }
        >
          No Voting Account (init)
        </StyledButton>
      )
    } else {
      return (
        <>
          <div id="voting-power">Voting Power: {accountInfo.amount.toNumber()} SVOTE
            {accountInfo.owner.toBase58() !== wallet.publicKey.toBase58() && (
              <i onClick={async() => {
                api.withdrawVotingBalace(wallet, ctx, ctx.environment.votingTokenMint)
                .then((txid) => {
                  notify({ message: 'Success', description: 'Voting balance reclaimed', txid });
                  setIsChecked(false);
                })
                .catch((e) => setError(e))
              }} className="fas fa-sign-out-alt"/>
            )}
          </div>
        </>
      )
    }
  } else {
    return <></>
  }
} 