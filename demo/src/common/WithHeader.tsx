import styled from 'styled-components';
import Colors from 'common/colors';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { VotingPower } from './VotingPower';
import { EndpointSelector } from './EndpointSelector';
import { useError } from './ErrorProvider';
import Initialized from './Initialized';

const Header = styled.div`
  z-index: 10;
  width: 96%;
  margin: 0px auto;
  height: 60px;
  position: sticky;
  // background: ${Colors.darkBlue};
  color: ${Colors.white};
  padding: 10px 2%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

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

  #voting-power {
    margin: 0px 20px;
    border: 1px solid ${Colors.borderColor};
    border-radius: 10px;
    background: ${Colors.darkBlue};
    padding: 4px 8px;
    i {
      margin-left: 10px;
      cursor: pointer;
      &:hover {
        color: ${Colors.borderColor};
      }
    }
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
  const [error, setError] = useError();
  return (
    <>
      <Header>
        <div id="left">
          <img id="logo" src="assets/logo4.png" alt="SPL Token Names" />
          <span id="logo-text">SPL TOKEN REGISTRY</span>
          <VotingPower />
          <Initialized setLoading={() => {}}/>
        </div>
        <div id="right">
          <StyledLink selected={selected === HeaderLink.FIND} onClick={() => { setError(null); history.push('/')} }>FIND</StyledLink>
          <StyledLink selected={selected === HeaderLink.VOTE} onClick={() => { setError(null); history.push('/vote')} }>VOTE</StyledLink>
          <StyledLink selected={selected === HeaderLink.PROPOSE} onClick={() => { setError(null); history.push('/propose')} }>PROPOSE</StyledLink>
          <WalletMultiButton style={{ fontSize: '14px', height: '35px' }}/>
          <EndpointSelector />
        </div>
      </Header>
      {children}
    </>
  )
}

export default withRouter(WithHeader);