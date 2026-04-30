import { useMemo, useState } from 'react';
import { WorkspaceContext } from '../../entities/workspace/model/workspaceContext';

function WorkspaceProvider({ children }) {
  const [workspaceStep, setWorkspaceStep] = useState('pipeline');
  const [activeDataSourceId, setActiveDataSourceId] = useState(null);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [activeUserPipelineId, setActiveUserPipelineId] = useState(null);
  const [selectedModule, setSelectedModule] = useState('workflow');
  const [mainHubSection, setMainHubSection] = useState('pipeline');

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
      mainHubSection,
      setMainHubSection,
    }),
    [
      workspaceStep,
      activeDataSourceId,
      activePipelineId,
      activeUserPipelineId,
      selectedModule,
      mainHubSection,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export default WorkspaceProvider;
