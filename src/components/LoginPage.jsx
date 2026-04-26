import { useEffect, useRef, useState } from 'react';
import { loginWithGoogleIdToken } from '../utils/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

function LoginPage({ onBack, onLoginSuccess }) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus('VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
      return undefined;
    }
    let isUnmounted = false;

    const initGoogle = () => {
      if (isUnmounted) return;
      if (!window.google?.accounts?.id || !buttonRef.current) {
        setStatus('Google 로그인 스크립트를 불러오지 못했습니다.');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const idToken = response?.credential;
          if (!idToken) {
            setStatus('Google ID 토큰을 받지 못했습니다.');
            return;
          }
          setIsLoading(true);
          setStatus('로그인 처리 중...');
          try {
            const login = await loginWithGoogleIdToken(idToken);
            onLoginSuccess?.(login);
            setStatus('로그인 성공');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : '로그인에 실패했습니다.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 280,
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return () => {
        isUnmounted = true;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => {
      if (!isUnmounted) {
        setStatus('Google 로그인 스크립트 로드 실패');
      }
    };
    document.head.appendChild(script);

    return () => {
      isUnmounted = true;
    };
  }, [onLoginSuccess]);

  return (
    <div className="login-page">
      <div className="login-card panel">
        <h1>로그인</h1>
        <p>Google 계정으로 로그인해 워크벤치를 사용합니다.</p>
        <div className="login-card-actions">
          <button type="button" className="secondary" onClick={onBack}>
            메인으로 돌아가기
          </button>
        </div>
        <div className="login-google-button" ref={buttonRef} />
        {status ? (
          <p className={`login-status ${isLoading ? 'loading' : ''}`}>{status}</p>
        ) : null}
      </div>
    </div>
  );
}

export default LoginPage;
