import { useEffect } from 'react';
import { APP_CACHE_PREFIXES, LOGOUT_CACHE_CLEAR_SIGNAL_KEY } from '../constants/storageKeys';

export function clearAppTemporaryCaches() {
  if (typeof window === 'undefined') return;

  const shouldClear = (key) => APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));

  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (key && shouldClear(key)) {
      window.localStorage.removeItem(key);
    }
  }

  for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = window.sessionStorage.key(i);
    if (key && shouldClear(key)) {
      window.sessionStorage.removeItem(key);
    }
  }
}

export function broadcastCacheClearSignal() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOGOUT_CACHE_CLEAR_SIGNAL_KEY, String(Date.now()));
  window.localStorage.removeItem(LOGOUT_CACHE_CLEAR_SIGNAL_KEY);
}

export function useCacheClearSignalListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key !== LOGOUT_CACHE_CLEAR_SIGNAL_KEY || !event.newValue) return;
      clearAppTemporaryCaches();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
}
