import { Alert } from 'antd';
import React from 'react';

type ErrorState = { error: any, errorInfo: any };

export class ErrorBoundary extends React.Component<{}, ErrorState> {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.warn(error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <Alert
          message="Error"
          description={this.state.error && this.state.error.toString()}
          type="error"
          showIcon
        />
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

export const useAsyncError = () => {
  const [_, setError] = React.useState();
  return React.useCallback(
    e => {
      setError(() => {
        throw e;
      });
    },
    [setError],
  );
};