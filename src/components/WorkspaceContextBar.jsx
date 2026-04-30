function WorkspaceContextBar({
  workspaceStep,
  activeDataSource,
  activePipeline,
  activeModule,
  onStepChange,
  onClearContext,
}) {
  const stepLabels = {
    data: '데이터 선택',
    pipeline: '파이프라인 구성',
    execution: '단계 실행',
    report: '결과 리포트',
  };

  return (
    <section className="workspace-context-bar">
      <div className="workspace-context-steps">
        {['data', 'pipeline', 'execution', 'report'].map((step) => (
          <button
            key={step}
            type="button"
            className={`workspace-context-step ${workspaceStep === step ? 'active' : ''}`}
            onClick={() => onStepChange(step)}
          >
            {stepLabels[step]}
          </button>
        ))}
      </div>
      <div className="workspace-context-current">
        <span>데이터: {activeDataSource?.name || '-'}</span>
        <span>파이프라인: {activePipeline?.title || '-'}</span>
        <span>현재 작업 단계: {activeModule?.label || '-'}</span>
      </div>
      <button type="button" className="btn-secondary-inline" onClick={onClearContext}>
        컨텍스트 초기화
      </button>
    </section>
  );
}

export default WorkspaceContextBar;
