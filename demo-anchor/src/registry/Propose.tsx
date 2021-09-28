import styled from 'styled-components';
import Colors from 'common/colors';
import { useState, useEffect } from 'react';
import { useConnection } from 'common/Connection';
import { proposeToken, getPendingTokenInfos, initialize } from 'api/anchor_api';
import { useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { StyledButton } from 'common/Buttons';
import { Alert } from 'antd';
import { StyledSelect } from 'common/StyledSelect';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { notify } from 'common/Notification';

const Layout = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0px auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
`;

const StyledInput = styled.div`
  .prompt {
    color: ${Colors.white};
    margin: 10px 0px;
  }
  input {
    border: ${Colors.border};
    border-radius: 4px;    
    color: ${Colors.white};
    padding: 6px;
    background: none;
    outline: none;
    width: 100%;
  }
`;

function Propose() {
  const [error, setError] = useState(null);
  const wallet = useWallet();
  const connection = useConnection();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [isInitialized, setIsInitialized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    (async function checkInit() {
      if (wallet.connected) {
        await getPendingTokenInfos(wallet, connection)
        .catch((e) => {
          // todo CHECK TYPEOF E
          if (e) {
            console.log(e);
            setIsInitialized(false);
          }
        })
      }
    })()
  }, [wallet, connection]);

  return (
    <Layout>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      )}
      <LoadingBoundary loading={isLoading}>
        <StyledInput>
          <div className="prompt">Address</div>
          <input onChange={(e) => setAddress(e.target.value)} value={address}/>
        </StyledInput>

        <StyledInput>
          <div className="prompt">Name</div>
          <input onChange={(e) => setName(e.target.value)} value={name}/>
        </StyledInput>

        <StyledInput>
          <div className="prompt">Symbol</div>
          <input onChange={(e) => setSymbol(e.target.value)} value={symbol}/>
        </StyledInput>

        <StyledInput>
          <div className="prompt">Image URL</div>
          <input onChange={(e) => setImageUrl(e.target.value)} value={imageUrl}/>
        </StyledInput>

        <StyledInput>
          <div className="prompt">Image URL</div>
          <StyledSelect
            style={{"marginTop": "10px"}}
            isMulti
            options={["defi", "ethereum", "wrapper", "wormhole", "utility-token", "social-token", "tokenized-stock", "stablecoin"].map((t) => ({label: t, value: t}))}
            onChange={(v) => setTags(v.map((t) => t.value))}
            value={tags.map((t) => ({label: t, value: t}))}
            placeholder="Tags..."
          />
        </StyledInput>
        <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
          try {
            setIsLoading(true);
            await proposeToken(wallet, connection, {
              splTokenProgramAddress: new web3.PublicKey(address),
              tokenName: name,
              tokenSymbol: symbol,
              tokenImageUrl: imageUrl,
              tags,
            })
            setIsLoading(false);
            setAddress("");
            setName("");
            setSymbol("");
            setImageUrl("");
            setTags([]);
            notify({ message: 'Succes', description: 'Token proposed succesfully', txid: '123'});
          } catch (e) {
            setError(`${e}`);
          }
        }}>
          Submit
        </StyledButton>
        {!isInitialized && (
          <StyledButton disabled={!wallet || !wallet.connected} onClick={async () => {
            try {
              await initialize(wallet, connection)
            } catch (e) {
              setError(`${e}`);
            }
          }}>
            Init
          </StyledButton>
        )}
      </LoadingBoundary>
    </Layout>
  )
}

export default Propose;