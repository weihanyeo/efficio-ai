import { useEffect, useRef, useState, useCallback } from 'react';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '../lib/supabase';

type QueryOptions<T> = {
  enabled?: boolean;
  pollInterval?: number;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T[];
};

export function useSupabaseQuery<T>(
  queryFn: () => PostgrestFilterBuilder<any>,
  options: QueryOptions<T> = {}
) {
  const {
    enabled = true,
    pollInterval = 0,
    onSuccess,
    onError,
    transform = (data) => data as T[]
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: rawData, error: queryError } = await queryFn();

      if (queryError) throw queryError;

      const transformedData = transform(rawData);

      // Only update if data has changed
      if (JSON.stringify(previousDataRef.current) !== JSON.stringify(transformedData)) {
        previousDataRef.current = transformedData;
        setData(transformedData);
        onSuccess?.(transformedData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Query failed');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, transform, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchData();

    if (pollInterval > 0) {
      pollTimeoutRef.current = setInterval(fetchData, pollInterval);

      return () => {
        if (pollTimeoutRef.current) {
          clearInterval(pollTimeoutRef.current);
        }
      };
    }
  }, [enabled, fetchData, pollInterval]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
