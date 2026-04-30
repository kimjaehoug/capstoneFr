import Workspace from '../../components/workspace/Workspace';
import WorkspaceContextBar from '../../components/workspace/WorkspaceContextBar';
import WorkspaceStatusPanel from '../../components/workspace/WorkspaceStatusPanel';

function WorkspacePage({
  conflictInfo,
  onResolveConflictWithReload,
  onRetryConflict,
  workspaceStep,
  activeDataSource,
  activePipeline,
  activeModule,
  onStepChange,
  onClearContext,
  workspaceProps,
}) {
  const isPipelineWorking = workspaceStep === 'pipeline' && Boolean(activePipeline);
  const isExecutionWorking =
    workspaceStep === 'execution' && !workspaceProps.needsExecutionPipelineSelection && Boolean(activePipeline);
  const isReportWorking = workspaceStep === 'report' && Boolean(activePipeline);
  const showStepTabs = !(isPipelineWorking || isExecutionWorking || isReportWorking);

  return (
    <>
      {conflictInfo ? (
        <div className="conflict-banner">
          <span>충돌 감지: {conflictInfo.actionLabel}</span>
          <div className="conflict-banner-actions">
            <button type="button" className="btn-secondary-inline" onClick={onResolveConflictWithReload}>
              최신 반영
            </button>
            <button type="button" className="btn-primary-inline" onClick={onRetryConflict}>
              내 변경 재시도
            </button>
          </div>
        </div>
      ) : null}

      {showStepTabs ? (
        <WorkspaceContextBar
          workspaceStep={workspaceStep}
          activeDataSource={activeDataSource}
          activePipeline={activePipeline}
          activeModule={activeModule}
          onStepChange={onStepChange}
          onClearContext={onClearContext}
        />
      ) : null}

      <WorkspaceStatusPanel
        workspaceStep={workspaceStep}
        activeDataSource={activeDataSource}
        activePipeline={activePipeline}
        activeModule={activeModule}
        moduleStatus={workspaceProps.moduleStatus}
      />

      <Workspace {...workspaceProps} />
    </>
  );
}

export default WorkspacePage;
