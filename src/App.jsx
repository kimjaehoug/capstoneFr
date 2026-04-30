import AppShell from './app/AppShell';
import WorkspaceProvider from './app/providers/WorkspaceProvider';
import AuthProvider from './app/providers/AuthProvider';

function App() {
  return (
    <WorkspaceProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </WorkspaceProvider>
  );
}

export default App;
