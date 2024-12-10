import { useState, useCallback, useEffect, useDebugValue, useRef } from 'react';

interface URLParamsLike {
  get(key: string): string | null;
}

interface RecordParams {
  [key: string]: string | string[] | undefined;
}

type SearchParamsInput = URLParamsLike | RecordParams;

function isURLParamsLike(params: SearchParamsInput): params is URLParamsLike {
  return typeof (params as URLParamsLike).get === 'function';
}

class Signal<T> {
  private listeners: ((value: T) => void)[] = [];
  value: T;

  constructor(value: T) {
    this.value = value;
  }

  notify(newValue: T) {
    this.value = newValue;
    this.listeners.forEach(listener => {
      try {
        listener(newValue);
      } catch (e) {
        console.error('Signal listener error:', e);
      }
    });
  }

  subscribe(fn: (value: T) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(f => f !== fn);
    };
  }
}

const store = new Map<string, Signal<any>>();

function getSignal<T>(key: string, value: T): Signal<T> {
  let signal = store.get(key);
  if (!signal) {
    signal = new Signal(value);
    store.set(key, signal);
  }
  return signal;
}

function getParam(params: SearchParamsInput, key: string): string | null {
  try {
    if (isURLParamsLike(params)) {
      return params.get(key);
    }
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  } catch {
    return null;
  }
}

function parseValue(value: string | null, defaultValue?: any): any {
  try {
    if (value === null) return defaultValue ?? null;
    const decoded = decodeURIComponent(value);
    if (decoded === 'true') return true;
    if (decoded === 'false') return false;
    if (/^\d+$/.test(decoded)) return Number(decoded);
    if (decoded.startsWith('{') || decoded.startsWith('[')) {
      return JSON.parse(decoded);
    }
    return decoded;
  } catch {
    return defaultValue ?? null;
  }
}

function stringifyValue(value: any): string {
  try {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  } catch {
    return '';
  }
}

function useQueryState<T = string>(
  name: string,
  searchParams: SearchParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void] {
  if (!name) {
    console.error('useQueryState requires a name parameter');
    name = 'unnamed';
  }

  const key = encodeURIComponent(name);
  const initialValue = parseValue(getParam(searchParams, key), defaultValue);
  const signalRef = useRef(getSignal(key, initialValue));
  const [value, setValue] = useState<T>(signalRef.current.value);

  useEffect(() => {
    let mounted = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlValue = parseValue(params.get(key), defaultValue);
      if (mounted) {
        signalRef.current.notify(urlValue);
      }
    } catch (e) {
      console.error('Error syncing with URL:', e);
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return signalRef.current.subscribe(setValue);
  }, []);

  const setQueryValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const nextValue = typeof newValue === 'function'
        ? (newValue as Function)(signalRef.current.value)
        : newValue;

      signalRef.current.notify(nextValue);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (nextValue === null || nextValue === false || nextValue === '') {
          params.delete(key);
        } else {
          params.set(key, encodeURIComponent(stringifyValue(nextValue)));
        }

        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.pushState({}, '', newUrl);
      }
    } catch (e) {
      console.error('Error updating query state:', e);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleUrlChange() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlValue = parseValue(params.get(key), defaultValue);
        signalRef.current.notify(urlValue);
      } catch (e) {
        console.error('Error handling URL change:', e);
      }
    }

    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [key, defaultValue]);

  useDebugValue(value);

  return [value, setQueryValue];
}

export default useQueryState;