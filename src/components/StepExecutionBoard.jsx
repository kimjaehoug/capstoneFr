import StepExecutionCard from './StepExecutionCard';
import { EXECUTION_DUMMY_BY_TASK } from '../data/executionDummyModules';
import { DOMAIN_MODULES } from '../data/domainModules';

function buildAddonSubTasksByCore() {
  return DOMAIN_MODULES.reduce((acc, moduleDef) => {
    const core = moduleDef.parentCoreModule;
    if (!core) return acc;
    if (!acc[core]) acc[core] = [];
    acc[core].push(moduleDef.label);
    return acc;
  }, {});
}

const ADDON_SUBTASKS_BY_CORE = buildAddonSubTasksByCore();

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

  const completionStates = new Set(['done', 'skipped']);
  const firstLockedIndex = tasks.findIndex((task) => !completionStates.has(taskRunStateById[task.id]?.status));
  const maxUnlockedIndex = firstLockedIndex === -1 ? tasks.length - 1 : firstLockedIndex;
  const activeIndex = tasks.findIndex((task) => task.id === activeTaskId);
  const currentIndex = activeIndex >= 0 ? activeIndex : (firstLockedIndex === -1 ? tasks.length - 1 : firstLockedIndex);
  const currentTask = tasks[currentIndex];

  const resolveDummy = (task) => {
    const coreTaskId = task.parentCoreModule || task.id;
    const baseDummy = EXECUTION_DUMMY_BY_TASK[coreTaskId] || EXECUTION_DUMMY_BY_TASK[task.id] || null;
    const fallbackSubTasks = ADDON_SUBTASKS_BY_CORE[coreTaskId] || [];
    const mergedDummy = baseDummy
      ? {
          ...baseDummy,
          subTasks: baseDummy.subTasks?.length ? baseDummy.subTasks : fallbackSubTasks,
        }
      : fallbackSubTasks.length
        ? {
            inputSummary: `${task.label} 단계 임시 입력`,
            evidence: [],
            expectedResult: '세부 작업 실행 준비',
            subTasks: fallbackSubTasks,
          }
        : null;
    return mergedDummy;
  };

  return (
    <section className="step-board" aria-label="단계별 작업 실행 보드">
      {lastStatusMessage ? <p className="step-board-status">{lastStatusMessage}</p> : null}
      <div className="step-wizard-stepper" role="tablist" aria-label="단계 진행 상태">
        {tasks.map((task, index) => {
          const state = taskRunStateById[task.id]?.status || 'idle';
          const isLocked = index > maxUnlockedIndex;
          const isCurrent = index === currentIndex;
          return (
            <button
              key={task.id}
              type="button"
              className={`step-wizard-step ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && onSelectTask(task.id)}
              disabled={isLocked}
            >
              <span className="step-wizard-step-index">{index + 1}</span>
              <span className="step-wizard-step-label">{task.label}</span>
              <span className={`status-pill mini ${state}`}>{state}</span>
            </button>
          );
        })}
      </div>

      <div className="step-wizard-current">
        <StepExecutionCard
          key={currentTask.id}
          task={currentTask}
          dummy={resolveDummy(currentTask)}
          state={taskRunStateById[currentTask.id]}
          isActive
          isLast={currentIndex === tasks.length - 1}
          isLocked={false}
          onSelect={onSelectTask}
          onExecute={onExecuteTask}
          onRetry={onRetryTask}
          onApproveNext={onApproveNextTask}
          onSkip={onSkipTask}
        />
      </div>

      <div className="step-wizard-history">
        {tasks.slice(0, currentIndex).map((task, index) => {
          const state = taskRunStateById[task.id]?.status || 'idle';
          return (
            <div key={task.id} className="step-wizard-history-item">
              <span>{index + 1}. {task.label}</span>
              <span className={`status-pill mini ${state}`}>{state}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StepExecutionBoard;
