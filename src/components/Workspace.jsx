import PipelineHub from '../modules/PipelineHub';
import MainHubDataView from './MainHubDataView';
import MainHubModuleView from './MainHubModuleView';
import DiagnosisModule from '../modules/DiagnosisModule';
import DomainModule from '../modules/DomainModule';
import SearchModule from '../modules/SearchModule';
import MatchingModule from '../modules/MatchingModule';
import SynthesisModule from '../modules/SynthesisModule';
import ResultsModule from '../modules/ResultsModule';
import SpecialtyModule from '../modules/SpecialtyModule';
import { DOMAIN_MODULE_IDS } from '../data/domainModules';
import PipelineComposerBar from './PipelineComposerBar';
import StepExecutionBoard from './StepExecutionBoard';

function formatSavedTime(isoDate) {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Workspace({
  modules,
  pipelines,
  userPipelines,
  activePipelineId,
  onSelectPipeline,
  onSelectPipelineForExecution,
  onClearPipeline,
  onCopyTemplateToUser,
  onDuplicateUserPipeline,
  onDeleteUserPipeline,
  selectedModule,
  workspaceStep,
  onSelectModule,
  moduleStatus,
  moduleMemory,
  onSaveCurrentModule,
  diagnosisResult,
  onDiagnosisChange,
  domainForm,
  onDomainChange,
  onAutoDraftDomain,
  searchDomainContext,
  usingSavedDomain,
  selectedDatasets,
  onToggleDataset,
  matchingDatasets,
  usingSavedSearch,
  matchingReview,
  onMatchingReviewChange,
  synthesisOptions,
  matchingContext,
  onSetSynthesisMode,
  onToggleSynthesisConstraint,
  onRunSynthesis,
  resultFocus,
  onResultFocusChange,
  synthesisContext,
  domainModuleNotes,
  onDomainModuleNoteChange,
  mainHubSection = 'pipeline',
  onMainHubSectionChange,
  dataSources,
  dataSourcesAuthRequired,
  dataSourcesAuthMessage,
  onAddDataSource,
  onUpdateDataSource,
  onDeleteDataSource,
  onConnectDataToPipeline,
  onCreatePipelineAndLinkData,
  onRequireLoginForDataFormDraft,
  onGoLogin,
  userPipelinesAuthRequired,
  userPipelinesAuthMessage,
  onUpdateUserPipeline,
  onAddModuleToUserPipeline,
  onMoveModuleInUserPipeline,
  onRemoveModuleFromUserPipeline,
  onSetUserPipelineModulePosition,
  onConnectModuleAfterInUserPipeline,
  onDisconnectEdgeAfterInUserPipeline,
  activeUserPipelineId,
  activeUserPipeline,
  onStartPipelineFromModule,
  isAuthenticated,
  mode = 'beginner',
  taskRunStateById = {},
  lastStatusMessage = '',
  onModeChange,
  onExecuteTask,
  onRetryTask,
  onApproveNextTask,
  onSkipTask,
}) {
  const selectedModuleInfo = modules.find((item) => item.id === selectedModule);
  const allHubPipelines = [...pipelines, ...userPipelines];
  const activePipeline = allHubPipelines.find((p) => p.id === activePipelineId);
  const isMainHubRoot = selectedModule === 'workflow' && !activePipeline;
  const currentStatus = moduleStatus[selectedModule];
  const inputModules = selectedModuleInfo?.pipelineFrom || [];
  const isSpecialtyModule = DOMAIN_MODULE_IDS.includes(selectedModule);
  const isSaveableModule = selectedModule !== 'workflow';
  /** 파이프라인을 연 상태가 아니라 '모듈 조회/관리'에서만 모듈을 연 경우 */
  const showHubModulePipelineCta =
    mainHubSection === 'modules' &&
    !activePipelineId &&
    !activeUserPipelineId &&
    isSaveableModule;

  const headerTitle =
    selectedModule === 'workflow' && activePipeline ? activePipeline.title : selectedModuleInfo?.label;
  const headerDescription =
    selectedModule === 'workflow' && activePipeline
      ? activePipeline.description
      : selectedModuleInfo?.description;
  const showWorkspaceHeader = !isMainHubRoot && !(selectedModule === 'workflow' && activePipeline);
  const isStepExecutionView = workspaceStep === 'execution';
  const executionTasks = (activeUserPipeline?.moduleIds || activePipeline?.moduleIds || [])
    .filter((id) => id !== 'workflow')
    .map((id) => modules.find((m) => m.id === id))
    .filter(Boolean);

  const executionPipelineChoices = [...userPipelines, ...pipelines];

  const showModuleBack = !isMainHubRoot && selectedModule !== 'workflow';
  const showPipelineHubBack = selectedModule === 'workflow' && Boolean(activePipeline);
  const showMainHubSectionBack =
    isMainHubRoot && mainHubSection !== 'pipeline' && typeof onMainHubSectionChange === 'function';

  const renderPipelineHub = (tpls, usrs) => (
  <PipelineHub
    templatePipelines={tpls}
    userPipelines={usrs}
    modules={modules}
    moduleStatus={moduleStatus}
    moduleMemory={moduleMemory}
    activePipelineId={activePipelineId}
    onSelectPipeline={onSelectPipeline}
    onClearPipeline={onClearPipeline}
    onStartModule={onSelectModule}
    onCopyTemplateToUser={onCopyTemplateToUser}
    onDuplicateUserPipeline={onDuplicateUserPipeline}
    onDeleteUserPipeline={onDeleteUserPipeline}
    onUpdateUserPipeline={onUpdateUserPipeline}
    onMoveModuleInUserPipeline={onMoveModuleInUserPipeline}
    onRemoveModuleFromUserPipeline={onRemoveModuleFromUserPipeline}
    onSetUserPipelineModulePosition={onSetUserPipelineModulePosition}
    onConnectModuleAfterInUserPipeline={onConnectModuleAfterInUserPipeline}
    onDisconnectEdgeAfterInUserPipeline={onDisconnectEdgeAfterInUserPipeline}
    userPipelinesAuthRequired={userPipelinesAuthRequired}
    userPipelinesAuthMessage={userPipelinesAuthMessage}
  />
);

  const renderPipelineComposeLanding = () => {
    const recommendedTemplates = pipelines.slice(0, 3);
    const recentUserPipelines = userPipelines.slice(-3).reverse();

    return (
      <section className="pipeline-compose-landing">
        <div className="pipeline-compose-section">
          <h4>내 작업용 파이프라인 구성</h4>
          <p>선택한 흐름을 확정하고 단계 실행으로 넘어갑니다.</p>
        </div>

        <div className="pipeline-compose-grid">
          <article className="card compact">
            <h4>추천 파이프라인</h4>
            {recommendedTemplates.length === 0 ? (
              <p>추천할 템플릿이 없습니다.</p>
            ) : (
              <div className="button-row">
                {recommendedTemplates.map((tpl) => (
                  <button key={tpl.id} type="button" className="btn-secondary-inline" onClick={() => onSelectPipeline(tpl.id)}>
                    {tpl.title}
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="card compact">
            <h4>최근 내 파이프라인</h4>
            {recentUserPipelines.length === 0 ? (
              <p>아직 만든 파이프라인이 없습니다.</p>
            ) : (
              <div className="button-row">
                {recentUserPipelines.map((pl) => (
                  <button key={pl.id} type="button" className="btn-secondary-inline" onClick={() => onSelectPipeline(pl.id)}>
                    {pl.title}
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="card compact">
            <h4>새 파이프라인 만들기</h4>
            <p>데이터 선택 화면에서 새 파이프라인을 만들며 연결할 수 있습니다.</p>
            <div className="button-row">
              <button type="button" className="btn-primary-inline" onClick={() => onMainHubSectionChange?.('data')}>
                데이터 선택으로 이동
              </button>
              <button type="button" className="btn-secondary-inline" onClick={() => onMainHubSectionChange?.('pipeline-templates')}>
                템플릿에서 가져오기
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  };

  let content = null;
  if (selectedModule === 'workflow') {
    if (isMainHubRoot) {
      if (mainHubSection === 'data') {
        content = (
          <MainHubDataView
            dataSources={dataSources}
            templatePipelines={pipelines}
            userPipelines={userPipelines}
            onAddDataSource={onAddDataSource}
            onUpdateDataSource={onUpdateDataSource}
            onDeleteDataSource={onDeleteDataSource}
            onConnectToPipeline={onConnectDataToPipeline}
            onCreatePipelineAndLinkData={onCreatePipelineAndLinkData}
            onRequireLoginForDataFormDraft={onRequireLoginForDataFormDraft}
            isAuthenticated={isAuthenticated}
            authRequired={dataSourcesAuthRequired}
            authMessage={dataSourcesAuthMessage}
            onLoginRequired={onGoLogin}
          />
        );
      } else if (mainHubSection === 'modules') {
        content = (
          <MainHubModuleView modules={modules} moduleStatus={moduleStatus} onOpenModule={onSelectModule} />
        );
      }
      else if (mainHubSection === 'pipeline-templates') {
        content = (
          <PipelineHub
            templatePipelines={pipelines}
            userPipelines={[]}
            modules={modules}
            moduleStatus={moduleStatus}
            moduleMemory={moduleMemory}
            activePipelineId={activePipelineId}
            onSelectPipeline={onSelectPipeline}
            onClearPipeline={onClearPipeline}
            onStartModule={onSelectModule}
            onCopyTemplateToUser={onCopyTemplateToUser}
            onDuplicateUserPipeline={onDuplicateUserPipeline}
            onDeleteUserPipeline={onDeleteUserPipeline}
            onUpdateUserPipeline={onUpdateUserPipeline}
            onMoveModuleInUserPipeline={onMoveModuleInUserPipeline}
            onRemoveModuleFromUserPipeline={onRemoveModuleFromUserPipeline}
            onSetUserPipelineModulePosition={onSetUserPipelineModulePosition}
            onConnectModuleAfterInUserPipeline={onConnectModuleAfterInUserPipeline}
            onDisconnectEdgeAfterInUserPipeline={onDisconnectEdgeAfterInUserPipeline}
            userPipelinesAuthRequired={userPipelinesAuthRequired}
            userPipelinesAuthMessage={userPipelinesAuthMessage}
          />
        );
      }
      else if (mainHubSection === 'pipeline-mine') {
        content = (
          <PipelineHub
            templatePipelines={[]} 
            userPipelines={userPipelines}
            modules={modules}
            moduleStatus={moduleStatus}
            moduleMemory={moduleMemory}
            activePipelineId={activePipelineId}
            onSelectPipeline={onSelectPipeline}
            onClearPipeline={onClearPipeline}
            onStartModule={onSelectModule}
            onCopyTemplateToUser={onCopyTemplateToUser}
            onDuplicateUserPipeline={onDuplicateUserPipeline}
            onDeleteUserPipeline={onDeleteUserPipeline}
            onUpdateUserPipeline={onUpdateUserPipeline}
            onMoveModuleInUserPipeline={onMoveModuleInUserPipeline}
            onRemoveModuleFromUserPipeline={onRemoveModuleFromUserPipeline}
            onSetUserPipelineModulePosition={onSetUserPipelineModulePosition}
            onConnectModuleAfterInUserPipeline={onConnectModuleAfterInUserPipeline}
            onDisconnectEdgeAfterInUserPipeline={onDisconnectEdgeAfterInUserPipeline}
            userPipelinesAuthRequired={userPipelinesAuthRequired}
            userPipelinesAuthMessage={userPipelinesAuthMessage}
          />
        );
      } else {
        content = renderPipelineComposeLanding();
      }
    } else {
      content = renderPipelineHub(pipelines, userPipelines);
    }
  }
  if (selectedModule === 'diagnosis') {
    content = (
      <DiagnosisModule
        diagnosisResult={diagnosisResult}
        onDiagnosisChange={onDiagnosisChange}
        onMoveModule={onSelectModule}
      />
    );
  }
  if (selectedModule === 'domain') {
    content = (
      <DomainModule
        domainForm={domainForm}
        onDomainChange={onDomainChange}
        onAutoDraftDomain={onAutoDraftDomain}
      />
    );
  }
  if (selectedModule === 'search') {
    content = (
      <SearchModule
        domainContext={searchDomainContext}
        usingSavedDomain={usingSavedDomain}
        selectedDatasets={selectedDatasets}
        onToggleDataset={onToggleDataset}
      />
    );
  }
  if (selectedModule === 'matching') {
    content = (
      <MatchingModule
        selectedDatasets={matchingDatasets}
        usingSavedSearch={usingSavedSearch}
        matchingReview={matchingReview}
        onMatchingReviewChange={onMatchingReviewChange}
      />
    );
  }
  if (selectedModule === 'synthesis') {
    content = (
      <SynthesisModule
        synthesisOptions={synthesisOptions}
        matchingContext={matchingContext}
        onSetMode={onSetSynthesisMode}
        onToggleConstraint={onToggleSynthesisConstraint}
        onRun={onRunSynthesis}
      />
    );
  }
  if (selectedModule === 'results') {
    content = (
      <ResultsModule
        resultFocus={resultFocus}
        onResultFocusChange={onResultFocusChange}
        synthesisContext={synthesisContext}
      />
    );
  }
  if (isSpecialtyModule && selectedModuleInfo) {
    content = (
      <SpecialtyModule
        moduleDef={selectedModuleInfo}
        note={domainModuleNotes[selectedModule] ?? ''}
        onNoteChange={(value) => onDomainModuleNoteChange(selectedModule, value)}
      />
    );
  }

  return (
    <div className="workspace panel">
      <PipelineComposerBar
        activeUserPipeline={activeUserPipeline}
        modules={modules}
        onSelectModule={onSelectModule}
        onAddModule={onAddModuleToUserPipeline}
        onRemoveModule={onRemoveModuleFromUserPipeline}
        onMoveModule={onMoveModuleInUserPipeline}
        onConnectAfter={onConnectModuleAfterInUserPipeline}
        onDisconnectAfter={onDisconnectEdgeAfterInUserPipeline}
        mode={mode}
      />
      {showWorkspaceHeader && (
        <header
          className={`workspace-header ${showModuleBack || showPipelineHubBack ? 'workspace-header--has-back' : ''}`}
        >
          {(showModuleBack || showPipelineHubBack) && (
            <div className="workspace-header-back">
              <button
                type="button"
                className="btn-ghost-back"
                onClick={showPipelineHubBack ? onClearPipeline : () => onSelectModule('workflow')}
              >
                <span className="btn-ghost-back-icon" aria-hidden>
                  ←
                </span>
                {showPipelineHubBack ? '파이프라인 허브로' : '뒤로'}
              </button>
            </div>
          )}
          <div className="workspace-header-main">
            <div>
              <h2>{headerTitle}</h2>
              <p>{headerDescription}</p>
            </div>
            {isSaveableModule && (
              <div
                className={`workspace-save-panel ${showHubModulePipelineCta ? 'workspace-save-panel--hub-cta' : ''}`}
              >
                <span className={`status-pill ${currentStatus?.state || 'draft'}`}>
                  {currentStatus?.label || '미저장'}
                </span>
                {currentStatus?.savedAt && (
                  <span className="saved-time">최근 저장: {formatSavedTime(currentStatus.savedAt)}</span>
                )}
                {showHubModulePipelineCta ? (
                  <button
                    type="button"
                    className="btn-primary-inline workspace-btn-pipeline-start"
                    onClick={() => onStartPipelineFromModule(selectedModule)}
                  >
                    이 작업 단계에서 파이프라인 시작해보기
                  </button>
                ) : (
                  <button type="button" onClick={() => onSaveCurrentModule(selectedModule)} disabled={!isAuthenticated}>
                    현재 작업 단계 저장
                  </button>
                )}
                {!isAuthenticated ? <span className="saved-time">로그인 후 저장 가능합니다.</span> : null}
              </div>
            )}
          </div>

          {selectedModule !== 'workflow' && !isSpecialtyModule && (
            <div className="pipeline-input-row">
              <span className="pipeline-label">입력 컨텍스트</span>
              {inputModules.length === 0 && <span className="pipeline-item neutral">필수 입력 없음</span>}
              {inputModules.map((moduleId) => {
                const moduleInfo = modules.find((module) => module.id === moduleId);
                const status = moduleStatus[moduleId];
                return (
                  <span
                    key={moduleId}
                    className={`pipeline-item ${status?.state === 'saved' ? 'ok' : 'warn'}`}
                  >
                    {moduleInfo?.label}: {status?.state === 'saved' ? '저장본 사용 가능' : '저장본 없음'}
                  </span>
                );
              })}
            </div>
          )}
        </header>
      )}
      <section
        className={`workspace-content ${isMainHubRoot ? 'workspace-content--main-hub' : ''} ${
          isStepExecutionView ? 'workspace-content--execution' : 'workspace-content--compose'
        }`}
      >
        {!isStepExecutionView ? (
          <div className="workspace-mode-switch" role="group" aria-label="워크스페이스 모드">
            <span className="workspace-mode-badge">파이프라인 구성 모드</span>
            <button
              type="button"
              className={`workspace-mode-switch-btn ${mode === 'beginner' ? 'active' : ''}`}
              onClick={() => onModeChange?.('beginner')}
            >
              초급 모드
            </button>
            <button
              type="button"
              className={`workspace-mode-switch-btn ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => onModeChange?.('edit')}
            >
              편집 모드
            </button>
            {mode === 'edit' ? (
              <p className="workspace-mode-guide">처음 사용하는 경우 기본 구성을 먼저 실행해보는 것을 권장합니다.</p>
            ) : null}
          </div>
        ) : (
          <div className="workspace-execution-headline">
            <span className="workspace-mode-badge workspace-mode-badge--execution">단계 실행 모드</span>
            <p>여기서는 파이프라인 편집 없이, 선택한 파이프라인의 단계 실행만 진행합니다.</p>
          </div>
        )}
        {showMainHubSectionBack ? (
          <div className="workspace-subnav">
            <button
              type="button"
              className="btn-ghost-back"
              onClick={() => onMainHubSectionChange('pipeline')}
            >
              <span className="btn-ghost-back-icon" aria-hidden>
                ←
              </span>
              파이프라인 조회로
            </button>
          </div>
        ) : null}
        {isStepExecutionView ? (
          <article className="step-execution-card">
            <header className="step-execution-card-header">
              <h3>작업 단계 실행</h3>
              <p>단계별로 실행하고 검토한 뒤 승인하여 다음 단계로 진행하세요.</p>
            </header>
            {!activePipeline && !activeUserPipeline ? (
              <section className="step-board-empty">
                <p>먼저 실행할 파이프라인을 선택해주세요.</p>
                <div className="button-row">
                  {executionPipelineChoices.length === 0 ? (
                    <span className="ops-module-candidate-empty">선택 가능한 파이프라인이 없습니다.</span>
                  ) : (
                    executionPipelineChoices.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        className="btn-secondary-inline"
                        onClick={() => (onSelectPipelineForExecution || onSelectPipeline)(pl.id)}
                      >
                        {pl.title}
                      </button>
                    ))
                  )}
                </div>
              </section>
            ) : (
              <>
                <StepExecutionBoard
                  tasks={executionTasks}
                  activeTaskId={selectedModule}
                  taskRunStateById={taskRunStateById}
                  lastStatusMessage={lastStatusMessage}
                  onSelectTask={onSelectModule}
                  onExecuteTask={onExecuteTask}
                  onRetryTask={onRetryTask}
                  onApproveNextTask={onApproveNextTask}
                  onSkipTask={onSkipTask}
                />
                {content}
              </>
            )}
          </article>
        ) : content}
      </section>
    </div>
  );
}

export default Workspace;
