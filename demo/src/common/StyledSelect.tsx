import Colors from 'common/colors';
import Select from 'react-select';
import styled from 'styled-components';

export const StyledSelect = styled(Select)`
  margin: 0px auto 10px auto;
  width: 100%;
  div {
    color: ${Colors.white};
    background: ${Colors.darkBlue};
    border-color: ${Colors.lightGray};
  }
`;
