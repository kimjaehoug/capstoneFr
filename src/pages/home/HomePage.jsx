import { OPS_CONSOLE_ROUTE, SHARED_HUB_ROUTE, WORKSPACE_ROUTE } from '../../shared/constants/routes';

function HomePage({ onMoveToPath }) {
  return (
    <section className="hub-page">
      <header className="hub-hero">
        <p className="hub-eyebrow">WWorkbench</p>
        <h3 className="hub-hero-title">시작 페이지</h3>
        <p className="hub-hero-lead">원하는 작업 영역을 선택해 바로 시작할 수 있습니다.</p>
      </header>

      <div className="card-grid three-col">
        <article className="card">
          <h4>워크스페이스</h4>
          <p>데이터 선택, 파이프라인 구성, 단계 실행과 결과 확인을 진행합니다.</p>
          <button type="button" className="btn-primary-inline" onClick={() => onMoveToPath(WORKSPACE_ROUTE)}>
            워크스페이스 열기
          </button>
        </article>
        <article className="card">
          <h4>공유 허브</h4>
          <p>템플릿과 공유 자산을 탐색하고 복사할 수 있습니다.</p>
          <button type="button" className="btn-primary-inline" onClick={() => onMoveToPath(SHARED_HUB_ROUTE)}>
            공유 허브 열기
          </button>
        </article>
        <article className="card">
          <h4>운영 콘솔</h4>
          <p>현재 상태와 저장된 단계 정보를 조회하고 모니터링합니다.</p>
          <button type="button" className="btn-primary-inline" onClick={() => onMoveToPath(OPS_CONSOLE_ROUTE)}>
            운영 콘솔 열기
          </button>
        </article>
      </div>
    </section>
  );
}

export default HomePage;
