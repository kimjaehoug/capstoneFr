function PipelineComposerBar({
  activeUserPipeline,
  modules,
  onSelectModule,
  onAddModule,
  onRemoveModule,
  onMoveModule,
  onConnectAfter,
  onDisconnectAfter,
}) {
  if (!activeUserPipeline) return null;

  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const moduleIds = activeUserPipeline.moduleIds || [];
  const connectedAfter = activeUserPipeline.connectedAfter || [];

  return (
    <section className="pipeline-composer-bar">
      <div className="pipeline-composer-head">
        <strong>Pipeline Composer</strong>
        <span>{activeUserPipeline.title}</span>
      </div>
      <div className="pipeline-composer-chain">
        {moduleIds.map((moduleId, index) => {
          const module = moduleMap.get(moduleId);
          const canMoveUp = index > 0;
          const canMoveDown = index < moduleIds.length - 1;
          const canRemove = moduleIds.length > 1;
          const hasEdge = index < moduleIds.length - 1;
          const edgeConnected = Boolean(connectedAfter[index]);
          return (
            <div key={moduleId} className="pipeline-composer-item">
              <button type="button" className="pipeline-composer-label" onClick={() => onSelectModule(moduleId)}>
                {module?.label || moduleId}
              </button>
              <div className="pipeline-composer-actions">
                <button type="button" disabled={!canMoveUp} onClick={() => onMoveModule(index, index - 1)}>↑</button>
                <button type="button" disabled={!canMoveDown} onClick={() => onMoveModule(index, index + 1)}>↓</button>
                <button type="button" disabled={!canRemove} onClick={() => onRemoveModule(moduleId)}>제거</button>
                {hasEdge ? (
                  edgeConnected ? (
                    <button type="button" onClick={() => onDisconnectAfter(index)}>연결해제</button>
                  ) : (
                    <button type="button" onClick={() => onConnectAfter(moduleId, moduleIds[index + 1])}>연결</button>
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pipeline-composer-add">
        <label>모듈 추가</label>
        <select onChange={(e) => e.target.value && onAddModule(e.target.value)} defaultValue="">
          <option value="">추가할 모듈 선택</option>
          {modules
            .filter((m) => m.id !== 'workflow' && !moduleIds.includes(m.id))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
        </select>
      </div>
    </section>
  );
}

export default PipelineComposerBar;
