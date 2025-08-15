"use client";

import React, { useState, useCallback } from "react";
import { logError, generateRequestId } from "@/lib/logger";

interface ErrorState {
  error: Error | null;
  errorId: string | null;
  isError: boolean;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  errorId: string | null;
  isError: boolean;
  handleError: (error: Error | unknown, context?: Record<string, unknown>) => void;
  clearError: () => void;
  retryWithErrorHandling: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    errorId: null,
    isError: false
  });

  const handleError = useCallback((error: Error | unknown, context: Record<string, unknown> = {}) => {
    const errorId = generateRequestId();
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Log the error
    logError(errorObj, {
      requestId: errorId,
      action: 'async_operation_error',
      metadata: context
    });

    // Update state
    setErrorState({
      error: errorObj,
      errorId,
      isError: true
    });

    // Show user-friendly notification (would integrate with toast system)
    console.error("Error occurred:", errorObj.message, "Error ID:", errorId);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      errorId: null,
      isError: false
    });
  }, []);

  const retryWithErrorHandling = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      return await fn();
    } catch (error) {
      handleError(error, { action: 'retry_operation' });
      return null;
    }
  }, [handleError, clearError]);

  return {
    error: errorState.error,
    errorId: errorState.errorId,
    isError: errorState.isError,
    handleError,
    clearError,
    retryWithErrorHandling
  };
}

// Utility hook for data fetching with error handling
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      handleError(err, { action: 'data_fetch' });
    } finally {
      setLoading(false);
    }
  }, [fetchFn, handleError, clearError]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, deps);

  return { data, loading, error, retry };
}
