import { useMemo } from 'react';

const OPS_MODULE_CATEGORIES = [
  { id: 'diagnosis', title: '데이터 진단', aliases: ['diagnosis', '진단'] },
  { id: 'domain', title: '도메인 정의', aliases: ['domain', '도메인'] },
  { id: 'search', title: '데이터 탐색', aliases: ['search', '탐색'] },
  { id: 'matching', title: '정합성 검토', aliases: ['matching', '정합'] },
  { id: 'synthesis', title: '합성 데이터 설계', aliases: ['synthesis', '합성'] },
  { id: 'results', title: '결과 비교', aliases: ['results', '결과'] },
];

function normalizeLower(value) {
  return String(value || '').toLowerCase();
}

function matchesCategory(row, category) {
  const hay = `${normalizeLower(row.id)} ${normalizeLower(row.name)} ${normalizeLower(row.ref)}`;
  return category.aliases.some((alias) => hay.includes(normalizeLower(alias)));
}

function OpsConsolePage({ opsQuery, onOpsQueryChange, opsType, onOpsTypeChange, onMoveWorkspace, opsRows }) {
  const categoryCards = useMemo(() => {
    return OPS_MODULE_CATEGORIES.map((category) => {
      const snapshots = opsRows.filter(
        (row) => row.type === 'module-snapshot' && matchesCategory(row, category),
      );
      const candidateItems = snapshots.slice(0, 4).map((row) => row.name);
      return {
        ...category,
        snapshotCount: snapshots.length,
        candidateItems,
      };
    });
  }, [opsRows]);

  return (
    <section className="hub-page">
      <header className="hub-hero">
        <p className="hub-eyebrow">Ops Console</p>
        <h3 className="hub-hero-title">운영 콘솔</h3>
        <p className="hub-hero-lead">조회/모니터링 전용 화면입니다. 수정은 워크스페이스에서 진행하세요.</p>
      </header>
      <div className="ops-toolbar">
        <input value={opsQuery} onChange={(e) => onOpsQueryChange(e.target.value)} placeholder="이름/ID/참조 검색" />
        <select value={opsType} onChange={(e) => onOpsTypeChange(e.target.value)}>
          <option value="all">전체</option>
          <option value="data-source">데이터소스</option>
          <option value="pipeline">파이프라인</option>
          <option value="module-snapshot">모듈 스냅샷</option>
        </select>
        <button type="button" className="btn-primary-inline" onClick={onMoveWorkspace}>
          워크스페이스로 이동
        </button>
      </div>

      <section className="ops-module-cards" aria-label="6단계 모듈 카테고리">
        {categoryCards.map((card, index) => (
          <article key={card.id} className="ops-module-card">
            <div className="ops-module-card-head">
              <span className="ops-module-card-index">{index + 1}</span>
              <h4>{card.title}</h4>
            </div>
            <p className="ops-module-card-meta">저장된 단계 수: {card.snapshotCount}</p>
            <div className="ops-module-candidates">
              {card.candidateItems.length === 0 ? (
                <span className="ops-module-candidate-empty">후보 부가기능 없음</span>
              ) : (
                card.candidateItems.map((name) => (
                  <span key={`${card.id}-${name}`} className="ops-module-candidate-chip">
                    {name}
                  </span>
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      <div className="main-hub-table-wrap">
        <table className="main-hub-table">
          <thead>
            <tr>
              <th>유형</th>
              <th>ID</th>
              <th>이름</th>
              <th>상태</th>
              <th>참조</th>
            </tr>
          </thead>
          <tbody>
            {opsRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="main-hub-table-empty">
                  조회 결과가 없습니다.
                </td>
              </tr>
            ) : (
              opsRows.map((row) => (
                <tr key={`${row.type}-${row.id}`}>
                  <td>{row.type}</td>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.status}</td>
                  <td>{row.ref}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default OpsConsolePage;
