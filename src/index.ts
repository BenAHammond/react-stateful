import { useState, useCallback, useEffect, useDebugValue, useRef } from 'react';

export interface URLParamsLike {
  get(key: string): string | null;
}

export interface RecordParams {
  [key: string]: string | string[] | undefined;
}

export type ParamsInput = URLParamsLike | RecordParams;

function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

function parseValue<T>(value: string | null, defaultValue?: T): T {
  try {
    if (value === null) return defaultValue as T;
    
    const decoded = decodeURIComponent(value);

    // Handle different expected types based on defaultValue or type T
    if (defaultValue !== undefined) {
      if (isNumber(defaultValue)) {
        const num = Number(decoded);
        return isNaN(num) ? defaultValue : num as T;
      }
      if (isBoolean(defaultValue)) {
        return (decoded === 'true' ? true : decoded === 'false' ? false : defaultValue) as T;
      }
      if (isObject(defaultValue) || isArray(defaultValue)) {
        try {
          const parsed = JSON.parse(decoded);
          return typeof parsed === typeof defaultValue ? parsed : defaultValue;
        } catch {
          return defaultValue;
        }
      }
    }

    // Type inference without defaultValue
    if (decoded === 'true') return true as T;
    if (decoded === 'false') return false as T;
    if (/^\d+$/.test(decoded)) {
      const num = Number(decoded);
      return isNaN(num) ? decoded as T : num as T;
    }
    if (decoded.length > 0 && (decoded[0] == '{' || decoded[0] == '[')) {
      try {
        return JSON.parse(decoded) as T;
      } catch {
        return decoded as T;
      }
    }
    
    return decoded as T;
  } catch {
    return defaultValue as T;
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

function isURLParamsLike(params: ParamsInput): params is URLParamsLike {
  return typeof (params as URLParamsLike).get === 'function';
}

function getParam(params: ParamsInput, key: string): string | null {
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

function useQueryState<T = string>(
  name: string,
  params: ParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void] {
  if (!name) {
    console.error('useQueryState requires a name parameter');
    name = 'unnamed';
  }

  const key = encodeURIComponent(name);
  const paramValue = getParam(params, key);
  const initialValue = parseValue<T>(paramValue, defaultValue);
  
  const [isInitialRender, setIsInitialRender] = useState(true);
  const signalRef = useRef(getSignal(key, initialValue));
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isInitialRender && typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlValue = parseValue<T>(params.get(key), defaultValue);
        if (mounted) {
          signalRef.current.notify(urlValue);
        }
      } catch (e) {
        console.error('Error syncing with URL:', e);
      }
    }

    return () => {
      mounted = false;
    };
  }, [isInitialRender, key, defaultValue]);

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
        const urlValue = parseValue<T>(params.get(key), defaultValue);
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

  return [isInitialRender ? initialValue : value, setQueryValue];
}

export default useQueryState;