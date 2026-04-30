import { useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../../api/client';
import { clearAuthState, getMyProfile, loadAuthState, logout, saveAuthState } from '../../utils/auth';
import { AUTH_EXPIRED_NOTICE_KEY } from '../../shared/constants/storageKeys';
import {
  broadcastCacheClearSignal,
  clearAppTemporaryCaches,
  useCacheClearSignalListener,
} from '../../shared/hooks/useAppCache';
import { AuthContext } from '../../entities/user/model/authState';

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user.id ?? user.userId ?? null,
  };
}

function AuthProvider({ children, onUnauthorized }) {
  const [auth, setAuth] = useState(() => loadAuthState());
  const currentUserId = auth?.user?.id ?? auth?.user?.userId ?? null;
  const isAuthenticated = Boolean(auth?.accessToken);

  useCacheClearSignalListener();

  useEffect(() => {
    if (!auth?.accessToken || currentUserId) return;
    let cancelled = false;

    (async () => {
      try {
        const me = await getMyProfile(auth.accessToken);
        const normalizedUser = normalizeUser(me?.user);
        if (!normalizedUser?.id || cancelled) return;
        const next = { ...auth, user: normalizedUser };
        saveAuthState(next);
        setAuth(next);
      } catch {
        // unauthorized handler handles expiration.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, currentUserId]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          AUTH_EXPIRED_NOTICE_KEY,
          '세션이 만료되었습니다. 다시 로그인해주세요.',
        );
      }
      clearAuthState();
      setAuth(null);
      onUnauthorized?.();
    });

    return () => setUnauthorizedHandler(null);
  }, [onUnauthorized]);

  const applyLoginSuccess = (login) => {
    const next = {
      accessToken: login.accessToken,
      tokenType: login.tokenType,
      expiresIn: login.expiresIn,
      user: normalizeUser(login?.user),
    };
    saveAuthState(next);
    setAuth(next);
    return next;
  };

  const performLogout = async () => {
    await logout();
    clearAppTemporaryCaches();
    broadcastCacheClearSignal();
    clearAuthState();
    setAuth(null);
  };

  const value = useMemo(
    () => ({
      auth,
      setAuth,
      currentUserId,
      isAuthenticated,
      applyLoginSuccess,
      performLogout,
    }),
    [auth, currentUserId, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
