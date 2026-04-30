function WorkspaceContextBar({
  workspaceStep,
  activeDataSource,
  activePipeline,
  activeModule,
  onStepChange,
  onClearContext,
}) {
  return (
    <section className="workspace-context-bar">
      <div className="workspace-context-steps">
        {['data', 'pipeline', 'module', 'result'].map((step) => (
          <button
            key={step}
            type="button"
            className={`workspace-context-step ${workspaceStep === step ? 'active' : ''}`}
            onClick={() => onStepChange(step)}
          >
            {step}
          </button>
        ))}
      </div>
      <div className="workspace-context-current">
        <span>데이터: {activeDataSource?.name || '-'}</span>
        <span>파이프라인: {activePipeline?.title || '-'}</span>
        <span>모듈: {activeModule?.label || '-'}</span>
      </div>
      <button type="button" className="btn-secondary-inline" onClick={onClearContext}>
        컨텍스트 초기화
      </button>
    </section>
  );
}

export default WorkspaceContextBar;
