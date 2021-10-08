import styled from 'styled-components';
import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useConnection } from 'common/Connection';
import * as api from 'api/api';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { StyledSelect } from 'common/StyledSelect';
import { StyledContainer } from 'common/StyledContainer';
import { StyledTokenInfo } from 'common/StyledTokenInfo';
import { FavoriteButton } from 'common/Buttons';
import { Alert } from 'antd';

export function useTokenInfos(setLoading, setError) {
  const connection = useConnection();
  const [tokenInfos, setTokenInfos] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (connection) {
        api.getTokenInfos(connection).then((tokenInfos) => {
          setTokenInfos(tokenInfos);
          setLoading(false);
        }).catch((e) => setError(e))
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [connection]);
  return tokenInfos;
}

function Registry() {
  const connection = useConnection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenInfos = useTokenInfos(setLoading, setError);
  const [tags, setTags] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const filteredTokenInfos = tags.length > 0 ? tokenInfos.filter((f) => tags.some(t => f.tags.includes(t))) : tokenInfos;
  const sortedTokenInfos = [...filteredTokenInfos].sort((f1, f2) => {
    if (favorites.includes(f1.id) && favorites.includes(f2.id)) return 0;
    else if (favorites.includes(f1.id)) return -1
    else if (favorites.includes(f2.id)) return 1
    else return 0;
  });
  return (
    <>
      <StyledContainer>
        <StyledSelect
          isMulti
          options={Array.from(tokenInfos.reduce((acc, f) => {
            f.tags.forEach(acc.add, acc);
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
        <LoadingBoundary loading={loading}>
        <>
          {sortedTokenInfos.map(f => (
            <StyledTokenInfo>
                <div className="image" onClick={async () => {const resp = await api.getTokenInfo(connection, f.splTokenProgramAddress); console.log("==>", resp)}}>
                  <img src={f.tokenImageUrl} alt={f.tokenName} />
                </div>
              <div className="info">
                <div className="title">{f.tokenName}</div>
                <div className="symbol">{f.tokenSymbol}</div>
                <div className="address">{f.splTokenProgramAddress.toBase58()}</div>
                {f.tags.length > 0 &&
                  <div className="tags">{f.tags.map((t) => (
                    <div
                      key={`${f.splTokenProgramAddress.toBase58()}_${t}`}
                      className="tag"
                      style={{ background: tags.includes(t) ? Colors.white : 'none', color: tags.includes(t)? Colors.darkBlue : Colors.white }}
                      onClick={() => tags.includes(t) ? setTags(tags.filter((t1) => t1 !== t)) : setTags([...tags, t])}
                    >
                      {t}
                    </div>
                    ))}
                  </div>
                }
                <FavoriteButton onClick={() => favorites.includes(f.id) ? setFavorites(favorites.filter((fav) => fav !== f.id)) : setFavorites([...favorites, f.id])} selected={favorites.includes(f.id)}>
                  <svg className="Icon_icon__2NnUo inline-block mr-1 h-3 w-3 align-baseline PlayerSummary_favoritedDisabled__3-f5T" role="img" aria-label="Favorite Player Button Star" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
                    <path fillRule="evenodd" d="M4 6L1.649 7.236l.449-2.618L.196 2.764l2.628-.382L4 0l1.176 2.382 2.628.382-1.902 1.854.45 2.618z"></path>
                  </svg>
                </FavoriteButton>
              </div>
            </StyledTokenInfo>
          ))}
        </>
        </LoadingBoundary>
      </StyledContainer>
    </>
  )
}

export default Registry;