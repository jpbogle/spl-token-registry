import { useState, useEffect } from 'react';
import { useEnvironmentCtx } from 'common/Connection';
import { getPendingTokenAccount, initialize } from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { StyledButton } from 'common/Buttons';
import { notify } from './Notification';

export function Initialized({ setError, setLoading }) {
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [isInitialized, setIsInitialized] = useState(true);
  useEffect(() => {
    (async function checkInit() {
      setIsInitialized(true);
      await getPendingTokenAccount(ctx)
      .catch((e) => {
        // todo CHECK TYPEOF E
        if (e) {
          setIsInitialized(false);
        }
      });
    })()
  }, [wallet, ctx]);

  if (!isInitialized) {
    return (
      <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
        try {
          setError(null);
          setLoading(true);
          const txid = await initialize(wallet, ctx);
          notify({ message: 'Succes', description: 'Token governance program initialized', txid });
        } catch (e) {
          setError(`${e}`);
        } finally {
          setLoading(false);
        }
      }}>
        Init
      </StyledButton>
    )
  }
  return <></>
}

export default Initialized;