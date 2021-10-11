import { useState, useEffect } from 'react';
import { useConnection } from 'common/Connection';
import { getPendingTokenAccount, initialize } from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { StyledButton } from 'common/Buttons';
import { notify } from './Notification';

export function Initialized({ setError, setLoading }) {
  const wallet = useWallet();
  const connection = useConnection();
  const [isInitialized, setIsInitialized] = useState(true);
  useEffect(() => {
    (async function checkInit() {
      await getPendingTokenAccount(connection)
      .catch((e) => {
        // todo CHECK TYPEOF E
        if (e) {
          setIsInitialized(false);
        }
      });
    })()
  }, [wallet, connection]);

  if (!isInitialized) {
    return (
      <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
        try {
          setError(null);
          setLoading(true);
          const txid = await initialize(wallet, connection);
          notify({ message: 'Succes', description: 'Token proposed succesfully', txid });
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