import { useState, useEffect } from 'react';
import { useEnvironmentCtx } from 'common/EnvironmentProvider';
import { getPendingTokenAccount, initialize } from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { StyledButton } from 'common/Buttons';
import { notify } from './Notification';
import { useError } from './ErrorProvider';

export function Initialized({ setLoading }) {
  const [error, setError] = useError();
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
    return () => {};
  }, [wallet, ctx]);

  if (!isInitialized) {
    return (
      <StyledButton style={{ margin: '0px 10px' }} disabled={!wallet || !wallet.connected} onClick={async () => {
        try {
          setError(null);
          setLoading(true);
          const txid = await initialize(wallet, ctx);
          notify({ message: 'Succes', description: 'Token governance program initialized', txid });
          setIsInitialized(true);
        } catch (e) {
          setError(`${e}`);
        } finally {
          setLoading(false);
        }
      }}>
        Init Program
      </StyledButton>
    )
  }
  return <></>
}

export default Initialized;