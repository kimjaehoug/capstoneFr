function OpsConsolePage({ opsQuery, onOpsQueryChange, opsType, onOpsTypeChange, onMoveWorkspace, opsRows }) {
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
