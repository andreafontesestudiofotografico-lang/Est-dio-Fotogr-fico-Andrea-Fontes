// @ts-nocheck
import React, { ErrorInfo, ReactNode } from "react";
import { logger } from "../../utils/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ERROR_BOUNDARY', `Error caught in ${this.props.componentName}`, { error: error.message, stack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 border border-red-200 bg-red-50 text-red-800 rounded">
          <h2 className="text-lg font-bold mb-2">Erro ao carregar componente.</h2>
          <p className="text-sm">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-4 px-4 py-2 bg-red-100 border border-red-200 text-sm font-medium hover:bg-red-200 transition-colors">Tentar novamente</button>
        </div>
      );
    }

    return this.props.children;
  }
}
