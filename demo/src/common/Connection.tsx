import React, { useMemo, useState, useContext } from 'react';
import { Connection } from '@solana/web3.js';

export interface Endpoint {
  name: string;
  value: string;
}

export interface ConnectionContextValues {
  endpoint: Endpoint;
  setEndpoint: (newEndpoint: Endpoint) => void;
  connection: Connection;
}

export const ENDPOINTS: Endpoint[] = [
  {
    name: 'mainnet-beta',
    value: 'https://solana-api.projectserum.com',
  },
  {
    name: 'localnet',
    value: 'http://127.0.0.1:8899',
  },
];

const ConnectionContext: React.Context<null | ConnectionContextValues> = React.createContext<null | ConnectionContextValues>(
  null,
);

export function ConnectionProvider({ children }) {
  // could be used by endpoint selector
  const [endpoint, setEndpoint] = useState(ENDPOINTS[1]);

  // only update connection if endpoint changes
  const connection = useMemo(() => new Connection(endpoint.value, 'recent'), [endpoint]);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        connection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('Missing connection context');
  }
  return context.connection;
}