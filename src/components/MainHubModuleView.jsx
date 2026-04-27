import { useState } from 'react';
import { ADDON_PARENT_ORDER, PARENT_CORE_LABELS } from '../data/domainModules';

/** 기본 구조 모듈: 한 줄 요약 · 호버 시 같은 칸에서 상세 문구로 교체 */
const CORE_MODULE_UI = {
  diagnosis: {
    summary: '데이터 형태·불균형을 빠르게 점검합니다.',
    detail:
      '데이터 크기, 컬럼 목록, 데이터 타입, 결측치 개수, 클래스 분포, 불균형 의심 여부 등을 확인합니다.',
  },
  domain: {
    summary: '어떤 이상탐지 문제를 풀지 도메인·태스크를 정의합니다.',
    detail:
      '의료 데이터 여부, 이상탐지 태스크, 분석·라벨 컬럼 선택, 정상·이상 클래스 지정, 분석 목적 입력 등을 다룹니다.',
  },
  search: {
    summary: '도메인 기반으로 외부 데이터 후보를 찾습니다.',
    detail:
      '검색어 초안 생성, 공개 데이터셋 후보 검색, 이름·링크 수집, 간단 요약, 접근 가능 여부 확인 등을 합니다.',
  },
  matching: {
    summary: '외부 데이터를 붙일 수 있는지 구조적으로 검토합니다.',
    detail:
      '컬럼명 유사도, 데이터 타입 비교, 라벨 존재 여부, 단위·변수 범위 비교, 병합 가능 여부 1차 판단 등을 합니다.',
  },
  synthesis: {
    summary: '어떤 클래스를 얼마나 보완할지 합성 설계를 합니다.',
    detail:
      '보완 대상 클래스 선택, 목표 클래스 비율, 증강 방식, 합성 생성 수, 기본 제약조건 입력 등을 설정합니다.',
  },
  results: {
    summary: '보완 전후 결과를 기본 지표로 비교합니다.',
    detail:
      '원본·보완 데이터 크기, 클래스 분포 변화, 기본 모델 성능, Accuracy·Precision·Recall·F1 등 지표 비교와 결과 요약을 제공합니다.',
  },
};

function MainHubModuleView({ modules, moduleStatus, onOpenModule }) {
  const list = modules.filter((m) => m.id !== 'workflow');
  const coreModuleIds = new Set(['diagnosis', 'domain', 'search', 'matching', 'synthesis', 'results']);
  const coreModules = list.filter((m) => coreModuleIds.has(m.id));
  const addonModules = list.filter((m) => !coreModuleIds.has(m.id));

  const addonGroups = ADDON_PARENT_ORDER.map((parentId) => ({
    parentId,
    title: PARENT_CORE_LABELS[parentId],
    modules: addonModules.filter((m) => m.parentCoreModule === parentId),
  })).filter((g) => g.modules.length > 0);

  const [addonTab, setAddonTab] = useState(null);

  const activeAddonParentId =
    addonTab != null && addonGroups.some((g) => g.parentId === addonTab)
      ? addonTab
      : addonGroups[0]?.parentId ?? ADDON_PARENT_ORDER[0];

  const activeAddonGroup = addonGroups.find((g) => g.parentId === activeAddonParentId);

  const renderModuleGrid = (items, { isCore } = {}) => (
    <div
      className={`card-grid main-hub-module-grid${isCore ? ' main-hub-module-grid--core' : ' main-hub-module-grid--addon'}`}
    >
      {items.map((module) => {
        const coreUi = isCore ? CORE_MODULE_UI[module.id] : null;
        const hasDetailSwap = Boolean(coreUi?.detail?.trim());

        return (
          <div
            key={module.id}
            className={`main-hub-module-card-wrap${hasDetailSwap ? ' main-hub-module-card-wrap--detail-hover' : ''}`}
          >
            <article
              className={`card workflow-card main-hub-module-card${isCore ? '' : ' main-hub-module-card--addon'}`}
            >
              <div className="workflow-card-head">
                <h4>{module.label}</h4>
                <span className={`status-pill mini ${moduleStatus[module.id]?.state || 'draft'}`}>
                  {moduleStatus[module.id]?.label || '미저장'}
                </span>
              </div>
              {hasDetailSwap ? (
                <div className="main-hub-module-card-summary-slot">
                  <p className="main-hub-module-card-summary main-hub-module-card-summary--short">{coreUi.summary}</p>
                  <p className="main-hub-module-card-summary main-hub-module-card-summary--detail">{coreUi.detail}</p>
                </div>
              ) : (
                <p
                  className={`main-hub-module-card-summary${!isCore ? ' main-hub-module-card-summary--addon' : ''}`}
                >
                  {module.description}
                </p>
              )}
              <button type="button" className="btn-primary-inline" onClick={() => onOpenModule(module.id)}>
                모듈 열기
              </button>
            </article>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="main-hub-modules">
      <header className="main-hub-section-head">
        <h3 className="main-hub-section-title">모듈 조회/관리</h3>
        <p className="main-hub-section-desc">
          워크벤치에서 사용할 수 있는 기본·도메인 모듈을 살펴보고 열어보세요.
        </p>
      </header>

      <section className="main-hub-module-section" aria-labelledby="main-hub-core-modules-title">
        <div className="main-hub-module-section-head">
          <h4 id="main-hub-core-modules-title" className="main-hub-module-section-title">
            기본 구조 모듈
          </h4>
          <span className="main-hub-module-section-count">{coreModules.length}개</span>
        </div>
        {renderModuleGrid(coreModules, { isCore: true })}
      </section>

      <section className="main-hub-module-section" aria-labelledby="main-hub-addon-modules-title">
        <div className="main-hub-module-section-head">
          <h4 id="main-hub-addon-modules-title" className="main-hub-module-section-title">
            부가 구조 모듈
          </h4>
          <span className="main-hub-module-section-count">{addonModules.length}개</span>
        </div>
        <div className="main-hub-addon-toolbar">
          <p className="main-hub-addon-intro">
            단계를 골라 해당 부가 모듈를 확인하세요.
          </p>
          <div className="main-hub-addon-tablist" role="tablist" aria-label="부가 모듈 기본 단계">
            {addonGroups.map((group) => {
              const selected = group.parentId === activeAddonParentId;
              return (
                <button
                  key={group.parentId}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`addon-tab-${group.parentId}`}
                  className={`main-hub-addon-tab${selected ? ' main-hub-addon-tab--active' : ''}`}
                  onClick={() => setAddonTab(group.parentId)}
                >
                  <span className="main-hub-addon-tab-label">{group.title}</span>
                  <span className="main-hub-addon-tab-count">{group.modules.length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="main-hub-addon-panel"
          role="tabpanel"
          aria-labelledby={`addon-tab-${activeAddonParentId}`}
        >
          {activeAddonGroup ? (
            renderModuleGrid(activeAddonGroup.modules)
          ) : (
            <p className="main-hub-addon-empty">표시할 부가 모듈이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default MainHubModuleView;
