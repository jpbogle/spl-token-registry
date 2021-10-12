import styled from 'styled-components';
import Colors from 'common/colors';

type ButtonProps = {
  disabled?: boolean,
  width?: string,
}

export const RoundedBtn = styled.div<ButtonProps>`
  color: ${(props) => props.disabled ? Colors.btnDisabled : Colors.white};
  text-decoration: none;
  margin: 10px 0px;
  padding: 5px;
  border: ${Colors.border};
  border-radius: 9999px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.btnDisabled};
  width: ${(props) => props.width || '100px'};
  &:hover {
    cursor: pointer;
  }
`;

export const StyledButton = styled.div<ButtonProps>`
  color: ${(props) => props.disabled ? Colors.btnDisabled : Colors.white};
  margin: 20px 0px 20px 0px;
  border: 1px solid ${Colors.white};
  border-radius: 9999px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  width: ${(props) => props.width || '100px'};
  justify-content: center;
  padding: 5px 8px;
  background: ${Colors.btnDisabled};

  &:hover {
    cursor: pointer;
    background: ${(props) => props.disabled ? Colors.btnDisabled : Colors.headerColor};
    transition: .1s all;
  }
`;

type Selectable = {
  selected?: boolean,
}

export const FavoriteButton = styled.div<Selectable>`
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
