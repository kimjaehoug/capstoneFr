import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import LoginPageContainer from '../pages/login/LoginPageContainer';
import SharedHubPage from '../pages/shared-hub/SharedHubPage';
import OpsConsolePage from '../pages/ops-console/OpsConsolePage';
import WorkspacePage from '../pages/workspace/WorkspacePage';
import AppModals from './components/AppModals';
import { useDeleteConfirm } from './hooks/useDeleteConfirm';
import { useWorkspaceContext } from '../entities/workspace/model/workspaceContext';
import { useWorkspaceUrlSync } from '../entities/workspace/model/urlSync';
import { useAuthContext } from '../entities/user/model/authState';
import {
  WORKSPACE_STEP_DATA,
  WORKSPACE_STEP_PIPELINE,
  WORKSPACE_STEP_RESULT,
} from '../entities/workspace/model/workspaceStep';
import { createWorkspaceProps } from '../pages/workspace/model/createWorkspaceProps';
import { useWorkspaceActions } from '../pages/workspace/model/useWorkspaceActions';
import { notifyApiFailure as notifyApiFailureModel } from '../features/conflict-recovery/model/notifyApiFailure';
import {
  requireAuthForCrud as requireAuthForCrudModel,
  requestLoginForDataFormDraft as requestLoginForDataFormDraftModel,
} from '../features/auth-gate/model/requireAuthForCrud';
import { PIPELINES } from '../data/pipelines';
import { DOMAIN_MODULES, DOMAIN_MODULE_IDS } from '../data/domainModules';
import { DATA_SOURCES_KEY, loadDataSources } from '../data/dataSources';
import { isApiError } from '../api/client';
import {
  createDataSource as createDataSourceApi,
  deleteDataSource as deleteDataSourceApi,
  listDataSources as listDataSourcesApi,
  updateDataSource as updateDataSourceApi,
  updateDataSourceLinkedPipeline as updateDataSourceLinkedPipelineApi,
} from '../features/data-sources/api/dataSourcesApi';
import {
  getModuleSnapshot as getModuleSnapshotApi,
  saveModuleSnapshot as saveModuleSnapshotApi,
} from '../features/module-snapshots/api/moduleSnapshotsApi';
import {
  addPipelineModule as addPipelineModuleApi,
  connectPipelineAfter as connectPipelineAfterApi,
  createPipeline as createPipelineApi,
  copyPipelineTemplate as copyPipelineTemplateApi,
  deletePipeline as deletePipelineApi,
  disconnectPipelineAfter as disconnectPipelineAfterApi,
  duplicatePipeline as duplicatePipelineApi,
  listPipelines as listPipelinesApi,
  listPipelineTemplates as listPipelineTemplatesApi,
  removePipelineModule as removePipelineModuleApi,
  reorderPipelineModules as reorderPipelineModulesApi,
  updatePipelineModulePosition as updatePipelineModulePositionApi,
  updatePipeline as updatePipelineApi,
} from '../features/pipelines/api/pipelinesApi';
import {
  normalizeConnectedAfter,
} from '../utils/pipelineConnections';
import { trackEvent } from '../utils/analytics';
import {
  AUTH_EXPIRED_NOTICE_KEY,
  AUTH_REQUIRED_DATA_FORM_CACHE_KEY,
  AUTH_REQUIRED_DRAFT_CACHE_KEY,
  AUTH_REQUIRED_DRAFT_TTL_MS,
  USER_PIPELINES_KEY,
} from '../shared/constants/storageKeys';
import {
  LOGIN_ROUTE,
  normalizeAppPath,
  OPS_CONSOLE_ROUTE,
  SHARED_HUB_ROUTE,
  WORKSPACE_ROUTE,
} from '../shared/constants/routes';
import { formatDataSourceUpdated, formatSavedTime } from '../shared/lib/time/formatters';

const MODULES = [
  {
    id: 'workflow',
    label: '전체 워크플로우',
    description: '파이프라인 허브에서 도메인별 흐름을 고르거나, 사이드바에서 모듈로 바로 이동합니다.',
    pipelineFrom: [],
  },
  {
    id: 'diagnosis',
    label: '데이터 진단',
    description: '샘플 구성, 결측치, 불균형 의심 여부를 빠르게 점검합니다.',
    pipelineFrom: [],
  },
  {
    id: 'domain',
    label: '도메인 정의',
    description: '도메인/태스크/스코프를 명시해 탐색 기준을 정리합니다.',
    pipelineFrom: ['diagnosis'],
  },
  {
    id: 'search',
    label: '외부 데이터 탐색',
    description: '가설 기반 검색 쿼리와 후보 데이터셋을 검토합니다.',
    pipelineFrom: ['domain'],
  },
  {
    id: 'matching',
    label: '정합성 검토',
    description: '현재 데이터와 후보 데이터의 의미적 적합성을 비교합니다.',
    pipelineFrom: ['search'],
  },
  {
    id: 'synthesis',
    label: '합성데이터 설계',
    description: '합성 전략과 제약조건을 정의해 보완 방향을 설정합니다.',
    pipelineFrom: ['matching'],
  },
  {
    id: 'results',
    label: '결과 비교',
    description: '원본/보완/합성 결과 지표를 비교해 의사결정을 돕습니다.',
    pipelineFrom: ['synthesis'],
  },
];

const ALL_MODULE_CATALOG = [...MODULES, ...DOMAIN_MODULES];

const DEFAULT_DOMAIN_FORM = {
  industry: '',
  subdomain: '',
  data_modality: '',
  row_unit: '',
  ml_task: '',
  target_event: '',
  include_scope: '',
  exclude_scope: '',
};

