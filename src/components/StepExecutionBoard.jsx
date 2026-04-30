import StepExecutionCard from './StepExecutionCard';

function StepExecutionBoard({
  tasks,
  activeTaskId,
  taskRunStateById,
  lastStatusMessage,
  onSelectTask,
  onExecuteTask,
  onRetryTask,
  onApproveNextTask,
  onSkipTask,
}) {
  if (!tasks.length) {
    return (
      <section className="step-board-empty">
        <p>실행할 작업 단계가 없습니다. 파이프라인을 먼저 선택하거나 구성하세요.</p>
      </section>
    );
  }

  return (
    <section className="step-board" aria-label="단계별 작업 실행 보드">
      {lastStatusMessage ? <p className="step-board-status">{lastStatusMessage}</p> : null}
      <div className="step-board-grid">
        {tasks.map((task, index) => (
          <StepExecutionCard
            key={task.id}
            task={task}
            state={taskRunStateById[task.id]}
            isActive={activeTaskId === task.id}
            isLast={index === tasks.length - 1}
            onSelect={onSelectTask}
            onExecute={onExecuteTask}
            onRetry={onRetryTask}
            onApproveNext={onApproveNextTask}
            onSkip={onSkipTask}
          />
        ))}
      </div>
    </section>
  );
}

export default StepExecutionBoard;
