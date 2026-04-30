import { useMemo } from 'react';
import { DOMAIN_MODULES } from '../../data/domainModules';

function candidatesForCore(coreModuleId) {
  return DOMAIN_MODULES.filter((m) => m.parentCoreModule === coreModuleId);
}

function hashFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i) * (i + 3)) % 1009;
  }
  return h;
}

/** 등급 높은 순 정렬용 (프로토타입 모의값) */
export function mockAddonRecommendation(addonId) {
  const h = hashFromId(addonId);
  const reasons = [
    '현재 표본에서 해당 리스크·왜곡 신호가 상대적으로 큽니다.',
    '단계 목표와 데이터 특성(결측·불균형)이 맞물릴 가능성이 높습니다.',
    '유사 워크플로에서 재현·안정성 개선 사례가 있습니다.',
    '외부 근거·가이드라인과 연결하기 좋은 보완 축입니다.',
    '후속 단계 오류 전파를 줄이는 선행 점검에 도움이 됩니다.',
  ];
  const conditions = [
    '이상 클래스 비율이 일정 기준 미만일 때',
    '시계열 관측 길이가 최소 창 길이 이상일 때',
    '주요 입력 변수 결측률이 상한 이내일 때',
    '외부 후보 데이터와 매핑 가능한 키가 존재할 때',
    '예측 시점·라벨 정의가 확정된 이후에만',
  ];

  let tier;
  let tierLabel;
  let rank;
  const r = h % 12;
  if (r >= 10) {
    tier = 'priority';
    tierLabel = '최우선';
    rank = 4;
  } else if (r >= 7) {
    tier = 'recommend';
    tierLabel = '추천';
    rank = 3;
  } else if (r >= 4) {
    tier = 'optional';
    tierLabel = '검토';
    rank = 2;
  } else if (r >= 1) {
    tier = 'weak';
    tierLabel = '참고';
    rank = 1;
  } else {
    tier = 'none';
    tierLabel = '비추천';
    rank = 0;
  }

  const aiRecommended = tier !== 'none';

  return {
    aiRecommended,
    tier,
    tierLabel,
    rank,
    reason: reasons[h % reasons.length],
    condition: conditions[h % conditions.length],
  };
}

export default function PipelineStageAddonColumn({
  coreModuleId,
  stageIndex,
  stageLabel,
  includedInPipeline,
  moduleStatus,
  editable,
  selection,
  onToggle,
  onOpenStage,
  /** rail: 좁은 칼럼 · detail: 중앙 단일 상세 */
  variant = 'rail',
}) {
  const addonsWithMeta = useMemo(() => {
    const list = candidatesForCore(coreModuleId).map((addon) => ({
      addon,
      meta: mockAddonRecommendation(addon.id),
    }));
    list.sort((a, b) => {
      if (a.meta.rank !== b.meta.rank) return b.meta.rank - a.meta.rank;
      return a.addon.label.localeCompare(b.addon.label, 'ko');
    });
    return list;
  }, [coreModuleId]);

  return (
    <section
      className={`pipeline-stage-column ${includedInPipeline ? 'pipeline-stage-column--in' : 'pipeline-stage-column--out'} ${
        variant === 'detail' ? 'pipeline-stage-column--detail' : ''
      }`}
      data-stage={coreModuleId}
    >
      <header className="pipeline-stage-column-head">
        <button
          type="button"
          className="pipeline-stage-column-open"
          onDoubleClick={() => onOpenStage(coreModuleId)}
          title="더블클릭: 기본 모듈 열기"
        >
          <span className="pipeline-stage-column-index">{stageIndex}</span>
          <div className="pipeline-stage-column-titles">
            <span className="pipeline-stage-column-eyebrow">기본 단계</span>
            <span className="pipeline-stage-column-label">{stageLabel}</span>
            {!includedInPipeline ? (
              <span className="pipeline-stage-column-badge">미포함</span>
            ) : (
              <span className={`status-pill mini ${moduleStatus?.[coreModuleId]?.state || 'draft'}`}>
                {moduleStatus?.[coreModuleId]?.label || '미저장'}
              </span>
            )}
          </div>
        </button>
      </header>

      <div className="pipeline-stage-column-body">
        <div className="pipeline-stage-addon-well">
          <div className="pipeline-stage-addon-well-head">
            <span className="pipeline-stage-addon-well-mark" aria-hidden>
              └
            </span>
            <div className="pipeline-stage-addon-well-titles">
              <span className="pipeline-stage-addon-well-title">후보 부가 기능</span>
              <span className="pipeline-stage-addon-well-caption">선택만 가능 · 순서 고정 단계 아님</span>
            </div>
          </div>

          {addonsWithMeta.length === 0 ? (
            <p className="pipeline-stage-column-empty">등록된 후보가 없습니다.</p>
          ) : (
            <ul className="pipeline-stage-addon-list">
              {addonsWithMeta.map(({ addon, meta }) => {
                const checked = Boolean(selection[addon.id]);
                return (
                  <li key={addon.id} className={`pipeline-stage-addon-item pipeline-stage-addon-item--tier-${meta.tier}`}>
                    <div className="pipeline-stage-addon-block">
                      <div className="pipeline-stage-addon-title-row">
                        <input
                          id={`pa-${coreModuleId}-${addon.id}`}
                          className="pipeline-stage-addon-input"
                          type="checkbox"
                          checked={checked}
                          disabled={!editable}
                          onChange={(e) => onToggle(addon.id, e.target.checked)}
                        />
                        <label
                          className="pipeline-stage-addon-title"
                          htmlFor={`pa-${coreModuleId}-${addon.id}`}
                        >
                          {addon.label}
                        </label>
                      </div>
                      <span
                        className={`pipeline-stage-addon-ai pipeline-stage-addon-ai--tier-${meta.tier}`}
                        title={`AI 등급: ${meta.tierLabel}`}
                      >
                        <span className="pipeline-stage-addon-ai-prefix">AI</span>
                        {meta.tierLabel}
                      </span>
                    </div>
                    <div className="pipeline-stage-addon-meta">
                      <div>
                        <span className="pipeline-stage-addon-k">추천 사유</span>
                        <p className="pipeline-stage-addon-v">{meta.reason}</p>
                      </div>
                      <div>
                        <span className="pipeline-stage-addon-k">적용 조건</span>
                        <p className="pipeline-stage-addon-v">{meta.condition}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
