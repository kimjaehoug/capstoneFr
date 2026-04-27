import { Fragment, useCallback, useEffect, useState } from 'react';
import { ADDON_PARENT_ORDER, PARENT_CORE_LABELS } from '../data/domainModules';
import PipelineStageAddonColumn from './PipelineStageAddonColumn';

/**
 * 대안 A: 상단 6단계 진행바 + 중앙 선택 단계 상세
 */
function PipelineTimelineColumns({
  pipelineKey,
  editable,
  pipelineModuleIds,
  modules,
  moduleStatus,
  onOpenModule,
}) {
  const [addonSelectionsByScope, setAddonSelectionsByScope] = useState({});
  const [selectedStageId, setSelectedStageId] = useState(() => ADDON_PARENT_ORDER[0]);

  useEffect(() => {
    setSelectedStageId(ADDON_PARENT_ORDER[0]);
  }, [pipelineKey]);

  const selectionKeyBase = pipelineKey ?? '__default__';

  const getSelections = useCallback(
    (coreId) => addonSelectionsByScope[`${selectionKeyBase}::${coreId}`] ?? {},
    [addonSelectionsByScope, selectionKeyBase],
  );

  const handleToggle = useCallback(
    (coreId, addonId, checked) => {
      const k = `${selectionKeyBase}::${coreId}`;
      setAddonSelectionsByScope((prev) => ({
        ...prev,
        [k]: {
          ...(prev[k] ?? {}),
          [addonId]: checked,
        },
      }));
    },
    [selectionKeyBase],
  );

  const moduleLabelById = useCallback(
    (id) => modules.find((m) => m.id === id)?.label ?? PARENT_CORE_LABELS[id] ?? id,
    [modules],
  );

  const includedSet = new Set(pipelineModuleIds.filter((id) => ADDON_PARENT_ORDER.includes(id)));

  const stageIndex = ADDON_PARENT_ORDER.indexOf(selectedStageId);
  const resolvedStageId = stageIndex >= 0 ? selectedStageId : ADDON_PARENT_ORDER[0];
  const resolvedIndex = Math.max(0, ADDON_PARENT_ORDER.indexOf(resolvedStageId));

  return (
    <div className="pipeline-timeline">
      <div className="pipeline-timeline-toolbar">
        <span className="pipeline-timeline-toolbar-title">고정 처리 흐름 (6단계)</span>
        <span className="pipeline-timeline-toolbar-hint">
          위에서 단계를 선택하면 중앙에 해당 기본 단계와 부가 후보만 표시됩니다. AI 등급은 최우선·추천·검토·참고·비추천 순으로
          정렬됩니다.
        </span>
      </div>

      <nav className="pipeline-progress-rail" aria-label="파이프라인 6단계">
        <div className="pipeline-progress">
          {ADDON_PARENT_ORDER.map((coreId, idx) => {
            const active = resolvedStageId === coreId;
            const inPl = includedSet.has(coreId);
            return (
              <Fragment key={coreId}>
                <button
                  type="button"
                  className={`pipeline-progress-step ${active ? 'pipeline-progress-step--active' : ''} ${
                    inPl ? 'pipeline-progress-step--in' : 'pipeline-progress-step--out'
                  }`}
                  onClick={() => setSelectedStageId(coreId)}
                  aria-current={active ? 'step' : undefined}
                  title={`${idx + 1}. ${moduleLabelById(coreId)}${inPl ? '' : ' (파이프라인 미포함)'}`}
                >
                  <span className="pipeline-progress-step-num">{idx + 1}</span>
                  <span className="pipeline-progress-step-label">{moduleLabelById(coreId)}</span>
                </button>
                {idx < ADDON_PARENT_ORDER.length - 1 ? (
                  <span className="pipeline-progress-arrow" aria-hidden>
                    →
                  </span>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </nav>

      <div className="pipeline-timeline-detail">
        <PipelineStageAddonColumn
          variant="detail"
          coreModuleId={resolvedStageId}
          stageIndex={resolvedIndex + 1}
          stageLabel={moduleLabelById(resolvedStageId)}
          includedInPipeline={includedSet.has(resolvedStageId)}
          moduleStatus={moduleStatus}
          editable={editable}
          selection={getSelections(resolvedStageId)}
          onToggle={(addonId, checked) => handleToggle(resolvedStageId, addonId, checked)}
          onOpenStage={onOpenModule}
        />
      </div>
    </div>
  );
}

export default PipelineTimelineColumns;
