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

  return (
    <section className="step-board" aria-label="단계별 작업 실행 보드">
      {lastStatusMessage ? <p className="step-board-status">{lastStatusMessage}</p> : null}
      <div className="step-board-grid">
        {tasks.map((task, index) => (
          (() => {
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
            return (
          <StepExecutionCard
            key={task.id}
            task={task}
            dummy={mergedDummy}
            state={taskRunStateById[task.id]}
            isActive={activeTaskId === task.id}
            isLast={index === tasks.length - 1}
            onSelect={onSelectTask}
            onExecute={onExecuteTask}
            onRetry={onRetryTask}
            onApproveNext={onApproveNextTask}
            onSkip={onSkipTask}
          />
            );
          })()
        ))}
      </div>
    </section>
  );
}

export default StepExecutionBoard;
