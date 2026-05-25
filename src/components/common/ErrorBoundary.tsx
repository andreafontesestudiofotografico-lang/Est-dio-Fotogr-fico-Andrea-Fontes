// @ts-nocheck
import React, { ErrorInfo, ReactNode } from "react";
import { logger } from "../../utils/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary", `Caught error in ${this.props.componentName || "UnknownComponent"}`, {
      message: error.message,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-red-800 font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-red-600 text-sm mb-4">
            Não foi possível carregar este componente. Nosso time já foi notificado.
          </p>
          <button
             onClick={() => this.setState({ hasError: false, error: undefined })}
             className="px-4 py-2 bg-red-100 text-red-800 text-sm font-semibold rounded hover:bg-red-200 transition"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

