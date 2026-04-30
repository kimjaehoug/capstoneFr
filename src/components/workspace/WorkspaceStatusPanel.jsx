const STEP_META = {
  data: {
    title: '데이터 선택',
    cta: '데이터를 선택하고 파이프라인 구성으로 이동하세요.',
  },
  pipeline: {
    title: '파이프라인 구성',
    cta: '파이프라인 구성을 확정하고 단계별 작업 실행을 시작하세요.',
  },
  execution: {
    title: '단계별 작업 실행',
    cta: '이 단계 실행 후 결과를 검토하고 다음 단계로 진행하세요.',
  },
  report: {
    title: '결과 리포트',
    cta: '실행 이력과 결정 로그를 검토해 최종 결과를 확인하세요.',
  },
};

function formatStepStatus(activeModule, moduleStatus) {
  if (!activeModule || activeModule.id === 'workflow') return '진행 전';
  const state = moduleStatus?.[activeModule.id]?.state;
  if (state === 'saved') return '완료';
  if (state === 'edited') return '검토 필요';
  if (state === 'draft') return '진행 전';
  return '진행 전';
}

function WorkspaceStatusPanel({ workspaceStep, activeDataSource, activePipeline, activeModule, moduleStatus }) {
  const stepMeta = STEP_META[workspaceStep] || STEP_META.data;
  const stepStatus = formatStepStatus(activeModule, moduleStatus);

  return (
    <section className="workspace-status-panel" aria-label="워크스페이스 상태 패널">
      <div className="workspace-status-panel-grid">
        <div>
          <p className="workspace-status-label">현재 단계</p>
          <strong className="workspace-status-value">{stepMeta.title}</strong>
        </div>
        <div>
          <p className="workspace-status-label">선택 데이터</p>
          <strong className="workspace-status-value">{activeDataSource?.name || '미선택'}</strong>
        </div>
        <div>
          <p className="workspace-status-label">선택 파이프라인</p>
          <strong className="workspace-status-value">{activePipeline?.title || '미선택'}</strong>
        </div>
        <div>
          <p className="workspace-status-label">현재 작업 상태</p>
          <strong className="workspace-status-value">{stepStatus}</strong>
        </div>
      </div>
      <div className="workspace-status-next-cta">다음 행동: {stepMeta.cta}</div>
    </section>
  );
}

export default WorkspaceStatusPanel;
