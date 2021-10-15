import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useEnvironmentCtx } from 'common/EnvironmentProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import * as api from 'api/api';
import * as spl from "@solana/spl-token";
import { PendingTokenAccount } from 'api/PendingTokenInfo';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { StyledButton, FavoriteButton } from 'common/Buttons';
import { StyledSelect } from 'common/StyledSelect';
import { StyledContainer } from 'common/StyledContainer';
import { notify } from 'common/Notification';
import { StyledTokenInfo } from 'common/StyledTokenInfo';
import { Initialized } from 'common/Initialized';
import { useError } from 'common/ErrorProvider';

export function usePendingAccount(setLoading, setError): PendingTokenAccount {
  const ctx = useEnvironmentCtx();
  const wallet = useWallet();
  const [pendingTokenAccount, setPendingTokenAccount] = useState(null);
  useEffect(() => {
    const interval = setInterval(
      function pendingVotesInterval(): any {
        if (ctx) {
          api.getPendingTokenAccount(ctx)
          .then((pendingVotes) => {
            setPendingTokenAccount(pendingVotes);
            setLoading([]);
          })
          .catch((e) => {
            console.log(e);
            setLoading([]);
            setPendingTokenAccount(null);
            setError(`${e}`);
          });
        }
        return pendingVotesInterval;
    }(), 1000);
    return () => clearInterval(interval);
  }, [setLoading, wallet, ctx, setError]);
  useEffect(() => {
    setLoading(null);
    return () => {};
  }, [ctx, setLoading]);
  return pendingTokenAccount;
}

export function useVotingTokenMintInfo() : spl.MintInfo {
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [votingTokenMintInfo, setVotingTokenMintInfo] = useState(null);
  useEffect(() => {
    (async function checkInit() {
      api.getMintInfo(ctx)
      .then((mintInfo) => setVotingTokenMintInfo(mintInfo))
      .catch((e) => console.log(e));
    })()
    return () => {};
  }, [wallet, ctx]);
  return votingTokenMintInfo;
}

