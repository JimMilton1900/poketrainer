import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

// const { data, loading, error, reload } = useFetch('/pokemon', { limit: 8 })
export function useFetch(path, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = path + JSON.stringify(params ?? {});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path, params)
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}