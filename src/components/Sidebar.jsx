import { useState } from 'react';

const MAIN_HUB_SECTIONS = [
  { id: 'data', label: '데이터 조회/관리' },
  { id: 'pipeline', label: '파이프라인 조회/관리' },
  { id: 'modules', label: '모듈 조회/관리' },
];

function SidebarHomeNav({ activeSection, onSelectSection }) {
  return (
    <nav className="sidebar-main-nav" aria-label="메인 메뉴">
      <p className="sidebar-main-nav-hint">메뉴를 선택하면 중앙 영역이 바뀝니다.</p>
      <ul className="sidebar-main-nav-list">
        {MAIN_HUB_SECTIONS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={`sidebar-main-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onSelectSection(item.id)}
            >
              <span className="sidebar-main-nav-index">{index + 1}</span>
              <span className="sidebar-main-nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CollapsibleSection({ id, title, count, open, onToggle, children }) {
  return (
    <div className={`sidebar-collapsible ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="sidebar-collapsible-toggle"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <span className="sidebar-collapsible-chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className="sidebar-collapsible-label">{title}</span>
        {count != null ? <span className="sidebar-collapsible-count">{count}</span> : null}
      </button>
      {open ? <div className="sidebar-collapsible-body">{children}</div> : null}
    </div>
  );
}

function Sidebar({
  showModuleSidebar,
  workflowModule,
  baseModules,
  domainModules,
  mainHubSection,
  onMainHubSectionChange,
  moduleSidebarFocus,
  onModuleSidebarFocus,
  onOpenModuleSettings,
  moduleStatus,
  activeUserPipeline,
  onClearUserPipeline,
  onAddModuleToUserPipeline,
  onRemoveModuleFromUserPipeline,
  collapsed = false,
  onToggleCollapsed = () => {},
}) {
  const editingPipeline = Boolean(activeUserPipeline);
  const [sectionOpen, setSectionOpen] = useState({ base: true, domain: true });

  const toggleSection = (sid) => {
    setSectionOpen((prev) => ({ ...prev, [sid]: !prev[sid] }));
  };

  const renderModuleButton = (module, { domainStyle } = {}) => {
    const status = moduleStatus[module.id];

    if (module.id === 'workflow') {
      return (
        <button
          key={module.id}
          type="button"
          className={`module-button ${moduleSidebarFocus === module.id ? 'active' : ''}`}
          title="클릭: 선택 · 더블클릭: 허브/설정 화면"
          onClick={() => onModuleSidebarFocus(module.id)}
          onDoubleClick={() => onOpenModuleSettings(module.id)}
        >
          <span className="module-label-row">
            <span className="module-label">{module.label}</span>
            <span className={`status-dot ${status?.state || 'draft'}`} />
          </span>
          <span className="module-description">{module.description}</span>
          {status && <span className="module-meta">{status.summary}</span>}
        </button>
      );
    }

    const inPipeline =
      editingPipeline && activeUserPipeline.moduleIds.includes(module.id);
    const canRemove = editingPipeline && activeUserPipeline.moduleIds.length > 1;

    return (
      <div key={module.id} className="module-row">
        <button
          type="button"
          className={`module-button ${domainStyle ? 'module-button-domain' : ''} ${
            moduleSidebarFocus === module.id ? 'active' : ''
          } ${editingPipeline && !inPipeline ? 'module-button-dim' : ''}`}
          title="클릭: 선택 · 더블클릭: 설정 화면"
          onClick={() => onModuleSidebarFocus(module.id)}
          onDoubleClick={() => onOpenModuleSettings(module.id)}
        >
          <span className="module-label-row">
            <span className="module-label">{module.label}</span>
            <span className={`status-dot ${status?.state || 'draft'}`} />
          </span>
          <span className="module-description">{module.description}</span>
          {status && <span className="module-meta">{status.summary}</span>}
        </button>
        {editingPipeline && (
          <div className="module-pipeline-actions">
            {inPipeline ? (
              <button
                type="button"
                className="module-pipeline-toggle remove"
                disabled={!canRemove}
                title={canRemove ? '파이프라인에서 제거' : '최소 1개 모듈은 필요합니다'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveModuleFromUserPipeline(module.id);
                }}
              >
                −
              </button>
            ) : (
              <button
                type="button"
                className="module-pipeline-toggle add"
                title="파이프라인에 추가"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddModuleToUserPipeline(module.id);
                }}
              >
                +
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <aside className="sidebar sidebar--collapsed panel" aria-label="접힌 메뉴">
        <button
          type="button"
          className="sidebar-rail-expand"
          onClick={onToggleCollapsed}
          title="메뉴 펼치기"
        >
          <span className="sidebar-rail-chevron" aria-hidden>
            »
          </span>
          <span className="sidebar-rail-text">메뉴</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar panel">
      <div className="sidebar-header-row">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">AI Workbench</h1>
          <span className="sidebar-badge">Beta</span>
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          title="메뉴 접기"
          aria-label="왼쪽 메뉴 접기"
        >
          «
        </button>
      </div>
      <p className={`sidebar-subtitle ${showModuleSidebar ? '' : 'sidebar-subtitle-home'}`}>
        {showModuleSidebar
          ? '모듈별 저장본을 기준으로 유연하게 이동합니다. 목록은 한 번 클릭해 선택, 두 번 클릭해 설정 화면으로 엽니다.'
          : '메뉴에서 영역을 고른 뒤 중앙에서 작업합니다.'}
      </p>

      {!showModuleSidebar ? (
        <SidebarHomeNav activeSection={mainHubSection} onSelectSection={onMainHubSectionChange} />
      ) : (
        <>
          {editingPipeline && (
            <div className="sidebar-pipeline-edit">
              <div className="sidebar-pipeline-edit-head">
                <span className="sidebar-pipeline-label">내 파이프라인 편집</span>
                <button type="button" className="sidebar-pipeline-clear" onClick={onClearUserPipeline}>
                  종료
                </button>
              </div>
              <p className="sidebar-pipeline-title" title={activeUserPipeline.title}>
                {activeUserPipeline.title}
              </p>
              <p className="sidebar-pipeline-hint">+ / − 로 파이프라인에 모듈을 넣거나 뺍니다.</p>
            </div>
          )}

          <div className="module-list module-list-categorized">
            {renderModuleButton(workflowModule, { domainStyle: false })}

            <CollapsibleSection
              id="base"
              title="기본 모듈"
              count={baseModules.length}
              open={sectionOpen.base}
              onToggle={toggleSection}
            >
              <div className="sidebar-module-stack">{baseModules.map((m) => renderModuleButton(m))}</div>
            </CollapsibleSection>

            {domainModules.length > 0 ? (
              <CollapsibleSection
                id="domain"
                title="도메인 모듈"
                count={domainModules.length}
                open={sectionOpen.domain}
                onToggle={toggleSection}
              >
                <div className="sidebar-module-stack">
                  {domainModules.map((m) => renderModuleButton(m, { domainStyle: true }))}
                </div>
              </CollapsibleSection>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}

export default Sidebar;
