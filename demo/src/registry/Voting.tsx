import styled from 'styled-components';
import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useConnection } from 'common/Connection';
import { useWallet } from '@solana/wallet-adapter-react';
import { voteFor, getPendingTokenInfos } from 'api/api';
import { PendingTokenInfo } from 'api/PendingTokenInfo';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { StyledButton } from 'common/Buttons';
import { StyledSelect } from 'common/StyledSelect';
import { notify } from 'common/Notification';

const Layout = styled.div`
  width: 100%;
  max-width: 1024px;
  margin: 0px auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
`;

const Selector = styled.div`
  width: 100%;
  display: block;
  background: ${Colors.darkBlue};
  color: ${Colors.white};
  position: sticky;
  margin: 0px auto;
  max-width: calc(100% - 20px);
  z-index: 2;
  #top {

  }
  .header {
    background: ${Colors.headerColor};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }
  .details {
    padding: 20px;
  }
  .prompt {
    margin: 20px 0px 10px 0px;
  }
`;

const StyledTokenList = styled.div`
  width: 100%;
  margin: 0px auto;
  max-width: 950px;
`;

type Selectable = {
  selected?: boolean,
}

const Favorite = styled.div<Selectable>`
  position: absolute;
  top: 10px;
  right: 3%;
  margin: 10px 0px 10px 0px;
  border: 1px solid ${Colors.white};
  border-radius: 9999px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  width: 30px;
  justify-content: center;
  background: ${(props) => props.selected ? Colors.lightGray : 'none'};
  transition: .1s all;

  &:hover {
    cursor: pointer;
    background: ${Colors.lightGray};
  }

  svg {
    height: 20px;
    width: 20px;
    vertical-align: middle;
    margin: 5px;
    path {
      fill: ${(props) => props.selected ? Colors.white : 'none'};
      stroke: ${Colors.white};
      stroke-width: .3px;
    }
  }
`;

const StyledTokenInfo = styled.div`
  display: flex;
  color: ${Colors.white};
  margin: 50px 30px;
  border-radius: 40px;
  transition: .2s all;
  position: relative;
  // &:hover {
  //   background: ${Colors.darkBlue};
  //   cursor: pointer;
  //   transform: scale(1.005);
  // }

  .image { 
    img {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: ${Colors.border};
      object-fit: cover;
    }
  }

  .title {
    font-size: 18px;
    margin-bottom: 6px;
  }

  .info {
    height: 100%;
    flex-grow: 2;
    padding: 10px 30px;
  }

  .symbol {
    color: ${Colors.lightGray};
    max-width: 90%;
  }

  .address {
    margin-top: 10px;
    color: ${Colors.lightGray};
    max-width: 90%;
  }

  .tags {
    display: flex;
    align-items: center;
    margin-top: 10px;
    font-size: 12px;
    color: ${Colors.lightGray};

    .tag {
      border: ${Colors.border};
      border-radius: 16px;
      padding: 5px 10px;  
      margin: 5px;
      transition: .1s all;
      &:hover {
        background: ${Colors.darkBlue} !important;
        color: ${Colors.lightGray} !important;
        cursor: pointer;
      }
    }
  }

  .progress-outer {
    width: 100%;
    height: 20px;
    border: ${Colors.border};
    border-radius: 16px;
    overflow: hidden;
    background: ${Colors.darkBlue};
    &:hover {
      cursor: pointer;
    }

    .progress {
      height: 100%;
      background: ${Colors.green};
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        cursor: pointer;
      }
    }
  }
`;

export function usePendingTokenInfos(setLoading): Array<PendingTokenInfo> {
  const connection = useConnection();
  const wallet = useWallet();
  const [pendingTokenInfos, setPendingTokenInfos] = useState([]);

  useEffect(() => {
    const interval = setInterval(
      function pendingTokensInterval(): any {
        if (connection) {
          getPendingTokenInfos(wallet, connection)
          .then((pendingTokens) => {
            setPendingTokenInfos(pendingTokens);
            setLoading([]);
          })
          .catch((e) => {
            console.log(e);
          });
        }
        return pendingTokensInterval;
    }(), 1000);
    return () => clearInterval(interval);
  }, [setLoading, wallet, connection]);
  return pendingTokenInfos;
}

function Voting() {
  const wallet = useWallet();
  const connection = useConnection();
  const [loading, setLoading] = useState([]);
  const pendingTokenInfos = usePendingTokenInfos(setLoading);
  const [tags, setTags] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const filteredTokenInfos = tags.length > 0 ? pendingTokenInfos.filter((f) => tags.some(t => f.tokenInfo.tags.includes(t))) : pendingTokenInfos;
  const sortedTokenInfos = [...filteredTokenInfos].sort((f1, f2) => {
    if (favorites.includes(f1.tokenInfo.splTokenProgramAddress) && favorites.includes(f2.tokenInfo.splTokenProgramAddress)) return 0;
    else if (favorites.includes(f1.tokenInfo.splTokenProgramAddress)) return -1
    else if (favorites.includes(f2.tokenInfo.splTokenProgramAddress)) return 1
    else return 0;
  });
  return (
    <>
      <Layout>
        <Selector>
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
        </Selector>
        <StyledTokenList>
          {sortedTokenInfos.map(f => (
            <StyledTokenInfo key={f.tokenInfo.splTokenProgramAddress.toBase58()}>
              <LoadingBoundary loading={loading.includes(f.tokenInfo.splTokenProgramAddress.toBase58())}>
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
                  <Favorite onClick={() => favorites.includes(f.tokenInfo.splTokenProgramAddress) ? setFavorites(favorites.filter((fav) => fav !== f.tokenInfo.splTokenProgramAddress)) : setFavorites([...favorites, f.tokenInfo.splTokenProgramAddress])} selected={favorites.includes(f.tokenInfo.splTokenProgramAddress)}>
                    <svg className="Icon_icon__2NnUo inline-block mr-1 h-3 w-3 align-baseline PlayerSummary_favoritedDisabled__3-f5T" role="img" aria-label="Favorite Player Button Star" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
                      <path fillRule="evenodd" d="M4 6L1.649 7.236l.449-2.618L.196 2.764l2.628-.382L4 0l1.176 2.382 2.628.382-1.902 1.854.45 2.618z"></path>
                    </svg>
                  </Favorite>
                  <StyledButton width="100px" disabled={!wallet || !wallet.connected} onClick={async () => {
                    if (wallet && wallet.connected) {
                      const txid = await voteFor(wallet, connection, f.tokenInfo.splTokenProgramAddress, 1);
                      setLoading([...loading, f.tokenInfo.splTokenProgramAddress.toBase58()])
                      notify({ message: 'Succes', description: 'You have voted for this token', txid });
                    }
                  }}>
                    Vote
                  </StyledButton>
                  <div className="progress-outer">
                    <div className="progress" style={{ width: `${f.votes.toNumber() / .1}%` }}>
                      <span>{f.votes.toNumber()}</span>
                    </div>
                  </div>
                </div>
              </LoadingBoundary>
            </StyledTokenInfo>
          ))}
        </StyledTokenList>
      </Layout>
    </>
  )
}

export default Voting;