const SAVEABLE_MODULES = [
  'diagnosis',
  'domain',
  'search',
  'matching',
  'synthesis',
  'results',
  ...DOMAIN_MODULE_IDS,
];

function migrateUserPipeline(p) {
  const labelMap = { 의료: 'medical', 금융: 'finance', 제조: 'manufacturing' };
  let next = { ...p };
  if (!next.domainKey) next.domainKey = labelMap[p.domainLabel] || 'medical';
  if (next.autoNamed === undefined) next.autoNamed = false;
  if (!next.moduleLayout || typeof next.moduleLayout !== 'object') next.moduleLayout = {};
  const n = next.moduleIds?.length ?? 0;
  if (n <= 1) {
    next.connectedAfter = [];
  } else if (!Array.isArray(next.connectedAfter) || next.connectedAfter.length !== n - 1) {
    next.connectedAfter = Array(n - 1).fill(true);
  } else {
    next.connectedAfter = next.connectedAfter.map(Boolean);
  }
  return next;
}

function loadUserPipelines() {
  try {
    const raw = localStorage.getItem(USER_PIPELINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateUserPipeline);
  } catch {
    return [];
  }
}


function mapDataSourceRecordToRow(record) {
  return {
    id: record.id,
    name: record.name,
    source: record.source || '미지정',
    updated: formatDataSourceUpdated(record.updatedAt),
    rows: record.rowsLabel || '-',
    linkedPipelineId: record.linkedPipelineId ?? null,
    ...(record.domainIndustryContext ? { domainIndustryContext: record.domainIndustryContext } : {}),
    ...(record.domainSubjectScope ? { domainSubjectScope: record.domainSubjectScope } : {}),
    ...(record.domainRegulationScope ? { domainRegulationScope: record.domainRegulationScope } : {}),
    ...(record.domainStakeholderNotes ? { domainStakeholderNotes: record.domainStakeholderNotes } : {}),
    ...(record.dataModality ? { dataModality: record.dataModality } : {}),
    ...(record.rowUnit ? { rowUnit: record.rowUnit } : {}),
    ...(record.sensitivityNote ? { sensitivityNote: record.sensitivityNote } : {}),
  };
}

function createInitialModuleMemory() {
  return SAVEABLE_MODULES.reduce((acc, moduleId) => {
    acc[moduleId] = { savedAt: null, summary: '', data: null };
    return acc;
  }, {});
}

function connectedAfterIdsToFlags(moduleIds, connectedAfterIds) {
  if (!Array.isArray(moduleIds) || moduleIds.length <= 1) return [];
  const ids = Array.isArray(connectedAfterIds) ? connectedAfterIds : [];
  return moduleIds.slice(0, -1).map((moduleId) => ids.includes(moduleId));
}

function mapPipelineRecordToUi(record) {
  const moduleIds = Array.isArray(record.moduleIds) ? record.moduleIds : [];
  return {
    id: record.id,
    domainKey: record.domainKey || null,
    domainLabel: record.domainLabel || '',
    title: record.title,
    description: record.description || '',
    moduleIds,
    connectedAfter: connectedAfterIdsToFlags(moduleIds, record.connectedAfter),
    moduleLayout: record.moduleLayout || {},
    highlight: record.highlight || '',
    createdAt: record.createdAt || new Date().toISOString(),
    autoNamed: Boolean(record.autoNamed),
  };
}

function buildModuleDraft(moduleId, state) {
  if (moduleId === 'diagnosis') return { diagnosisResult: state.diagnosisResult };
  if (moduleId === 'domain') return state.domainForm;
  if (moduleId === 'search') return { selectedDatasets: state.selectedDatasets };
  if (moduleId === 'matching') return state.matchingReview;
  if (moduleId === 'synthesis') return state.synthesisOptions;
  if (moduleId === 'results') return { focusMetric: state.resultFocus };
  if (DOMAIN_MODULE_IDS.includes(moduleId)) return { note: state.domainModuleNotes[moduleId] ?? '' };
  return {};
}

function buildModuleSummary(moduleId, state) {
  if (moduleId === 'diagnosis') {
    const diagnosisLabelMap = {
      imbalance_high: '불균형 가능성 높음',
      suspected: '의심',
      healthy: '현재 양호',
    };
    return `결과: ${diagnosisLabelMap[state.diagnosisResult]}`;
  }
  if (moduleId === 'domain') return `${state.domainForm.industry || '미정'} / ${state.domainForm.ml_task || '미정'}`;
  if (moduleId === 'search') return `선택 데이터셋 ${state.selectedDatasets.length}개`;
  if (moduleId === 'matching') return `정합성: ${state.matchingReview.finalFit}`;
  if (moduleId === 'synthesis') return `모드: ${state.synthesisOptions.mode}`;
  if (moduleId === 'results') return `포커스 지표: ${state.resultFocus}`;
  if (DOMAIN_MODULE_IDS.includes(moduleId)) {
    const note = state.domainModuleNotes[moduleId] ?? '';
    return note.trim().length > 0 ? `${note.trim().slice(0, 40)}${note.trim().length > 40 ? '…' : ''}` : '메모 없음';
  }
  return '';
}

