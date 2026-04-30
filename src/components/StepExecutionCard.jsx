function StepExecutionCard({
  task,
  dummy,
  state,
  isActive,
  isLast,
  isLocked,
  onSelect,
  onExecute,
  onRetry,
  onApproveNext,
  onSkip,
}) {
  const statusLabelMap = {
    idle: '진행 전',
    running: '실행 중',
    review: '검토 필요',
    done: '완료',
    failed: '실패',
    skipped: '건너뜀',
  };

  const status = state?.status || 'idle';
  const summary = state?.summary || '';

  const handleSkip = () => {
    if (isLocked) return;
    const reason = window.prompt('건너뛰는 사유를 간단히 입력해주세요.', state?.skipReason || '');
    if (reason == null) return;
    onSkip(task.id, reason.trim());
  };

  return (
    <article className={`step-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
      <header className="step-card-head">
        <button type="button" className="step-card-title" onClick={() => onSelect(task.id)} disabled={isLocked}>
          {task.label}
        </button>
        <span className={`status-pill mini ${status}`}>{statusLabelMap[status] || '진행 전'}</span>
      </header>
      {isLocked ? <p className="step-card-lock-note">이전 단계를 완료해야 이 단계를 열 수 있습니다.</p> : null}
      <p className="step-card-desc">{task.description || '이 단계의 설정을 확인하고 실행하세요.'}</p>
      {dummy?.inputSummary ? <p className="step-card-meta"><strong>입력:</strong> {dummy.inputSummary}</p> : null}
      {Array.isArray(dummy?.evidence) && dummy.evidence.length ? (
        <ul className="step-card-evidence">
          {dummy.evidence.map((item) => (
            <li key={`${task.id}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : null}
      {dummy?.expectedResult ? <p className="step-card-meta"><strong>예상 결과:</strong> {dummy.expectedResult}</p> : null}
      {Array.isArray(dummy?.subTasks) && dummy.subTasks.length ? (
        <div className="step-card-subtasks">
          <p className="step-card-subtasks-title">세부 작업</p>
          <div className="step-card-subtasks-list">
            {dummy.subTasks.map((item) => (
              <span key={`${task.id}-sub-${item}`} className="step-card-subtask-chip">{item}</span>
            ))}
          </div>
        </div>
      ) : null}
      {summary ? <p className="step-card-summary">요약: {summary}</p> : null}
      <div className="step-card-actions">
        <button type="button" className="btn-primary-inline" onClick={() => onExecute(task.id)} disabled={isLocked}>이 단계 실행</button>
        <button type="button" className="btn-secondary-inline" onClick={() => onRetry(task.id)} disabled={isLocked}>다시 실행</button>
        <button type="button" className="btn-secondary-inline" onClick={handleSkip} disabled={isLocked}>건너뛰기</button>
        <button
          type="button"
          className="btn-secondary-inline"
          onClick={() => onApproveNext(task.id)}
          disabled={isLocked || !['review', 'done', 'skipped'].includes(status)}
        >
          {isLast ? '결과 리포트로' : '다음 단계'}
        </button>
      </div>
    </article>
  );
}

export default StepExecutionCard;
