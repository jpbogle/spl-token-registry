import styled from 'styled-components';
import Colors from 'common/colors';
import Select from 'react-select';
import { useEffect, useState } from 'react';
import { useConnection } from 'common/Connection';
import { getAccount, getPendingTokenInfos, getTokenInfo, getTokenInfos, initPendingTokensAccount, proposeToken } from 'api/api';
import { appendFile } from 'fs';
import { useWallet } from '@solana/wallet-adapter-react';

const Header = styled.div`
  width: 96%;
  height: 40px;
  position: sticky;
  // background: ${Colors.darkBlue};
  color: ${Colors.white};
  padding: 10px 2%;
  display: flex;
  align-items: center;
  justify-content: space-between;


  #left {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  #right {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  #logo {
    height: 30px;
  }
`;

const Layout = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0px auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
`;

type Selectable = {
  selected?: boolean,
}

const StyledSelect = styled(Select)`
  div {
    color: ${Colors.white};
    background: ${Colors.darkBlue};
    border-color: ${Colors.lightGray};
  }
`;

const StyledButton = styled.div`
  color: ${Colors.white};
  margin: 20px 0px 20px 0px;
  border: 1px solid ${Colors.white};
  border-radius: 9999px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  width: 150px;
  justify-content: center;
  padding: 5px;

  &:hover {
    cursor: pointer;
    background: ${Colors.headerColor};
    transition: .1s all;
  }

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

const StyledLink = styled.a<Selectable>`
  color: ${(props) => props.selected ? Colors.white : Colors.lightGray};
  margin: 20px;
  transition: .1s all;
  text-decoration: none;

  &:hover {
    color: ${Colors.white};
    cursor: pointer;
  }
`;

async function proposeNewToken() {

}

export default function Propose() {
  const wallet = useWallet();
  const connection = useConnection();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <>
      <Header>
        <div id="left">
          <img id="logo" src="assets/logo_titled_white.png" alt="SPL Token Names" />
        </div>
        <div id="right">
          <StyledLink href="/">FIND</StyledLink>
          <StyledLink href="/vote">VOTE</StyledLink>
          <StyledLink selected href="/propose">PROPOSE</StyledLink>
        </div>
      </Header>
      <Layout>
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

        <StyledButton onClick={async () => {
          const payerAccount = await getAccount(connection);
          proposeToken(connection, payerAccount, address, name, symbol, imageUrl, "");
        }}>
          Submit
        </StyledButton>
        <StyledButton onClick={async () => {
          const payerAccount = await getAccount(connection);
          initPendingTokensAccount(connection, payerAccount);
        }}>
          Init
        </StyledButton>
      </Layout>
    </>
  )
}