import React from 'react';
import { useState, useEffect } from 'react';
import { Alert } from 'antd';
import styled from 'styled-components';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export function StyledError(children) {
  const [error, setError] = useState(null);
  return React.cloneElement(children, { error, setError });
}

export const useError = () => {
  const [error, setError] = useState(null);
  const wallet = useWallet();
  const connection = useConnection();
  useEffect(() => {
    setError(null);
  }, [wallet, connection]);
  return [error, setError]
}
