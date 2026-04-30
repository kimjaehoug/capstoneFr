import { useMemo, useState } from 'react';
import { ADDON_PARENT_ORDER, PARENT_CORE_LABELS } from '../data/domainModules';
import { LOGIN_ROUTE } from '../shared/constants/routes';
import './Sidebar.css';

function CollapsibleSection({ id, title, count, open, onToggle, children }) {
  return (
    <div className={`sidebar-collapsible ${open ? 'is-open' : ''}`}>
      <button type="button" className="sidebar-collapsible-toggle" onClick={() => onToggle(id)}>
        <span className="sidebar-collapsible-chevron">{open ? '▾' : '▸'}</span>
        <span className="sidebar-collapsible-label">{title}</span>
        {count != null && <span className="sidebar-collapsible-count">{count}</span>}
      </button>
      {open && <div className="sidebar-collapsible-body">{children}</div>}
    </div>
  );
}

function Sidebar({
  auth, isAuthenticated, moveToPath, handleLogout, handleGoHome,
  showModuleSidebar, workflowModule, baseModules, domainModules,
  mainHubSection, onMainHubSectionChange, moduleSidebarFocus,
  onModuleSidebarFocus, onOpenModuleSettings, moduleStatus,
  activeUserPipeline, onClearUserPipeline, onAddModuleToUserPipeline,
  onRemoveModuleFromUserPipeline
}) {
  const editingPipeline = Boolean(activeUserPipeline);
  
  const [sectionOpen, setSectionOpen] = useState({ base: true, domain: true });
  const [openDomainStageId, setOpenDomainStageId] = useState(null);
  
  const toggleSection = (sid) => setSectionOpen((prev) => ({ ...prev, [sid]: !prev[sid] }));
  const toggleDomainStage = (parentId) => setOpenDomainStageId((cur) => (cur === parentId ? null : parentId));

  const domainAddonGroups = useMemo(() => {
    return ADDON_PARENT_ORDER.map((parentId) => ({
      parentId, title: PARENT_CORE_LABELS[parentId],
      modules: domainModules.filter((m) => m.parentCoreModule === parentId),
    })).filter((g) => g.modules.length > 0);
  }, [domainModules]);

  const renderModuleButton = (module, { domainStyle, compact } = {}) => {
    const status = moduleStatus[module.id];
    const inPipeline = editingPipeline && activeUserPipeline.moduleIds.includes(module.id);
    const canRemove = editingPipeline && activeUserPipeline.moduleIds.length > 1;

    return (
      <div key={module.id} className="module-row">
        <button
          type="button"
          className={`module-button ${moduleSidebarFocus === module.id ? 'active' : ''} ${editingPipeline && !inPipeline ? 'module-button-dim' : ''}`}
          onClick={() => onModuleSidebarFocus(module.id)}
          onDoubleClick={() => onOpenModuleSettings(module.id)}
        >
          <span className="module-label-row">
            <span className="module-label">{module.label}</span>
            <span className={`status-dot ${status?.state || 'draft'}`} />
          </span>
          {!compact && <span className="module-description">{module.description}</span>}
        </button>
        {editingPipeline && (
          <div className="module-pipeline-actions">
            {inPipeline ? (
              <button className="module-pipeline-toggle remove" disabled={!canRemove} onClick={() => onRemoveModuleFromUserPipeline(module.id)}>−</button>
            ) : (
              <button className="module-pipeline-toggle add" onClick={() => onAddModuleToUserPipeline(module.id)}>+</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="integrated-header">
        <div className="header-inner">
          <div className="header-left-group">
            <button type="button" className="header-brand-btn" onClick={handleGoHome}>
              <div className="login-logo-header">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="logo-text-main">WWorkbench</span>
            </button>
          </div>
          <div className="header-right-group">
            {isAuthenticated ? (
              <div className="top-auth-box">
                <span className="top-auth-name">{auth.user.name || auth.user.email}</span>
                <button type="button" className="global-login-btn logout" onClick={handleLogout}>로그아웃</button>
              </div>
            ) : <button type="button" className="global-login-btn" onClick={() => moveToPath(LOGIN_ROUTE)}>로그인</button>}
          </div>
        </div>
      </header>

      {showModuleSidebar && (
        <aside className="sidebar">
          {editingPipeline && (
            <div className="sidebar-pipeline-edit">
              <div className="sidebar-pipeline-edit-head">
                <span className="sidebar-pipeline-label">내 파이프라인 편집</span>
                <button type="button" className="sidebar-pipeline-clear" onClick={onClearUserPipeline}>종료</button>
              </div>
              <p className="sidebar-pipeline-title">{activeUserPipeline.title}</p>
            </div>
          )}
          <div className="module-list-categorized">
            {renderModuleButton(workflowModule)}
            <CollapsibleSection id="base" title="기본 모듈" count={baseModules.length} open={sectionOpen.base} onToggle={toggleSection}>
              <div className="sidebar-module-stack">
                {baseModules.map(m => renderModuleButton(m))}
              </div>
            </CollapsibleSection>
            
            {domainModules && domainModules.length > 0 && (
              <CollapsibleSection id="domain" title="도메인 모듈" count={domainModules.length} open={sectionOpen.domain} onToggle={toggleSection}>
                <div className="sidebar-domain-accordion">
                  {domainAddonGroups.map(group => {
                    const isOpen = openDomainStageId === group.parentId;
                    const idx = ADDON_PARENT_ORDER.indexOf(group.parentId);
                    return (
                      <div key={group.parentId} className="sidebar-domain-stage" data-stage={group.parentId}>
                        <button type="button" className={`sidebar-domain-stage-toggle ${isOpen ? 'is-open' : ''}`} onClick={() => toggleDomainStage(group.parentId)}>
                          <span className="sidebar-domain-stage-index">{idx >= 0 ? idx + 1 : '—'}</span>
                          <span className="sidebar-domain-stage-label">{group.title}</span>
                          <span className="sidebar-domain-stage-count">{group.modules.length}</span>
                          <span className="sidebar-domain-stage-chevron">{isOpen ? '▾' : '▸'}</span>
                        </button>
                        {isOpen && (
                          <div className="sidebar-domain-stage-panel">
                            {group.modules.map(m => renderModuleButton(m, { domainStyle: true, compact: true }))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

export default Sidebar;
