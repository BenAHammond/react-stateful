import { useState, useCallback, useEffect, useDebugValue, useRef } from 'react';

// Generic interface that matches URLSearchParams-like objects
interface SearchParamsLike {
  get(key: string): string | null;
  entries(): IterableIterator<[string, string]>;
}

type SearchParamsInput = SearchParamsLike | Record<string, string>;

// Helper to normalize different searchParams types
const getParamValue = (params: SearchParamsInput, key: string): string | null => {
  if ('get' in params && typeof params.get === 'function') {
    return params.get(key);
  }
  return params[key] ?? null;
};

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

const parseValue = (value: string | null, defaultValue?: any): any => {
  if (value === null) return defaultValue ?? null;
  const decoded = decodeURIComponent(value);
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
};

const stringifyValue = (value: any): string => {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

function useQueryState<T = string>(
  name: string,
  searchParams: SearchParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const key = encodeURIComponent(name);
  
  // Initialize with search params or default value
  const initialValue = parseValue(getParamValue(searchParams, key), defaultValue);
  const signalRef = useRef(getOrCreateSignal<T>(key, initialValue));
  const [value, setValue] = useState<T>(signalRef.current.value);

  // Only sync with browser URL after initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = parseValue(params.get(key), defaultValue);
    signalRef.current.value = urlValue;
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
      signalRef.current.value = urlValue;
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [key, defaultValue]);

  useDebugValue(`${key}: ${value}`);

  return [value, setQueryValue];
}

export default useQueryState;