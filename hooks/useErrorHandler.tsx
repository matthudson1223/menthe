import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorNotification } from '../components/ErrorNotification';

interface ErrorDetails {
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

interface ErrorContextType {
  showError: (message: string, context?: Record<string, any>, stack?: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<ErrorDetails | null>(null);

  const showError = useCallback((message: string, context?: Record<string, any>, stack?: string) => {
    setError({
      message,
      timestamp: new Date().toISOString(),
      context,
      stack,
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {error && <ErrorNotification error={error} onClose={clearError} />}
    </ErrorContext.Provider>
  );
};

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};
