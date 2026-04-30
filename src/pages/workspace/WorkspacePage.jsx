import Workspace from '../../components/Workspace';
import WorkspaceContextBar from '../../components/WorkspaceContextBar';

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

      <WorkspaceContextBar
        workspaceStep={workspaceStep}
        activeDataSource={activeDataSource}
        activePipeline={activePipeline}
        activeModule={activeModule}
        onStepChange={onStepChange}
        onClearContext={onClearContext}
      />

      <Workspace {...workspaceProps} />
    </>
  );
}

export default WorkspacePage;
