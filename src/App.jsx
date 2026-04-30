import AppShell from './app/AppShell';
import WorkspaceProvider from './app/providers/WorkspaceProvider';

function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}

export default App;
