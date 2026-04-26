import { useState } from 'react';
import { loginWithCredentials, signupWithCredentials } from '../utils/auth';

function LoginPage({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    password: '',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChangeField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        setForm((prev) => ({
          ...prev,
          name: '',
          password: '',
        }));
        setStatus('회원가입이 완료되었습니다. 로그인해 주세요.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '인증 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card panel">
        <h1>로그인</h1>
        <p>이름, 아이디, 비밀번호로 회원가입/로그인합니다.</p>
        <div className="login-mode-tabs">
          <button
            type="button"
            className={`login-mode-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setStatus('');
            }}
          >
            로그인
          </button>
          <button
            type="button"
            className={`login-mode-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setStatus('');
            }}
          >
            회원가입
          </button>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              이름
              <input
                value={form.name}
                onChange={(event) => onChangeField('name', event.target.value)}
                placeholder="이름"
                autoComplete="name"
                required
              />
            </label>
          ) : null}
          <label>
            아이디
            <input
              value={form.loginId}
              onChange={(event) => onChangeField('loginId', event.target.value)}
              placeholder="아이디"
              autoComplete="username"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChangeField('password', event.target.value)}
              placeholder="비밀번호"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          <button type="submit" className="btn-primary-inline" disabled={isLoading}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
        <div className="login-divider">또는</div>
        <button
          type="button"
          className="secondary"
          onClick={() => setStatus('소셜 로그인은 현재 지원하지 않습니다.')}
        >
          Google 소셜 로그인(미지원)
        </button>
        <div className="login-card-actions">
          <button type="button" className="secondary" onClick={onBack}>
            메인으로 돌아가기
          </button>
        </div>
        {status ? (
          <p className={`login-status ${isLoading ? 'loading' : ''}`}>{status}</p>
        ) : null}
      </div>
    </div>
  );
}

export default LoginPage;
