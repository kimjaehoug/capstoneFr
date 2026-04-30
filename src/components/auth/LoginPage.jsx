import { useEffect, useState } from 'react';
import { loginWithCredentials, signupWithCredentials } from '../../utils/auth';
import './LoginPage.css';

const AUTH_EXPIRED_NOTICE_KEY = 'stage-one-auth-expired-notice';

function LoginPage({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); 
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    password: '',
  }); 
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const notice = window.sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY);
    if (!notice) return;
    setStatus(notice);
    window.sessionStorage.removeItem(AUTH_EXPIRED_NOTICE_KEY);
  }, []);

  const onChangeField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }; 

  const handleModeSwitch = () => {
    const nextMode = mode === 'login' ? 'signup' : 'login';
    setMode(nextMode);
    setForm({
      name: '',
      loginId: '',
      password: '',
    });
    setStatus('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setStatus(mode === 'login' ? '로그인 처리 중...' : '회원가입 처리 중...'); 
    try {
      if (mode === 'login') {
        const payload = await loginWithCredentials({
          loginId: form.loginId,
          password: form.password,
        }); 
        onLoginSuccess?.(payload); 
        setStatus('로그인 성공');
      } else {
        await signupWithCredentials({
          name: form.name,
          loginId: form.loginId,
          password: form.password,
        }); 
        setMode('login');
        setForm({ name: '', loginId: '', password: '' });
        setStatus('회원가입이 완료되었습니다. 로그인해주세요.');
      }
    } catch (err) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Unauthorized')) {
        setStatus('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (errorMsg.includes('User not found')) {
        setStatus('존재하지 않는 사용자입니다.');
      } else if (errorMsg.includes('already in use') || errorMsg.includes('Conflict')) {
        setStatus('이미 사용 중인 아이디입니다.');
      } else if (errorMsg.includes('Network Error')) {
        setStatus('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        setStatus('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1>{mode === 'login' ? 'Login' : 'Sign Up'}</h1>
          <p className="subtitle">AI 파이프라인 관리 워크벤치</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              이름
              <input
                value={form.name}
                onChange={(e) => onChangeField('name', e.target.value)}
                placeholder="홍길동"
                required
              />
            </label>
          )}

          <label>
            아이디
            <input
              value={form.loginId}
              onChange={(e) => onChangeField('loginId', e.target.value)}
              placeholder="example@id.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            비밀번호
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChangeField('password', e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div> 
            ) : (
              mode === 'login' ? '로그인' : '회원가입'
            )}
          </button>
        </form>

        <div className="login-divider">또는</div>

        <div className="login-card-actions">
          <button
            type="button"
            className="btn-secondary-flat"
            onClick={() => setStatus('소셜 로그인은 준비 중입니다.')}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google 계정으로 계속하기</span>
          </button>
          
          <button
            type="button"
            className="btn-mode-switch"
            onClick={handleModeSwitch}
          >
            {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </div>

        {status && (
          <div className={`login-status ${status.includes('성공') ? 'success' : 'error'}`}>
            {status}
          </div>
        )}

        <button onClick={onBack} className="btn-back-home">
          ← 메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
