import styled from 'styled-components';
import Colors from 'common/colors';
import { useState } from 'react';
import { useEnvironmentCtx } from 'common/EnvironmentProvider';
import { proposeToken } from 'api/api';
import { useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { notify } from 'common/Notification';
import { StyledSelect } from 'common/StyledSelect';
import { StyledButton } from 'common/Buttons';
import { LoadingBoundary } from 'common/LoadingBoundary';
import { Initialized } from 'common/Initialized';
import { useError } from 'common/ErrorProvider';

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
  const [error, setError] = useError();
  const wallet = useWallet();
  const ctx = useEnvironmentCtx();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Layout>
      {error}
      <LoadingBoundary loading={isLoading}>
        <StyledInput>
          <div className="prompt">Mint Address</div>
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
          <div className="prompt">Tags</div>
          <StyledSelect
            style={{"marginTop": "10px"}}
            isMulti
            options={["defi", "ethereum", "wrapper", "wormhole", "utility-token", "social-token", "tokenized-stock", "stablecoin"].map((t) => ({label: t, value: t}))}
            onChange={(v) => setTags(v.map((t) => t.value))}
            value={tags.map((t) => ({label: t, value: t}))}
            placeholder="Tags..."
          />
        </StyledInput>
        <StyledButton style={{ marginBottom: '0px' }} disabled={!wallet || !wallet.connected} onClick={async () => {
          try {
            setIsLoading(true);
            const txid = await proposeToken(wallet, ctx, {
              mintAddress: new web3.PublicKey(address),
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
            notify({ message: 'Success', description: 'Token proposed succesfully', txid });
          } catch (e) {
            console.log(e);
            setIsLoading(false);
            setError(`${e}`);
          }
        }}>
          Submit
        </StyledButton>
        {/* <Initialized setError={setError} setLoading={setIsLoading} /> */}
      </LoadingBoundary>
    </Layout>
  )
}

export default Propose;