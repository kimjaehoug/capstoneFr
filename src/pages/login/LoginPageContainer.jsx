import LoginPage from '../../components/auth/LoginPage';
import { WORKSPACE_ROUTE } from '../../shared/constants/routes';

function LoginPageContainer({ onMoveToPath, onLoginSuccess }) {
  return <LoginPage onBack={() => onMoveToPath(WORKSPACE_ROUTE)} onLoginSuccess={onLoginSuccess} />;
}

export default LoginPageContainer;
