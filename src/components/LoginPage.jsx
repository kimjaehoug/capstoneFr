function LoginPage({ onBack }) {
  return (
    <div className="login-page">
      <div className="login-card panel">
        <h1>로그인</h1>
        <p>Google 소셜 로그인을 연결할 화면입니다.</p>
        <div className="login-card-actions">
          <button type="button" className="btn-primary-inline">
            Google로 로그인
          </button>
          <button type="button" className="secondary" onClick={onBack}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
