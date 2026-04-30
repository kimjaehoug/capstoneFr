import { useMemo, useState } from 'react';
import { WorkspaceContext } from '../../entities/workspace/model/workspaceContext';

function WorkspaceProvider({ children }) {
  const [workspaceStep, setWorkspaceStep] = useState('pipeline');
  const [activeDataSourceId, setActiveDataSourceId] = useState(null);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [activeUserPipelineId, setActiveUserPipelineId] = useState(null);
  const [selectedModule, setSelectedModule] = useState('workflow');
  const [mainHubSection, setMainHubSection] = useState('pipeline');

  const setMainHubSectionWithStep = (sectionId) => {
    setMainHubSection(sectionId);
    if (sectionId === 'data') setWorkspaceStep('data');
    else setWorkspaceStep('pipeline');
  };

  const setSelectedModuleWithStep = (moduleId) => {
    setSelectedModule(moduleId);
    if (moduleId === 'results') setWorkspaceStep('result');
    else if (moduleId === 'workflow') setWorkspaceStep('pipeline');
    else setWorkspaceStep('module');
  };

  const clearWorkspaceContext = () => {
    setActiveDataSourceId(null);
    setActivePipelineId(null);
    setActiveUserPipelineId(null);
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    setWorkspaceStep('pipeline');
  };

  const value = useMemo(
    () => ({
      workspaceStep,
      setWorkspaceStep,
      activeDataSourceId,
      setActiveDataSourceId,
      activePipelineId,
      setActivePipelineId,
      activeUserPipelineId,
      setActiveUserPipelineId,
      selectedModule,
      setSelectedModule,
      setSelectedModuleWithStep,
      mainHubSection,
      setMainHubSection,
      setMainHubSectionWithStep,
      clearWorkspaceContext,
    }),
    [
      workspaceStep,
      activeDataSourceId,
      activePipelineId,
      activeUserPipelineId,
      selectedModule,
      mainHubSection,
      setMainHubSectionWithStep,
      setSelectedModuleWithStep,
      clearWorkspaceContext,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export default WorkspaceProvider;
