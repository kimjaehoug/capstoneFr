import { useEffect } from 'react';
import { isWorkspaceStep } from './workspaceStep';

export function useWorkspaceUrlSync({
  isWorkspaceRoute,
  currentPath,
  workspaceStep,
  activeDataSourceId,
  activePipelineId,
  selectedModule,
  setWorkspaceStep,
  setActiveDataSourceId,
  setActivePipelineId,
  setSelectedModule,
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !isWorkspaceRoute) return;
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step && isWorkspaceStep(step)) {
      setWorkspaceStep(step);
    }
    const dataSourceId = params.get('activeDataSourceId');
    const pipelineId = params.get('activePipelineId');
    const moduleId = params.get('activeModuleId');
    if (dataSourceId) setActiveDataSourceId(dataSourceId);
    if (pipelineId) setActivePipelineId(pipelineId);
    if (moduleId) setSelectedModule(moduleId);
  }, [isWorkspaceRoute, setWorkspaceStep, setActiveDataSourceId, setActivePipelineId, setSelectedModule]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isWorkspaceRoute) return;
    const params = new URLSearchParams();
    params.set('step', workspaceStep);
    if (activeDataSourceId) params.set('activeDataSourceId', activeDataSourceId);
    if (activePipelineId) params.set('activePipelineId', activePipelineId);
    if (selectedModule && selectedModule !== 'workflow') params.set('activeModuleId', selectedModule);
    const query = params.toString();
    const next = query ? `${currentPath}?${query}` : currentPath;
    window.history.replaceState({}, '', next);
  }, [isWorkspaceRoute, workspaceStep, activeDataSourceId, activePipelineId, selectedModule, currentPath]);
}
