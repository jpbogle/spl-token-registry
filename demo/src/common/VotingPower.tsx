import styled from 'styled-components';
import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useConnection } from 'common/Connection';
import * as api from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';

export function useVotingPower(): number {
  const wallet = useWallet();
  const connection = useConnection();
  const [votingPower, setVotingPower] = useState(null);
  useEffect(() => {
    (async function checkInit() {
      if (wallet && wallet.connected) {
        const associatedTokenAccount = await api.findAssociatedTokenAddress(wallet.publicKey);
        const accountInfo = await api.getAccountInfo(connection, associatedTokenAccount);
        setVotingPower(accountInfo.amount.toNumber());
      }
    })()
  }, [wallet, connection]);
  return votingPower;
}

export function VotingPower() {
  const wallet = useWallet();
  const votingPower = useVotingPower();
  if (wallet && wallet.connected && votingPower != null) {
    return <div id="voting-power">Voting Power: {votingPower} STRVC</div>
  } else {
    return <></>
  }
} 