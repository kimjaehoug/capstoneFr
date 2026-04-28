import { useEffect, useMemo, useState } from 'react';
import { ADDON_PARENT_ORDER, PARENT_CORE_LABELS } from '../data/domainModules';
import './Sidebar.css';

const MAIN_HUB_SECTIONS = [
  { id: 'data', label: '데이터 조회/관리' },
  { 
    id: 'pipeline', 
    label: '파이프라인 조회/관리',
    subItems: [
      { id: 'pipeline-shared', label: '공유 템플릿' },
      { id: 'pipeline-mine', label: '내 파이프라인' }
    ]
  },
  { id: 'modules', label: '모듈 조회/관리' },
];

function Sidebar({
  auth,
  moveToPath,
  handleLogout,
  handleGoHome,
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
  user,
  onLoginClick
}) {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const editingPipeline = Boolean(activeUserPipeline);
  const [openDomainStageId, setOpenDomainStageId] = useState(null);

  const domainAddonGroups = useMemo(() => {
    const grouped = ADDON_PARENT_ORDER.map((parentId) => ({
      parentId, title: PARENT_CORE_LABELS[parentId],
      modules: domainModules.filter((m) => m.parentCoreModule === parentId),
    })).filter((g) => g.modules.length > 0);
    const stray = domainModules.filter((m) => !m.parentCoreModule || !ADDON_PARENT_ORDER.includes(m.parentCoreModule));
    if (stray.length > 0) grouped.push({ parentId: '_other', title: '기타', modules: stray });
    return grouped;
  }, [domainModules]);

  const renderModuleButton = (module, { domainStyle, compact } = {}) => {
    const status = moduleStatus[module.id];
    const inPipeline = editingPipeline && activeUserPipeline.moduleIds.includes(module.id);
    return (
      <div key={module.id} className="header-module-item">
        <button type="button" className={`header-module-btn ${moduleSidebarFocus === module.id ? 'active' : ''}`}
          onClick={() => onModuleSidebarFocus(module.id)}>
          <span className="module-name">{module.label}</span>
          <span className={`status-dot ${status?.state || 'draft'}`} />
        </button>
      </div>
    );
  };

  return (
    <header className="integrated-header">
      <div className="header-inner">
        <div className="header-left-group">
          <button type="button" className="header-brand-btn" onClick={handleGoHome} aria-label="처음 화면으로 이동">
            <div className="login-logo-header">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="brand-name">WWorkbench</span>
          </button>

          <nav className="header-nav-menu">
            <ul className="nav-list">
              {MAIN_HUB_SECTIONS.map((item) => (
                <li 
                  key={item.id} 
                  className="nav-item-wrapper"
                  onMouseEnter={() => item.subItems && setActiveDropdown(true)}
                  onMouseLeave={() => setActiveDropdown(false)}
                >
                  <button
                    type="button"
                    className={`nav-link-btn ${mainHubSection.startsWith(item.id) ? 'active' : ''}`}
                    onClick={() => !item.subItems && onMainHubSectionChange(item.id)}
                  >
                    {item.label}
                    {item.subItems && <span className="arrow-down">▾</span>}
                  </button>

                  {item.subItems && activeDropdown && (
                    <ul className="header-dropdown-list">
                      {item.subItems.map((sub) => (
                        <li 
                          key={sub.id} 
                          className={mainHubSection === sub.id ? 'selected' : ''}
                          onClick={() => {
                            onMainHubSectionChange(sub.id);
                            setActiveDropdown(false);
                          }}
                        >
                          {sub.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="header-right-group">
          {auth?.user ? (
            <div className="top-auth-box">
              <span className="top-auth-name">{auth.user.name || auth.user.email}</span>
              <button type="button" className="global-login-btn logout" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            <button type="button" className="global-login-btn" onClick={() => moveToPath('/login')}>
              로그인
            </button>
          )}
        </div>
      </div>

      {showModuleSidebar && (
        <div className="header-edit-toolbar">
          <div className="module-scroll-row">
            {renderModuleButton(workflowModule)}
            {baseModules.map(m => renderModuleButton(m))}
          </div>
        </div>
      )}
    </header>
  );
}

export default Sidebar;