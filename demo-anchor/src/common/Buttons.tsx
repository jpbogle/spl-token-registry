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
  padding: 5px;
  background: ${Colors.btnDisabled};

  &:hover {
    cursor: pointer;
    background: ${(props) => props.disabled ? Colors.btnDisabled : Colors.headerColor};
    transition: .1s all;
  }
`;