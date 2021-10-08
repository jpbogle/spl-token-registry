import { useState, useEffect } from 'react';
import { useConnection } from 'common/Connection';
import { getPendingTokenInfos, initialize } from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { StyledButton } from 'common/Buttons';

export function Initialized({ setError }) {
  const wallet = useWallet();
  const connection = useConnection();
  const [isInitialized, setIsInitialized] = useState(true);
  useEffect(() => {
    (async function checkInit() {
      await getPendingTokenInfos(connection)
      .catch((e) => {
        // todo CHECK TYPEOF E
        if (e) {
          setIsInitialized(false);
        }
      })
    })()
  }, [wallet, connection]);

  if (!isInitialized) {
    return (
      <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
        try {
          setError(null);
          await initialize(wallet, connection)
        } catch (e) {
          setError(`${e}`);
        }
      }}>
        Init
      </StyledButton>
    )
  }
  return <></>
}

export default Initialized;