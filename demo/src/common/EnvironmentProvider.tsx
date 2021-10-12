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
  setEnvironment: (newEnvironment: Environment) => void;
  connection: Connection;
}

export const ENVIRONMENTS: Environment[] = [
  {
    label: 'mainnet',
    value: 'https://api.mainnet-beta.solana.com',
    programId: new PublicKey('ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz'),
  },
  {
    label: 'devnet',
    value: 'https://api.devnet.solana.com',
    programId: new PublicKey('ru5MV6sy97YYhGx3WZjWV8jSzWaBShWyoofoapcqypz'),
    votingTokenMint: new PublicKey('J68Fquq5EQ4hnYPEo68DWC6bbxBGPQUDqMFmFV5nhCrj'),
  },
  {
    label: 'testnet',
    value: 'https://api.testnet.solana.com',
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

export function EnvironmentContextProvider({ children }) {
  // could be used by environment selector
  const [environment, setEnvironment] = useState(ENVIRONMENTS[1]);

  // only update connection if environment changes
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