import { useMemo, useState } from 'react';
import { WorkspaceContext } from '../../entities/workspace/model/workspaceContext';
import {
  WORKSPACE_STEP_DATA,
  WORKSPACE_STEP_MODULE,
  WORKSPACE_STEP_PIPELINE,
  WORKSPACE_STEP_RESULT,
} from '../../entities/workspace/model/workspaceStep';

function WorkspaceProvider({ children }) {
  const [workspaceStep, setWorkspaceStep] = useState(WORKSPACE_STEP_PIPELINE);
  const [activeDataSourceId, setActiveDataSourceId] = useState(null);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [activeUserPipelineId, setActiveUserPipelineId] = useState(null);
  const [selectedModule, setSelectedModule] = useState('workflow');
  const [mainHubSection, setMainHubSection] = useState('pipeline');

  const setMainHubSectionWithStep = (sectionId) => {
    setMainHubSection(sectionId);
    if (sectionId === WORKSPACE_STEP_DATA) setWorkspaceStep(WORKSPACE_STEP_DATA);
    else setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
  };

  const setSelectedModuleWithStep = (moduleId) => {
    setSelectedModule(moduleId);
    if (moduleId === 'results') setWorkspaceStep(WORKSPACE_STEP_RESULT);
    else if (moduleId === 'workflow') setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
    else setWorkspaceStep(WORKSPACE_STEP_MODULE);
  };

  const clearWorkspaceContext = () => {
    setActiveDataSourceId(null);
    setActivePipelineId(null);
    setActiveUserPipelineId(null);
    setSelectedModule('workflow');
    setMainHubSection(WORKSPACE_STEP_PIPELINE);
    setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
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
