function MainHubModuleView({ modules, moduleStatus, onOpenModule }) {
  const list = modules.filter((m) => m.id !== 'workflow');

  return (
    <div className="main-hub-modules">
      <header className="main-hub-section-head">
        <h3 className="main-hub-section-title">모듈 조회/관리</h3>
        <p className="main-hub-section-desc">
          워크벤치에서 사용할 수 있는 기본·도메인 모듈을 살펴보고 바로 열 수 있습니다.
        </p>
      </header>

      <div className="card-grid main-hub-module-grid">
        {list.map((module) => (
          <article key={module.id} className="card workflow-card main-hub-module-card">
            <div className="workflow-card-head">
              <h4>{module.label}</h4>
              <span className={`status-pill mini ${moduleStatus[module.id]?.state || 'draft'}`}>
                {moduleStatus[module.id]?.label || '미저장'}
              </span>
            </div>
            <p>{module.description}</p>
            <button type="button" className="btn-primary-inline" onClick={() => onOpenModule(module.id)}>
              모듈 열기
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MainHubModuleView;
