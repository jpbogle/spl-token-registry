import styled from 'styled-components';
import Colors from 'common/colors';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { withRouter, RouteComponentProps } from 'react-router-dom';

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
  margin-bottom: 20px;

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

  #logo-text {
    padding-left: 10px;
    font-size: 20px;
    font-family: 'Karla', sans-serif;
  }
`;

type Selectable = {
  selected?: boolean,
}

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

export enum HeaderLink {
  FIND,
  VOTE,
  PROPOSE,
}

interface HeaderProps extends RouteComponentProps {
  children: JSX.Element;
  selected: HeaderLink,
};

function WithHeader({ history, children, selected }: HeaderProps) {
  return (
    <>
      <Header>
        <div id="left">
          <img id="logo" src="assets/logo2.png" alt="SPL Token Names" />
          <span id="logo-text">SPL TOKEN REGISTRY</span>
        </div>
        <div id="right">
          <StyledLink selected={selected === HeaderLink.FIND} onClick={() => history.push('/')}>FIND</StyledLink>
          <StyledLink selected={selected === HeaderLink.VOTE} onClick={() => history.push('/vote')}>VOTE</StyledLink>
          <StyledLink selected={selected === HeaderLink.PROPOSE} onClick={() => history.push('/propose')}>PROPOSE</StyledLink>
          <WalletMultiButton style={{ fontSize: '14px', height: '35px' }}/>
        </div>
      </Header>
      {children}
    </>
  )
}

export default withRouter(WithHeader);