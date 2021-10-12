import { Environment, ENVIRONMENTS, useEnvironmentCtx } from 'common/Connection';
import { StyledSelect } from './StyledSelect';
import styled from 'styled-components';

const StyledEndpointSelector = styled(StyledSelect)`
  margin: 0px 20px;
  width: 100px;
`;

export function EndpointSelector() {
  const { environment, setEnvironment } = useEnvironmentCtx();
  return (
    <div>
      <StyledEndpointSelector
        options={ENVIRONMENTS}
        onChange={(e: Environment) => setEnvironment(e)}
        value={environment}
        placeholder="Endpoint..."
      />
    </div>
  )
} 