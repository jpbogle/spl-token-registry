import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useConnection } from 'common/Connection';
import { useWallet } from '@solana/wallet-adapter-react';
import * as api from 'api/api';
import { PendingTokenInfo } from 'api/PendingTokenInfo';
import { Alert } from 'antd';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { StyledButton, FavoriteButton } from 'common/Buttons';
import { StyledSelect } from 'common/StyledSelect';
import { StyledContainer } from 'common/StyledContainer';
import { notify } from 'common/Notification';
import { StyledTokenInfo } from 'common/StyledTokenInfo';
import { Initialized } from 'common/Initialized';

export function usePendingTokenInfos(setLoading, setError): Array<PendingTokenInfo> {
  const connection = useConnection();
  const wallet = useWallet();
  const [pendingTokenInfos, setPendingTokenInfos] = useState([]);
  useEffect(() => {
    const interval = setInterval(
      function pendingTokensInterval(): any {
        if (connection) {
          api.getPendingTokenInfos(connection)
          .then((pendingTokens) => {
            setPendingTokenInfos(pendingTokens);
            setLoading([]);
          })
          .catch((e) => {
            setLoading([]);
            setError(`${e}`);
          });
        }
        return pendingTokensInterval;
    }(), 1000);
    return () => clearInterval(interval);
  }, [setLoading, setError, wallet, connection]);
  return pendingTokenInfos;
}

function Voting() {
  const wallet = useWallet();
  const connection = useConnection();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const pendingTokenInfos = usePendingTokenInfos(setLoading, setError);
  const [tags, setTags] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const filteredTokenInfos = tags.length > 0 ? pendingTokenInfos.filter((f) => tags.some(t => f.tokenInfo.tags.includes(t))) : pendingTokenInfos;
  const sortedTokenInfos = [...filteredTokenInfos].sort((f1, f2) => {
    if (favorites.includes(f1.tokenInfo.splTokenProgramAddress) && favorites.includes(f2.tokenInfo.splTokenProgramAddress)) return 0;
    else if (favorites.includes(f1.tokenInfo.splTokenProgramAddress)) return -1
    else if (favorites.includes(f2.tokenInfo.splTokenProgramAddress)) return 1
    else return 0;
  });

  const UTC_seconds_now = Math.floor(Date.now() / 1000);
  return (
    <>
      <StyledContainer>
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
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        )}
        <div style={{ margin: '0px auto' }}><Initialized setError={setError}/></div>
        {sortedTokenInfos.some((i) => i.expiration.toNumber() <= UTC_seconds_now) && (
          <StyledButton style={{ margin: '10px auto' }} disabled={!wallet || !wallet.connected} onClick={async () => {
              try {
                setError(null);
                const txid = await api.cleanupExpired(wallet, connection);
                setLoading(null);
                notify({ message: 'Succes', description: 'You have cleaned up expired tokens', txid });
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
              <StyledTokenInfo key={f.tokenInfo.splTokenProgramAddress.toBase58()}>
                <LoadingBoundary loading={loading && loading.includes(f.tokenInfo.splTokenProgramAddress.toBase58())}>
                  <div className="image">
                    <img src={f.tokenInfo.tokenImageUrl} alt={f.tokenInfo.tokenName} />
                  </div>
                  <div className="info">
                    <div className="title">{f.tokenInfo.tokenName}</div>
                    <div className="symbol">{f.tokenInfo.tokenSymbol}</div>
                    <div className="address">{f.tokenInfo.splTokenProgramAddress.toBase58()}</div>
                    {f.tokenInfo.tags.length > 0 &&
                      <div className="tags">{f.tokenInfo.tags.map((t) => (
                        <div
                          key={`${f.tokenInfo.splTokenProgramAddress.toBase58()}_${t}`}
                          className="tag"
                          style={{ background: tags.includes(t) ? Colors.white : 'none', color: tags.includes(t)? Colors.darkBlue : Colors.white }}
                          onClick={() => tags.includes(t) ? setTags(tags.filter((t1) => t1 !== t)) : setTags([...tags, t])}
                        >
                          {t}
                        </div>
                        ))}
                      </div>
                    }
                    <FavoriteButton onClick={() => favorites.includes(f.tokenInfo.splTokenProgramAddress) ? setFavorites(favorites.filter((fav) => fav !== f.tokenInfo.splTokenProgramAddress)) : setFavorites([...favorites, f.tokenInfo.splTokenProgramAddress])} selected={favorites.includes(f.tokenInfo.splTokenProgramAddress)}>
                      <svg className="Icon_icon__2NnUo inline-block mr-1 h-3 w-3 align-baseline PlayerSummary_favoritedDisabled__3-f5T" role="img" aria-label="Favorite Player Button Star" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
                        <path fillRule="evenodd" d="M4 6L1.649 7.236l.449-2.618L.196 2.764l2.628-.382L4 0l1.176 2.382 2.628.382-1.902 1.854.45 2.618z"></path>
                      </svg>
                    </FavoriteButton>
                    <div className="buttons">
                      <StyledButton width="100px" disabled={!wallet || !wallet.connected} onClick={async () => {
                        try {
                          setError(null);
                          const txid = await api.voteFor(wallet, connection, f.tokenInfo.splTokenProgramAddress, 1);
                          setLoading([...loading, f.tokenInfo.splTokenProgramAddress.toBase58()])
                          notify({ message: 'Succes', description: 'You have voted for this token', txid });
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
                              const txid = await api.checkVote(wallet, connection, pendingTokenInfos);
                              notify({ message: 'Succes', description: 'You have attempted to check the vote for this token', txid });
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
                      <div className="progress" style={{ width: `${f.votes.toNumber() / .1}%` }}>
                        <span>{f.votes.toNumber()}</span>
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