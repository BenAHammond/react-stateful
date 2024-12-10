import { useState, useCallback, useEffect, useDebugValue, useRef } from 'react';

type ParamValue = any;

class Signal<T> {
  private subscribers = new Set<(value: T) => void>();
  private currentValue: T;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  get value(): T {
    return this.currentValue;
  }

  set value(newValue: T) {
    this.currentValue = newValue;
    this.subscribers.forEach(subscriber => subscriber(newValue));
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

const signalStore = new Map<string, Signal<any>>();

const getOrCreateSignal = <T>(key: string, initialValue: T): Signal<T> => {
  if (!signalStore.has(key)) {
    signalStore.set(key, new Signal(initialValue));
  }
  return signalStore.get(key)!;
};

const parseValue = (value: string | null, defaultValue: ParamValue): ParamValue => {
  if (value === null) return null;
  const decoded = decodeURIComponent(value);
  try {
    return typeof defaultValue === 'object' ? 
      JSON.parse(decoded) : 
      decoded === 'true' ? true :
      decoded === 'false' ? false :
      !isNaN(Number(decoded)) ? Number(decoded) :
      decoded;
  } catch {
    return decoded;
  }
};

const stringifyValue = (value: ParamValue): string => {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

function useQueryState<T extends ParamValue>(
  defaultValue: T,
  serverParams: Record<string, string>,
  queryKey?: string,
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const key = encodeURIComponent(queryKey ?? defaultValue?.toString() ?? '');

  // Initialize with server params or default value
  const initialValue = parseValue(serverParams[key], defaultValue) ?? defaultValue;
  
  const signalRef = useRef(getOrCreateSignal(key, initialValue));
  const [value, setValue] = useState<T>(signalRef.current.value);

  // Only sync with browser URL after initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = parseValue(params.get(key), defaultValue);
    if (urlValue !== null) {
      signalRef.current.value = urlValue as T;
    }
  }, []);

  useEffect(() => {
    return signalRef.current.subscribe(setValue);
  }, []);

  const setQueryValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(signalRef.current.value)
      : newValue;
    
    signalRef.current.value = nextValue;
    
    const params = new URLSearchParams(window.location.search);
    if (nextValue === null || nextValue === false) {
      params.delete(key);
    } else {
      params.set(key, encodeURIComponent(stringifyValue(nextValue)));
    }
    
    window.history.pushState(
      {}, 
      '', 
      `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    );
  }, [key]);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlValue = parseValue(params.get(key), defaultValue);
      signalRef.current.value = urlValue !== null ? urlValue as T : defaultValue;
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [key, defaultValue]);

  useDebugValue(`${key}: ${value}`);

  return [value, setQueryValue];
}

export default useQueryState;