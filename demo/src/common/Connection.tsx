import React, { useMemo, useState, useContext } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

export interface Environment {
  label: string;
  value: string;
  programId: PublicKey,
  votingTokenMint?: PublicKey,
}

export interface EnvironmentContextValues {
  environment: Environment;
  setEnvironment: (newEndpoint: Environment) => void;
  connection: Connection;
}

export const ENVIRONMENTS: Environment[] = [
  {
    label: 'prod',
    value: 'https://api.solana.com',
    programId: new PublicKey('ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz'),
  },
  {
    label: 'devnet',
    value: 'https://api.devnet.solana.com',
    programId: new PublicKey('ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz'),
    votingTokenMint: new PublicKey('J68Fquq5EQ4hnYPEo68DWC6bbxBGPQUDqMFmFV5nhCrj'),
  },
  {
    label: 'localnet',
    value: 'http://127.0.0.1:8899',
    programId: new PublicKey('ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz'),
    votingTokenMint: new PublicKey('517PfUgFP3f52xHQzjjBfbTTCSmSVPzo5JeeiQEE9KWs'),
  },
];

const EnvironmentContext: React.Context<null | EnvironmentContextValues> = React.createContext<null | EnvironmentContextValues>(
  null,
);

export function ConnectionProvider({ children }) {
  // could be used by endpoint selector
  const [environment, setEnvironment] = useState(ENVIRONMENTS[1]);

  // only update connection if endpoint changes
  const connection = useMemo(() => new Connection(environment.value, 'recent'), [environment]);

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        connection,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironmentCtx(): EnvironmentContextValues {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('Missing connection context');
  }
  return context;
}