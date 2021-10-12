import styled from 'styled-components';
import Colors from 'common/colors';
import { useEffect, useState } from 'react';
import { useEnvironmentCtx } from 'common/Connection';
import * as api from 'api/api';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { StyledSelect } from 'common/StyledSelect';
import { StyledContainer } from 'common/StyledContainer';
import { StyledTokenInfo } from 'common/StyledTokenInfo';
import { FavoriteButton } from 'common/Buttons';
import { Alert } from 'antd';
import { TokenInfo } from 'api/TokenInfo';

export function useTokenInfos(setLoading, setError): Array<TokenInfo> {
  const ctx = useEnvironmentCtx();
  const [tokenInfos, setTokenInfos] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (ctx) {
        api.getTokenInfos(ctx).then((tokenInfos) => {
          setTokenInfos(tokenInfos);
          setLoading(false);
        }).catch((e) => {
          setError(e);
          setTokenInfos([]);
          setLoading(false);
        })
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [ctx, setError, setLoading]);
  return tokenInfos;
}

function Registry() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenInfos = useTokenInfos(setLoading, setError);
  const [tags, setTags] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const filteredTokenInfos = tags.length > 0 ? tokenInfos.filter((f) => tags.some(t => f.tags.includes(t))) : tokenInfos;
  const sortedTokenInfos = [...filteredTokenInfos].sort((f1, f2) => {
    if (favorites.includes(f1.mintAddress.toBase58()) && favorites.includes(f2.mintAddress.toBase58())) return 0;
    else if (favorites.includes(f1.mintAddress.toBase58())) return -1
    else if (favorites.includes(f2.mintAddress.toBase58())) return 1
    else return 0;
  });
  return (
    <>
      <StyledContainer>
        {error && (
          <Alert
            style={{ marginBottom: '10px' }}
            message="Error"
            description={error.toString()}
            type="error"
            showIcon
          />
        )}
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
        <LoadingBoundary loading={loading}>
        <>
          {sortedTokenInfos.map(f => (
            <StyledTokenInfo key={f.mintAddress.toBase58()}>
                <div className="image">
                  {/* @ts-ignore */}
                  <img src={f.tokenImageUrl} onError={(e) => e.target.src='assets/placeholder-image.png'} alt={f.tokenName} />
                </div>
              <div className="info">
                <div className="title">{f.tokenName}</div>
                <div className="symbol">{f.tokenSymbol}</div>
                <div className="address">{f.mintAddress.toBase58()}</div>
                {f.tags.length > 0 &&
                  <div className="tags">{f.tags.map((t) => (
                    <div
                      key={`${f.mintAddress.toBase58()}_${t}`}
                      className="tag"
                      style={{ background: tags.includes(t) ? Colors.white : 'none', color: tags.includes(t)? Colors.darkBlue : Colors.white }}
                      onClick={() => tags.includes(t) ? setTags(tags.filter((t1) => t1 !== t)) : setTags([...tags, t])}
                    >
                      {t}
                    </div>
                    ))}
                  </div>
                }
                <FavoriteButton onClick={() => favorites.includes(f.mintAddress.toBase58()) ? setFavorites(favorites.filter((fav) => fav !== f.mintAddress.toBase58())) : setFavorites([...favorites, f.mintAddress.toBase58()])} selected={favorites.includes(f.mintAddress.toBase58())}>
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