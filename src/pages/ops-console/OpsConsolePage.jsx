import { useMemo, useState } from 'react';

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

function OpsConsolePage({
  opsQuery,
  onOpsQueryChange,
  opsType,
  onOpsTypeChange,
  onMoveWorkspace,
  opsRows,
  dataSources = [],
  userPipelines = [],
  onUpdateDataSource,
  onDeleteDataSource,
  onOpenDataSourceInWorkspace,
  onUpdateUserPipeline,
  onDeleteUserPipeline,
  onOpenPipelineInWorkspace,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

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

  const selectedCategory = useMemo(
    () => OPS_MODULE_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId],
  );

  const selectedCategoryTaskStates = useMemo(() => {
    if (!selectedCategory) return [];
    return opsRows.filter(
      (row) => row.type === 'task-state' && matchesCategory(row, selectedCategory),
    );
  }, [opsRows, selectedCategory]);

  const handleEditDataSource = async (row) => {
    if (!onUpdateDataSource) return;
    const name = window.prompt('데이터 이름', row.name || '');
    if (name == null) return;
    const source = window.prompt('데이터 출처', row.source || '');
    if (source == null) return;
    const rowsLabel = window.prompt('행 수 라벨', row.rows || '');
    if (rowsLabel == null) return;
    await onUpdateDataSource({
      ...row,
      name: name.trim() || row.name,
      source: source.trim() || row.source,
      rowsLabel: rowsLabel.trim() || row.rowsLabel || '-',
    });
  };

  const handleEditPipeline = async (pipeline) => {
    if (!onUpdateUserPipeline) return;
    const title = window.prompt('파이프라인 이름', pipeline.title || '');
    if (title == null) return;
    const description = window.prompt('파이프라인 설명', pipeline.description || '');
    if (description == null) return;
    await onUpdateUserPipeline(pipeline.id, {
      title: title.trim() || pipeline.title,
      description: description.trim(),
      clearAutoNamed: true,
    });
  };

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
          <option value="task-state">작업 상태</option>
        </select>
        <button type="button" className="btn-primary-inline" onClick={onMoveWorkspace}>
          워크스페이스로 이동
        </button>
      </div>

      <section className="ops-module-cards" aria-label="6단계 모듈 카테고리">
        {categoryCards.map((card, index) => (
          <article
            key={card.id}
            className={`ops-module-card clickable ${selectedCategoryId === card.id ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId((prev) => (prev === card.id ? null : card.id))}
          >
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

      {selectedCategory ? (
        <section className="card" aria-label={`${selectedCategory.title} 작업 상태`}>
          <h4>{selectedCategory.title} 작업 상태</h4>
          <p className="hub-hero-lead">단계 실행에서 발생한 최신 상태를 조회합니다.</p>
          <div className="main-hub-table-wrap">
            <table className="main-hub-table">
              <thead>
                <tr>
                  <th>작업</th>
                  <th>상태</th>
                  <th>요약</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategoryTaskStates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="main-hub-table-empty">
                      해당 단계의 작업 상태가 아직 없습니다.
                    </td>
                  </tr>
                ) : (
                  selectedCategoryTaskStates.map((row) => (
                    <tr key={`task-${row.id}`}>
                      <td>{row.name}</td>
                      <td>
                        <span className={`status-pill mini ${row.status || 'idle'}`}>{row.status || 'idle'}</span>
                      </td>
                      <td>{row.ref || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="ops-management-grid" aria-label="내 데이터/파이프라인 관리">
        <article className="card">
          <h4>내 데이터 DB 관리</h4>
          <p className="hub-hero-lead">운영 콘솔에서 데이터 이름/출처 수정 및 삭제를 바로 수행할 수 있습니다.</p>
          <div className="main-hub-table-wrap">
            <table className="main-hub-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>출처</th>
                  <th>행 수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="main-hub-table-empty">
                      등록된 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  dataSources.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.source}</td>
                      <td>{row.rows}</td>
                      <td className="ops-actions-cell">
                        <button type="button" className="btn-secondary-inline" onClick={() => onOpenDataSourceInWorkspace?.(row.id)}>
                          이동
                        </button>
                        <button type="button" className="btn-secondary-inline" onClick={() => handleEditDataSource(row)}>
                          수정
                        </button>
                        <button type="button" className="btn-danger-inline" onClick={() => onDeleteDataSource?.(row.id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h4>내 파이프라인 DB 관리</h4>
          <p className="hub-hero-lead">파이프라인 제목/설명을 수정하고 삭제할 수 있습니다.</p>
          <div className="main-hub-table-wrap">
            <table className="main-hub-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>도메인</th>
                  <th>모듈 수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {userPipelines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="main-hub-table-empty">
                      생성된 파이프라인이 없습니다.
                    </td>
                  </tr>
                ) : (
                  userPipelines.map((pipeline) => (
                    <tr key={pipeline.id}>
                      <td>{pipeline.title}</td>
                      <td>{pipeline.domainLabel || '-'}</td>
                      <td>{pipeline.moduleIds?.length ?? 0}</td>
                      <td className="ops-actions-cell">
                        <button type="button" className="btn-secondary-inline" onClick={() => onOpenPipelineInWorkspace?.(pipeline.id)}>
                          이동
                        </button>
                        <button type="button" className="btn-secondary-inline" onClick={() => handleEditPipeline(pipeline)}>
                          수정
                        </button>
                        <button type="button" className="btn-danger-inline" onClick={() => onDeleteUserPipeline?.(pipeline.id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/*<div className="main-hub-table-wrap">
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
      </div>*/}
    </section>
  );
}

export default OpsConsolePage;
