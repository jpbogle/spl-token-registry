import React, { useMemo, useState, useContext, useEffect } from 'react';
import { Alert } from 'antd';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEnvironmentCtx } from './EnvironmentProvider';

const ErrorContext: React.Context<null | any> = React.createContext<null | any>(
  null,
);

export function ErrorProvider({ children }) {
  const ctx = useEnvironmentCtx();
  const wallet = useWallet();
  const [error, setError] = useState(null);
  useEffect(() => {
    setError(null);
    return () => {};
  }, [wallet, ctx]);
  const styledError = error && (
    <Alert
      style={{ marginBottom: '10px' }}
      message="Error"
      description={error.toString()}
      type="error"
      showIcon
    />
  )
  return (
    <ErrorContext.Provider
      value={{
        setError,
        styledError,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  return [ctx.styledError, ctx.setError];
}
// export function StyledError(children) {
//   const [error, setError] = useState(null);
//   return React.cloneElement(children, { error, setError });
// }

// export const useError = () => {
//   const [error, setError] = useState(null);
//   function handleError(e) {
//     setError(e);
//   }
//   const wallet = useWallet();
//   const connection = useConnection();
//   useEffect(() => {
//     handleError(null);
//   }, [wallet, connection]);
//   return [error, handleError]
// }