function Voting() {
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [loading, setLoading] = useState(null);
  // const [error, setError] = useState(null);
  const [error, setError] = useError();
  const pendingTokenAccount = usePendingAccount(setLoading, setError);
  const votingTokenMintInfo = useVotingTokenMintInfo();
  const [tags, setTags] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const pendingTokenInfos = (pendingTokenAccount && pendingTokenAccount.pendingTokenInfos) || [];
  const filteredTokenInfos = tags.length > 0 ? pendingTokenInfos.filter((f) => tags.some(t => f.tokenInfo.tags.includes(t))) : pendingTokenInfos;
  const sortedTokenInfos = [...filteredTokenInfos].sort((f1, f2) => {
    if (favorites.includes(f1.tokenInfo.mintAddress.toBase58()) && favorites.includes(f2.tokenInfo.mintAddress.toBase58())) return 0;
    else if (favorites.includes(f1.tokenInfo.mintAddress.toBase58())) return -1
    else if (favorites.includes(f2.tokenInfo.mintAddress.toBase58())) return 1
    else return 0;
  });
  const UTC_seconds_now = Math.floor(Date.now() / 1000);
  return (
    <>
      <StyledContainer>
        {/* {error && (
          <Alert
            style={{ marginBottom: '10px' }}
            message="Error"
            description={error.toString()}
            type="error"
            showIcon
          />
        )} */}
        {error}
        <StyledSelect
          isMulti
          // options={fundraisers.reduce((acc, f) => acc.concat(f.tags.map((t) => ({ label: t, value: t }))), [])}
          options={Array.from(pendingTokenInfos.reduce((acc, f) => {
            f.tokenInfo.tags.forEach(acc.add, acc);
            return acc;
          }, new Set())).map((t) => ({label: t, value: t}))}
          onChange={(v) => setTags(v.map((t) => t.value))}
          value={tags.map((t) => ({label: t, value: t}))}
          placeholder="Find..."
        />

        {/* <div style={{ margin: '0px auto' }}><Initialized setError={setError} setLoading={setLoading} /></div> */}
        {sortedTokenInfos.some((i) => i.expiration.toNumber() <= UTC_seconds_now) && (
          <StyledButton style={{ marginLeft: 'auto', marginRight: 'auto' }} disabled={!wallet || !wallet.connected} onClick={async () => {
              try {
                setError(null);
                const txid = await api.cleanupExpired(wallet, ctx, pendingTokenAccount.votingTokenMint);
                setLoading(null);
                notify({ message: 'Succes', description: 'You have cleaned up expired tokens. Be sure to check votes on those that are complete', txid });
              } catch (e) {
                setError(`${e}`);
              }
            }}>
            Cleanup
          </StyledButton>
        )}
        <LoadingBoundary loading={loading == null}>
          <>
            {sortedTokenInfos.map(f => (
              <StyledTokenInfo key={f.tokenInfo.mintAddress.toBase58()}>
                <LoadingBoundary loading={loading && loading.includes(f.tokenInfo.mintAddress.toBase58())}>
                  <div className="image">
                    <img src={f.tokenInfo.tokenImageUrl} alt={f.tokenInfo.tokenName} />
                  </div>
                  <div className="info">
                    <div className="title">{f.tokenInfo.tokenName}</div>
                    <div className="symbol">{f.tokenInfo.tokenSymbol}</div>
                    <div className="address">{f.tokenInfo.mintAddress.toBase58()}</div>
                    {f.tokenInfo.tags.length > 0 &&
                      <div className="tags">{f.tokenInfo.tags.map((t) => (
                        <div
                          key={`${f.tokenInfo.mintAddress.toBase58()}_${t}`}
                          className="tag"
                          style={{ background: tags.includes(t) ? Colors.white : 'none', color: tags.includes(t)? Colors.darkBlue : Colors.white }}
                          onClick={() => tags.includes(t) ? setTags(tags.filter((t1) => t1 !== t)) : setTags([...tags, t])}
                        >
                          {t}
                        </div>
                        ))}
                      </div>
                    }
                    <FavoriteButton onClick={() => favorites.includes(f.tokenInfo.mintAddress.toBase58()) ? setFavorites(favorites.filter((fav) => fav !== f.tokenInfo.mintAddress.toBase58())) : setFavorites([...favorites, f.tokenInfo.mintAddress.toBase58()])} selected={favorites.includes(f.tokenInfo.mintAddress.toBase58())}>
                      <svg className="Icon_icon__2NnUo inline-block mr-1 h-3 w-3 align-baseline PlayerSummary_favoritedDisabled__3-f5T" role="img" aria-label="Favorite Player Button Star" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
                        <path fillRule="evenodd" d="M4 6L1.649 7.236l.449-2.618L.196 2.764l2.628-.382L4 0l1.176 2.382 2.628.382-1.902 1.854.45 2.618z"></path>
                      </svg>
                    </FavoriteButton>
                    <div className="buttons">
                      <StyledButton width="100px" disabled={!wallet || !wallet.connected} onClick={async () => {
                        try {
                          setError(null);
                          const txid = await api.voteFor(wallet, ctx, f.tokenInfo.mintAddress, pendingTokenAccount.votingTokenMint);
                          setLoading([...loading, f.tokenInfo.mintAddress.toBase58()])
                          notify({ message: 'Success', description: 'You have voted for this token', txid });
                        } catch (e) {
                          setError(`${e}`);
                        }
                      }}>
                        Vote
                      </StyledButton>
                      {(f.expiration.toNumber() >= UTC_seconds_now || f.votes.toNumber() >= 0) && (
                        <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
                            try {
                              setError(null);
                              const txid = await api.checkVote(wallet, ctx, f.tokenInfo.mintAddress, pendingTokenAccount.votingTokenMint);
                              setLoading([...loading, f.tokenInfo.mintAddress.toBase58()])
                              notify({ message: 'Success', description: 'You have attempted to check the vote for this token', txid });
                            } catch (e) {
                              setError(`${e}`);
                            }
                          }}>
                          Check Vote
                        </StyledButton>
                      )}
                    </div>
                    <div className="expiration">{(f.expiration.toNumber() >= UTC_seconds_now) ?
                      `${(Math.floor((f.expiration.toNumber() - UTC_seconds_now)/60/60/24))}d ${(Math.floor((f.expiration.toNumber() - UTC_seconds_now)/60/60%24))}h ${(Math.floor((f.expiration.toNumber() - UTC_seconds_now)/60%60))}m ${(Math.floor((f.expiration.toNumber() - UTC_seconds_now)%60))}s`
                      : 'EXPIRED (Check Vote)'}
                    </div>
                    <div className="progress-outer">
                      <div className="progress" style={{ width: `${100 * f.votes.toNumber() / (votingTokenMintInfo && votingTokenMintInfo.supply.toNumber()) || 1}%` }}>
                      </div>
                      <div className="text">
                        <span>{f.votes.toNumber()} / {(votingTokenMintInfo && votingTokenMintInfo.supply.toNumber()) || "..."}</span>
                      </div>
                    </div>
                  </div>
                </LoadingBoundary>
              </StyledTokenInfo>
            ))}
          </>
        </LoadingBoundary>
      </StyledContainer>
    </>
  )
}

export default Voting;