function AppShell() {
  const {
    workspaceStep,
    setWorkspaceStep,
    activeDataSourceId,
    setActiveDataSourceId,
    activePipelineId,
    setActivePipelineId,
    activeUserPipelineId,
    setActiveUserPipelineId,
    selectedModule,
    setSelectedModule,
    setSelectedModuleWithStep,
    mainHubSection,
    setMainHubSection,
    setMainHubSectionWithStep,
    clearWorkspaceContext,
  } = useWorkspaceContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window === 'undefined' ? WORKSPACE_ROUTE : normalizeAppPath(window.location.pathname || WORKSPACE_ROUTE)
  );

  /** 사이드바 목록에서 한 번 클릭으로만 바뀌는 강조(설정 화면은 더블클릭) */
  const [moduleSidebarFocus, setModuleSidebarFocus] = useState('workflow');
  const [templatePipelines, setTemplatePipelines] = useState(PIPELINES);
  const [userPipelines, setUserPipelines] = useState(() => loadUserPipelines());
  const [userPipelinesAuthRequired, setUserPipelinesAuthRequired] = useState(false);
  const [userPipelinesAuthMessage, setUserPipelinesAuthMessage] = useState('');
  const [activeDomainKey, setActiveDomainKey] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
  const [dataSources, setDataSources] = useState(() => loadDataSources());
  const [dataSourcesAuthRequired, setDataSourcesAuthRequired] = useState(false);
  const [dataSourcesAuthMessage, setDataSourcesAuthMessage] = useState('');
  const [domainModuleNotes, setDomainModuleNotes] = useState(() =>
    DOMAIN_MODULE_IDS.reduce((acc, id) => {
      acc[id] = '';
      return acc;
    }, {})
  );
  const [diagnosisResult, setDiagnosisResult] = useState('imbalance_high');
  const [domainForm, setDomainForm] = useState(DEFAULT_DOMAIN_FORM);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [matchingReview, setMatchingReview] = useState({
    finalFit: '부분 적합',
    actionPlan: '부분 적용 후 검증',
  });
  const [synthesisOptions, setSynthesisOptions] = useState({
    mode: 'minority_only',
    constraints: {
      preserveLabelSemantics: true,
      preserveFeatureRanges: true,
      excludeUnrealisticSamples: true,
    },
    statusMessage: '',
  });
  const [resultFocus, setResultFocus] = useState('minority_recall');
  const [moduleMemory, setModuleMemory] = useState(createInitialModuleMemory);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'system',
      text: '보조 채팅 패널입니다. 예외 조건 수정이나 보조 지시를 입력하고, 주 작업은 중앙 모듈 캔버스에서 진행하세요.',
    },
  ]);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [opsQuery, setOpsQuery] = useState('');
  const [opsType, setOpsType] = useState('all');
  const { auth, currentUserId, isAuthenticated, applyLoginSuccess, performLogout } = useAuthContext();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePopState = () => {
      setCurrentPath(normalizeAppPath(window.location.pathname || WORKSPACE_ROUTE));
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || auth) return;
    const expiredNotice = window.sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY);
    if (!expiredNotice) return;
    setSelectedModuleWithStep('workflow');
    setMainHubSectionWithStep('pipeline');
    setActivePipelineId(null);
    setActiveUserPipelineId(null);
    setActiveDomainKey(null);
    moveToPath(LOGIN_ROUTE);
  }, [auth]);

  const moveToPath = (path) => {
    if (typeof window === 'undefined') return;
    const nextPath = normalizeAppPath(path);
    const current = window.location.pathname || '/';
    if (current !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setCurrentPath(nextPath);
  };

  const buildDraftCache = () => ({
    selectedModule,
    diagnosisResult,
    domainForm,
    selectedDatasets,
    matchingReview,
    synthesisOptions,
    resultFocus,
    domainModuleNotes,
  });

  const restoreDraftCache = (payload) => {
    if (!payload || typeof payload !== 'object') return;
    if (typeof payload.selectedModule === 'string') setSelectedModule(payload.selectedModule);
    if (typeof payload.diagnosisResult === 'string') setDiagnosisResult(payload.diagnosisResult);
    if (payload.domainForm && typeof payload.domainForm === 'object') setDomainForm(payload.domainForm);
    if (Array.isArray(payload.selectedDatasets)) setSelectedDatasets(payload.selectedDatasets);
    if (payload.matchingReview && typeof payload.matchingReview === 'object') setMatchingReview(payload.matchingReview);
    if (payload.synthesisOptions && typeof payload.synthesisOptions === 'object') setSynthesisOptions(payload.synthesisOptions);
    if (typeof payload.resultFocus === 'string') setResultFocus(payload.resultFocus);
    if (payload.domainModuleNotes && typeof payload.domainModuleNotes === 'object') {
      setDomainModuleNotes((prev) => ({ ...prev, ...payload.domainModuleNotes }));
    }
  };

  const readValidDraftCache = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const cachedAt = Date.parse(parsed?.cachedAt || '');
      if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > AUTH_REQUIRED_DRAFT_TTL_MS) {
        return null;
      }
      return parsed?.draft ?? null;
    } catch {
      return null;
    }
  };

  const requireAuthForCrud = (actionLabel = '이 작업', options = {}) =>
    requireAuthForCrudModel(actionLabel, options, {
      currentUserId,
      appendSystemMessage,
      buildDraftCache,
      moveToPath,
      draftCacheKey: AUTH_REQUIRED_DRAFT_CACHE_KEY,
    });

  const requestLoginForDataFormDraft = (draftPayload) =>
    requestLoginForDataFormDraftModel(draftPayload, {
      currentUserId,
      appendSystemMessage,
      moveToPath,
      dataFormCacheKey: AUTH_REQUIRED_DATA_FORM_CACHE_KEY,
    });

  useEffect(() => {
    localStorage.setItem(USER_PIPELINES_KEY, JSON.stringify(userPipelines));
  }, [userPipelines]);

  useEffect(() => {
    localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(dataSources));
  }, [dataSources]);

  const reloadDataSources = async () => {
    try {
      const payload = await listDataSourcesApi({ userId: currentUserId });
      const items = payload?.items ?? payload?.dataSources ?? [];
      setDataSources(items.map(mapDataSourceRecordToRow));
      setDataSourcesAuthRequired(Boolean(payload?.authRequired));
      setDataSourcesAuthMessage(payload?.message || '');
    } catch (error) {
      if (currentUserId) {
        setDataSourcesAuthRequired(false);
        setDataSourcesAuthMessage('');
      }
      if (isApiError(error) && error.status === 401) return;
      appendSystemMessage('데이터소스 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    reloadDataSources();
  }, [currentUserId]);

  const reloadTemplatePipelines = async () => {
    try {
      const payload = await listPipelineTemplatesApi();
      setTemplatePipelines((payload?.templates ?? []).map(mapPipelineRecordToUi));
    } catch {
      setTemplatePipelines(PIPELINES);
      appendSystemMessage('파이프라인 템플릿을 불러오지 못해 기본 템플릿을 사용합니다.');
    }
  };

  const reloadUserPipelines = async () => {
    try {
      const payload = await listPipelinesApi({ userId: currentUserId });
      const items = payload?.items ?? payload?.pipelines ?? [];
      setUserPipelines(items.map(mapPipelineRecordToUi));
      setUserPipelinesAuthRequired(Boolean(payload?.authRequired));
      setUserPipelinesAuthMessage(payload?.message || '');
    } catch (error) {
      if (currentUserId) {
        setUserPipelinesAuthRequired(false);
        setUserPipelinesAuthMessage('');
      }
      if (isApiError(error) && error.status === 401) return;
      appendSystemMessage('내 파이프라인 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    reloadTemplatePipelines();
  }, []);

  useEffect(() => {
    reloadUserPipelines();
  }, [currentUserId]);

  useEffect(() => {
    if (!activeUserPipelineId) return;
    const pl = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (!pl) {
      setActiveUserPipelineId(null);
      return;
    }
    if (selectedModule !== 'workflow' && !pl.moduleIds.includes(selectedModule)) {
      setSelectedModule('workflow');
    }
  }, [activeUserPipelineId, userPipelines, selectedModule]);

  const activeUserPipeline = useMemo(
    () => userPipelines.find((p) => p.id === activeUserPipelineId) ?? null,
    [userPipelines, activeUserPipelineId]
  );
  const activeDataSource = useMemo(
    () => dataSources.find((d) => d.id === activeDataSourceId) ?? null,
    [dataSources, activeDataSourceId],
  );
  const activePipeline = useMemo(
    () => [...templatePipelines, ...userPipelines].find((p) => p.id === activePipelineId) ?? null,
    [templatePipelines, userPipelines, activePipelineId],
  );
  const activeModule = useMemo(
    () => ALL_MODULE_CATALOG.find((m) => m.id === selectedModule) ?? null,
    [selectedModule],
  );
  const opsRows = useMemo(() => {
    const sourceRows = dataSources.map((d) => ({
      type: 'data-source',
      id: d.id,
      name: d.name,
      status: d.updated || '-',
      ref: d.linkedPipelineId || '-',
    }));
    const pipelineRows = userPipelines.map((p) => ({
      type: 'pipeline',
      id: p.id,
      name: p.title,
      status: `${p.moduleIds.length} modules`,
      ref: p.domainLabel || '-',
    }));
    const moduleRows = Object.entries(moduleMemory).map(([moduleId, value]) => ({
      type: 'module-snapshot',
      id: moduleId,
      name: ALL_MODULE_CATALOG.find((m) => m.id === moduleId)?.label || moduleId,
      status: value?.savedAt ? `saved ${formatSavedTime(value.savedAt)}` : 'unsaved',
      ref: value?.summary || '-',
    }));
    const merged = [...sourceRows, ...pipelineRows, ...moduleRows];
    return merged.filter((row) => {
      const byType = opsType === 'all' || row.type === opsType;
      const q = opsQuery.trim().toLowerCase();
      const byQuery = !q || `${row.name} ${row.id} ${row.ref}`.toLowerCase().includes(q);
      return byType && byQuery;
    });
  }, [dataSources, userPipelines, moduleMemory, opsType, opsQuery]);

  const handleSelectPipeline = (id) => {
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
    setActivePipelineId(id);
    setActiveUserPipelineId(userPipelines.some((p) => p.id === id) ? id : null);
    const resolved = [...templatePipelines, ...userPipelines].find((p) => p.id === id);
    setActiveDomainKey(resolved?.domainKey ?? null);
  };


  /** 모듈/워크플로 전환만 담당. 파이프라인 선택은 handleSelectPipeline·onClearPipeline에서만 바꿈 */
  const handleSelectModule = (moduleId) => {
    setSelectedModuleWithStep(moduleId);
  };

  useEffect(() => {
    setModuleSidebarFocus(selectedModule);
  }, [selectedModule]);

  const handleModuleSidebarFocus = (moduleId) => {
    setModuleSidebarFocus(moduleId);
  };

  const clearUserPipelineEdit = () => {
    setActiveUserPipelineId(null);
    setActivePipelineId((prev) => {
      if (prev && userPipelines.some((p) => p.id === prev)) {
        setActiveDomainKey(null);
        return null;
      }
      return prev;
    });
  };

  const handleWorkspaceStepChange = (step) => {
    setWorkspaceStep(step);
    trackEvent('workspace_context_changed', {
      userId: currentUserId,
      pipelineId: activePipelineId,
      moduleId: selectedModule,
      step,
      result: 'success',
    });
    if (step === WORKSPACE_STEP_DATA) {
      setSelectedModuleWithStep('workflow');
      setMainHubSectionWithStep('data');
      return;
    }
    if (step === WORKSPACE_STEP_PIPELINE) {
      setSelectedModuleWithStep('workflow');
      setMainHubSectionWithStep(activeUserPipelineId ? 'pipeline-mine' : 'pipeline');
      return;
    }
    if (step === WORKSPACE_STEP_RESULT) {
      setSelectedModuleWithStep('results');
      return;
    }
    if (selectedModule === 'workflow') {
      const fallback = activePipeline?.moduleIds?.[0] || 'diagnosis';
      setSelectedModuleWithStep(fallback);
    }
  };

  const appendChat = (text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: cleanText,
    };
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      text: `보조 지시를 기록했습니다: ${cleanText}`,
    };
    setChatMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const appendSystemMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'system',
        text,
      },
    ]);
  };

  const notifyApiFailure = (actionLabel, error, options = {}) =>
    notifyApiFailureModel(
      actionLabel,
      error,
      {
        appendSystemMessage,
        setConflictInfo,
        trackEvent,
        currentUserId,
        activeUserPipelineId,
        activePipelineId,
        selectedModule,
        workspaceStep,
      },
      options,
    );

  const {
    connectDataToPipeline,
    addDataSource,
    updateDataSource,
    copyTemplateToUser,
    updateUserPipeline,
    createPipelineAndLinkData,
    duplicateUserPipeline,
    addModuleToUserPipeline,
    removeModuleFromUserPipeline,
    moveModuleInUserPipeline,
    connectModuleAfterInUserPipeline,
    disconnectEdgeAfterInUserPipeline,
    setUserPipelineModulePosition,
    startPipelineFromModule,
    saveCurrentModule: saveCurrentModuleAction,
    deletePipelineById,
    deleteDataSourceById,
  } = useWorkspaceActions({
    currentUserId,
    requireAuthForCrud,
    templatePipelines,
    userPipelines,
    dataSources,
    activeUserPipelineId,
    activePipelineId,
    selectedModule,
    workspaceStep,
    setUserPipelines,
    setDataSources,
    setPendingTitle,
    setIsModalOpen,
    setActiveDomainKey,
    setActiveUserPipelineId,
    setActivePipelineId,
    setSelectedModule,
    setMainHubSection,
    setMainHubSectionWithStep,
    setWorkspaceStep,
    setActiveDataSourceId,
    appendSystemMessage,
    notifyApiFailure,
    reloadDataSources,
    reloadUserPipelines,
    allModulesCatalog: ALL_MODULE_CATALOG,
    domainModuleIds: DOMAIN_MODULE_IDS,
    mapPipelineRecordToUi,
    mapDataSourceRecordToRow,
    buildModuleDraft,
    buildModuleSummary,
    saveModuleSnapshotLocal,
  });

  const {
    isDeleteModalOpen,
    pipelineToDelete,
    isDataDeleteModalOpen,
    dataSourceToDelete,
    deleteUserPipeline,
    confirmDelete,
    deleteDataSource,
    confirmDataDelete,
    closePipelineDeleteModal,
    closeDataDeleteModal,
  } = useDeleteConfirm({
    userPipelines,
    dataSources,
    requireAuthForCrud,
    deletePipelineById,
    deleteDataSourceById,
    activeUserPipelineId,
    activePipelineId,
    setActiveUserPipelineId,
    setActivePipelineId,
    setActiveDomainKey,
    setUserPipelines,
    setDataSources,
    appendSystemMessage,
    reloadUserPipelines,
    reloadDataSources,
    notifyApiFailure,
  });

  const applySnapshotToDraft = (moduleId, data) => {
    if (!data || typeof data !== 'object') return;
    if (moduleId === 'diagnosis' && typeof data.diagnosisResult === 'string') {
      setDiagnosisResult(data.diagnosisResult);
      return;
    }
    if (moduleId === 'domain') {
      setDomainForm((prev) => ({ ...prev, ...data }));
      return;
    }
    if (moduleId === 'search' && Array.isArray(data.selectedDatasets)) {
      setSelectedDatasets(data.selectedDatasets);
      return;
    }
    if (moduleId === 'matching') {
      setMatchingReview((prev) => ({ ...prev, ...data }));
      return;
    }
    if (moduleId === 'synthesis') {
      setSynthesisOptions((prev) => ({ ...prev, ...data }));
      return;
    }
    if (moduleId === 'results' && typeof data.focusMetric === 'string') {
      setResultFocus(data.focusMetric);
      return;
    }
    if (DOMAIN_MODULE_IDS.includes(moduleId) && typeof data.note === 'string') {
      setDomainModuleNotes((prev) => ({ ...prev, [moduleId]: data.note }));
    }
  };

  const saveModuleSnapshotLocal = (moduleId, data, summary, savedAt) => {
    const now = savedAt || new Date().toISOString();
    setModuleMemory((prev) => ({
      ...prev,
      [moduleId]: {
        savedAt: now,
        summary,
        data,
      },
    }));
    const label = ALL_MODULE_CATALOG.find((m) => m.id === moduleId)?.label ?? moduleId;
    appendSystemMessage(`${label} 저장됨 (${formatSavedTime(now)})`);
    trackEvent('module_snapshot_saved', {
      userId: currentUserId,
      pipelineId: activeUserPipelineId || activePipelineId,
      moduleId,
      step: workspaceStep,
      result: 'success',
    });
  };

  useEffect(() => {
    if (!activeUserPipelineId || selectedModule === 'workflow') return;
    let disposed = false;
    const loadSnapshot = async () => {
      try {
        const response = await getModuleSnapshotApi(activeUserPipelineId, selectedModule, {
          userId: currentUserId,
        });
        if (disposed || !response?.moduleSnapshot) return;
        const snap = response.moduleSnapshot;
        applySnapshotToDraft(selectedModule, snap.data || {});
        setModuleMemory((prev) => ({
          ...prev,
          [selectedModule]: {
            savedAt: snap.savedAt || null,
            summary: snap.summary || '',
            data: snap.data || {},
          },
        }));
      } catch (error) {
        if (isApiError(error) && error.status === 404) return;
      }
    };
    loadSnapshot();
    return () => {
      disposed = true;
    };
  }, [activeUserPipelineId, selectedModule, currentUserId]);

  const handleDomainChange = (key, value) => {
    setDomainForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutoDraftDomain = () => {
    setDomainForm({
      industry: 'Healthcare',
      subdomain: 'Clinical Trial Safety',
      data_modality: 'Tabular',
      row_unit: 'Patient Visit',
      ml_task: 'Binary Classification',
      target_event: 'Adverse Event Flag',
      include_scope: 'Phase II-III trials, adult cohort, baseline/lab/vitals',
      exclude_scope: 'Pediatric only studies, image-only records, free-text only notes',
    });
  };

  const toggleDatasetSelection = (datasetId) => {
    setSelectedDatasets((prev) =>
      prev.includes(datasetId)
        ? prev.filter((id) => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const setSynthesisMode = (mode) => {
    setSynthesisOptions((prev) => ({
      ...prev,
      mode,
      statusMessage: '',
    }));
  };

  const toggleSynthesisConstraint = (key) => {
    setSynthesisOptions((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [key]: !prev.constraints[key],
      },
    }));
  };

  const runSynthesis = () => {
    const messages = {
      minority_only: 'minority class only 옵션 기준으로 합성 설계를 준비했습니다.',
      subgroup_targeted: 'subgroup targeted 옵션 기준으로 합성 설계를 준비했습니다.',
      balanced_augmentation: 'balanced augmentation 옵션 기준으로 합성 설계를 준비했습니다.',
    };

    setSynthesisOptions((prev) => ({
      ...prev,
      statusMessage: messages[prev.mode],
    }));
  };

  const savedDomain = moduleMemory.domain.savedAt ? moduleMemory.domain.data : null;
  const searchDomainContext = savedDomain || domainForm;
  const usingSavedDomain = Boolean(savedDomain);

  const savedSearch = moduleMemory.search.savedAt ? moduleMemory.search.data : null;
  const matchingDatasets = savedSearch ? savedSearch.selectedDatasets : selectedDatasets;
  const usingSavedSearch = Boolean(savedSearch);

  const savedMatching = moduleMemory.matching.savedAt ? moduleMemory.matching.data : null;
  const savedSynthesis = moduleMemory.synthesis.savedAt ? moduleMemory.synthesis.data : null;

  const saveCurrentModule = async (moduleId) =>
    saveCurrentModuleAction(moduleId, {
      diagnosisResult,
      domainForm,
      selectedDatasets,
      matchingReview,
      synthesisOptions,
      resultFocus,
      domainModuleNotes,
    });

  const moduleStatus = useMemo(() => {
    return ALL_MODULE_CATALOG.reduce((acc, module) => {
      if (module.id === 'workflow') {
        acc[module.id] = {
          state: 'hub',
          label: '파이프라인 허브',
          summary: '자유 진입 가능',
          savedAt: null,
        };
        return acc;
      }

      const memory = moduleMemory[module.id];
      if (!memory?.savedAt) {
        acc[module.id] = {
          state: 'draft',
          label: '미저장',
          summary: 'Draft만 존재',
          savedAt: null,
        };
        return acc;
      }

      const isDirty = JSON.stringify(memory.data) !== JSON.stringify(
        buildModuleDraft(module.id, {
          diagnosisResult,
          domainForm,
          selectedDatasets,
          matchingReview,
          synthesisOptions,
          resultFocus,
          domainModuleNotes,
        }),
      );

      acc[module.id] = {
        state: isDirty ? 'edited' : 'saved',
        label: isDirty ? '수정됨' : '저장됨',
        summary: memory.summary,
        savedAt: memory.savedAt,
      };
      return acc;
    }, {});
  }, [
    diagnosisResult,
    domainForm,
    domainModuleNotes,
    matchingReview,
    moduleMemory,
    resultFocus,
    selectedDatasets,
    synthesisOptions,
  ]);

  const domainSidebarModules = useMemo(
    () =>
      activeDomainKey
        ? DOMAIN_MODULES.filter((m) => m.domainKey === activeDomainKey)
        : [],
    [activeDomainKey]
  );

  const showModuleSidebar =
    selectedModule !== 'workflow' || Boolean(activePipelineId) || Boolean(activeUserPipelineId);

  const handleLoginSuccess = (login) => {
    applyLoginSuccess(login);
    setDataSourcesAuthRequired(false);
    setDataSourcesAuthMessage('');
    setUserPipelinesAuthRequired(false);
    setUserPipelinesAuthMessage('');
    if (typeof window !== 'undefined') {
      const raw = window.sessionStorage.getItem(AUTH_REQUIRED_DRAFT_CACHE_KEY);
      if (raw) {
        const draft = readValidDraftCache(raw);
        if (draft) {
          restoreDraftCache(draft);
          appendSystemMessage('임시 보관된 작성 내용을 복원했습니다.');
          trackEvent('draft_restored', {
            userId: currentUserId,
            pipelineId: activeUserPipelineId || activePipelineId,
            moduleId: selectedModule,
            step: workspaceStep,
            result: 'success',
          });
        }
        window.sessionStorage.removeItem(AUTH_REQUIRED_DRAFT_CACHE_KEY);
      }
    }
    moveToPath(WORKSPACE_ROUTE);
  };

  const handleLogout = async () => {
    await performLogout();
    setDataSources([]);
    setDataSourcesAuthRequired(true);
    setDataSourcesAuthMessage('로그인이 필요한 기능입니다.');
    setUserPipelines([]);
    setUserPipelinesAuthRequired(true);
    setUserPipelinesAuthMessage('로그인이 필요한 기능입니다.');
  };

  const handleGoHome = () => {
    moveToPath(WORKSPACE_ROUTE);
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    setActivePipelineId(null);
    setActiveUserPipelineId(null);
    setActiveDomainKey(null);
  };

  const isWorkspaceRoute = currentPath.startsWith(WORKSPACE_ROUTE);
  const isSharedHubRoute = currentPath.startsWith(SHARED_HUB_ROUTE);
  const isOpsConsoleRoute = currentPath.startsWith(OPS_CONSOLE_ROUTE);
  const workspaceProps = createWorkspaceProps({
    modules: ALL_MODULE_CATALOG,
    pipelines: templatePipelines,
    userPipelines,
    activePipelineId,
    onSelectPipeline: handleSelectPipeline,
    onClearPipeline: () => {
      setActivePipelineId(null);
      setActiveUserPipelineId(null);
      setActiveDomainKey(null);
    },
    onCopyTemplateToUser: copyTemplateToUser,
    onDuplicateUserPipeline: duplicateUserPipeline,
    onDeleteUserPipeline: deleteUserPipeline,
    selectedModule,
    onSelectModule: handleSelectModule,
    moduleStatus,
    moduleMemory,
    onSaveCurrentModule: saveCurrentModule,
    diagnosisResult,
    onDiagnosisChange: setDiagnosisResult,
    domainForm,
    onDomainChange: handleDomainChange,
    onAutoDraftDomain: handleAutoDraftDomain,
    searchDomainContext,
    usingSavedDomain,
    selectedDatasets,
    onToggleDataset: toggleDatasetSelection,
    matchingDatasets,
    usingSavedSearch,
    matchingReview,
    onMatchingReviewChange: setMatchingReview,
    synthesisOptions,
    matchingContext: savedMatching,
    onSetSynthesisMode: setSynthesisMode,
    onToggleSynthesisConstraint: toggleSynthesisConstraint,
    onRunSynthesis: runSynthesis,
    resultFocus,
    onResultFocusChange: setResultFocus,
    synthesisContext: savedSynthesis,
    domainModuleNotes,
    onDomainModuleNoteChange: (moduleId, value) => setDomainModuleNotes((prev) => ({ ...prev, [moduleId]: value })),
    mainHubSection,
    onMainHubSectionChange: setMainHubSectionWithStep,
    dataSources,
    dataSourcesAuthRequired,
    dataSourcesAuthMessage,
    onAddDataSource: addDataSource,
    onUpdateDataSource: updateDataSource,
    onDeleteDataSource: deleteDataSource,
    onConnectDataToPipeline: connectDataToPipeline,
    onCreatePipelineAndLinkData: createPipelineAndLinkData,
    onRequireLoginForDataFormDraft: requestLoginForDataFormDraft,
    onDraftRestored: () =>
      trackEvent('draft_restored', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId || activePipelineId,
        moduleId: selectedModule,
        step: workspaceStep,
        result: 'success',
      }),
    onGoLogin: () => moveToPath(LOGIN_ROUTE),
    isAuthenticated,
    userPipelinesAuthRequired,
    userPipelinesAuthMessage,
    onUpdateUserPipeline: updateUserPipeline,
    onAddModuleToUserPipeline: addModuleToUserPipeline,
    onMoveModuleInUserPipeline: moveModuleInUserPipeline,
    onRemoveModuleFromUserPipeline: removeModuleFromUserPipeline,
    onSetUserPipelineModulePosition: setUserPipelineModulePosition,
    onConnectModuleAfterInUserPipeline: connectModuleAfterInUserPipeline,
    onDisconnectEdgeAfterInUserPipeline: disconnectEdgeAfterInUserPipeline,
    activeUserPipelineId,
    activeUserPipeline,
    onStartPipelineFromModule: startPipelineFromModule,
  });

  useWorkspaceUrlSync({
    isWorkspaceRoute,
    currentPath,
    workspaceStep,
    activeDataSourceId,
    activePipelineId,
    selectedModule,
    setWorkspaceStep,
    setActiveDataSourceId,
    setActivePipelineId,
    setSelectedModule,
  });

  if (currentPath === LOGIN_ROUTE) {
    return (
      <div className="app-root">
        <LoginPageContainer onMoveToPath={moveToPath} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-root">
      <header className="workspace-top-nav">
        <button type="button" className={`workspace-top-nav-btn ${isWorkspaceRoute ? 'active' : ''}`} onClick={() => moveToPath(WORKSPACE_ROUTE)}>
          워크스페이스
        </button>
        <button type="button" className={`workspace-top-nav-btn ${isSharedHubRoute ? 'active' : ''}`} onClick={() => moveToPath(SHARED_HUB_ROUTE)}>
          공유 허브
        </button>
        <button type="button" className={`workspace-top-nav-btn ${isOpsConsoleRoute ? 'active' : ''}`} onClick={() => moveToPath(OPS_CONSOLE_ROUTE)}>
          운영 콘솔
        </button>
      </header>

      <div className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}${chatPanelCollapsed ? ' app-shell--chat-collapsed' : ''}`}>
        {isWorkspaceRoute ? (
          <Sidebar
            auth={auth}
            isAuthenticated={isAuthenticated}
            moveToPath={moveToPath}
            handleLogout={handleLogout}
            handleGoHome={handleGoHome}
            showModuleSidebar={showModuleSidebar}
            workflowModule={MODULES[0]}
            baseModules={MODULES.slice(1)}
            domainModules={domainSidebarModules}
            mainHubSection={mainHubSection}
            onMainHubSectionChange={(id) => {
              setMainHubSection(id);
              if (id === WORKSPACE_STEP_DATA) setWorkspaceStep(WORKSPACE_STEP_DATA);
              else setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
              setActivePipelineId(null);
              setActiveUserPipelineId(null);
              setActiveDomainKey(null);
            }}
            moduleSidebarFocus={moduleSidebarFocus}
            onModuleSidebarFocus={handleModuleSidebarFocus}
            onOpenModuleSettings={handleSelectModule}
            moduleStatus={moduleStatus}
            activeUserPipeline={activeUserPipeline}
            onClearUserPipeline={clearUserPipelineEdit}
            onAddModuleToUserPipeline={addModuleToUserPipeline}
            onRemoveModuleFromUserPipeline={removeModuleFromUserPipeline}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
          />
        ) : null}

        <main className="workspace-area">
          {isWorkspaceRoute ? (
            <WorkspacePage
              conflictInfo={conflictInfo}
              onResolveConflictWithReload={async () => {
                await reloadUserPipelines();
                setConflictInfo(null);
              }}
              onRetryConflict={async () => {
                await conflictInfo?.retry?.();
                setConflictInfo(null);
              }}
              workspaceStep={workspaceStep}
              activeDataSource={activeDataSource}
              activePipeline={activePipeline}
              activeModule={activeModule}
              onStepChange={handleWorkspaceStepChange}
              onClearContext={clearWorkspaceContext}
              workspaceProps={workspaceProps}
            />
          ) : null}
          {isSharedHubRoute ? (
            <SharedHubPage
              templatePipelines={templatePipelines}
              modules={ALL_MODULE_CATALOG}
              moduleStatus={moduleStatus}
              moduleMemory={moduleMemory}
              activePipelineId={activePipelineId}
              onSelectPipeline={handleSelectPipeline}
              onClearPipeline={() => setActivePipelineId(null)}
              onStartModule={handleSelectModule}
              onCopyTemplateToUser={copyTemplateToUser}
              onDuplicateUserPipeline={duplicateUserPipeline}
              onDeleteUserPipeline={deleteUserPipeline}
              onUpdateUserPipeline={updateUserPipeline}
              onMoveModuleInUserPipeline={moveModuleInUserPipeline}
              onRemoveModuleFromUserPipeline={removeModuleFromUserPipeline}
              onSetUserPipelineModulePosition={setUserPipelineModulePosition}
              onConnectModuleAfterInUserPipeline={connectModuleAfterInUserPipeline}
              onDisconnectEdgeAfterInUserPipeline={disconnectEdgeAfterInUserPipeline}
            />
          ) : null}
          {isOpsConsoleRoute ? (
            <OpsConsolePage
              opsQuery={opsQuery}
              onOpsQueryChange={setOpsQuery}
              opsType={opsType}
              onOpsTypeChange={setOpsType}
              onMoveWorkspace={() => moveToPath(WORKSPACE_ROUTE)}
              opsRows={opsRows}
            />
          ) : null}
        </main>

        <AppModals
          isCopiedModalOpen={isModalOpen}
          copiedTitle={pendingTitle}
          onConfirmCopied={() => {
            setMainHubSection('pipeline-mine');
            setSelectedModule('workflow');
            setIsModalOpen(false);
          }}
          onCloseCopied={() => setIsModalOpen(false)}
          isPipelineDeleteModalOpen={isDeleteModalOpen}
          pipelineToDelete={pipelineToDelete}
          onConfirmPipelineDelete={confirmDelete}
          onClosePipelineDelete={closePipelineDeleteModal}
          isDataDeleteModalOpen={isDataDeleteModalOpen}
          dataSourceToDelete={dataSourceToDelete}
          onConfirmDataDelete={confirmDataDelete}
          onCloseDataDelete={closeDataDeleteModal}
        />

        <ChatPanel
          messages={chatMessages}
          onSendMessage={appendChat}
          onUsePrompt={appendChat}
          modules={ALL_MODULE_CATALOG}
          moduleStatus={moduleStatus}
          moduleMemory={moduleMemory}
          collapsed={chatPanelCollapsed}
          onToggleCollapsed={() => setChatPanelCollapsed(!chatPanelCollapsed)}
        />
      </div>
    </div>
  );
}

export default AppShell;
