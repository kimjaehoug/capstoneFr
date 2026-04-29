import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import ChatPanel from './components/ChatPanel';
import LoginPage from './components/LoginPage';
import { PIPELINES } from './data/pipelines';
import { DOMAIN_MODULES, DOMAIN_MODULE_IDS } from './data/domainModules';
import { DATA_SOURCES_KEY, loadDataSources } from './data/dataSources';
import { clearAuthState, getMyProfile, loadAuthState, logout, saveAuthState } from './utils/auth';
import { isApiError, setUnauthorizedHandler } from './api/client';
import {
  createDataSource as createDataSourceApi,
  deleteDataSource as deleteDataSourceApi,
  listDataSources as listDataSourcesApi,
  updateDataSource as updateDataSourceApi,
  updateDataSourceLinkedPipeline as updateDataSourceLinkedPipelineApi,
} from './api/dataSources';
import {
  getModuleSnapshot as getModuleSnapshotApi,
  saveModuleSnapshot as saveModuleSnapshotApi,
} from './api/moduleSnapshots';
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
} from './api/pipelines';
import {
  normalizeConnectedAfter,
} from './utils/pipelineConnections';

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

const USER_PIPELINES_KEY = 'ai-workbench-user-pipelines';
const AUTH_EXPIRED_NOTICE_KEY = 'stage-one-auth-expired-notice';
const AUTH_REQUIRED_DRAFT_CACHE_KEY = 'stage-one-auth-required-draft';
const AUTH_REQUIRED_DATA_FORM_CACHE_KEY = 'stage-one-auth-required-data-form';
const AUTH_REQUIRED_DRAFT_TTL_MS = 30 * 60 * 1000;
const APP_CACHE_PREFIXES = ['stage-one-', 'ai-workbench-'];
const LOGOUT_CACHE_CLEAR_SIGNAL_KEY = 'stage-one-logout-cache-clear-signal';
function getAuthUserId(auth) {
  return auth?.user?.id ?? auth?.user?.userId ?? null;
}

function clearAppTemporaryCaches() {
  if (typeof window === 'undefined') return;

  const shouldClear = (key) => APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));

  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (key && shouldClear(key)) {
      window.localStorage.removeItem(key);
    }
  }

  for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = window.sessionStorage.key(i);
    if (key && shouldClear(key)) {
      window.sessionStorage.removeItem(key);
    }
  }
}

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

function formatSavedTime(isoDate) {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDataSourceUpdated(isoDate) {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPipelineId, setPendingPipelineId] = useState(null);
  const [pendingTitle, setPendingTitle] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname || '/'
  );

  const [isDataDeleteModalOpen, setIsDataDeleteModalOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState(null);

  const [selectedModule, setSelectedModule] = useState('workflow');
  /** 사이드바 목록에서 한 번 클릭으로만 바뀌는 강조(설정 화면은 더블클릭) */
  const [moduleSidebarFocus, setModuleSidebarFocus] = useState('workflow');
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [activeUserPipelineId, setActiveUserPipelineId] = useState(null);
  const [templatePipelines, setTemplatePipelines] = useState(PIPELINES);
  const [userPipelines, setUserPipelines] = useState(() => loadUserPipelines());
  const [userPipelinesAuthRequired, setUserPipelinesAuthRequired] = useState(false);
  const [userPipelinesAuthMessage, setUserPipelinesAuthMessage] = useState('');
  const [activeDomainKey, setActiveDomainKey] = useState(null);
  const [mainHubSection, setMainHubSection] = useState('pipeline');
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
  const [auth, setAuth] = useState(() => loadAuthState());
  const currentUserId = getAuthUserId(auth);
  const isAuthenticated = Boolean(auth?.accessToken);

  useEffect(() => {
    if (!auth?.accessToken || currentUserId) return;
    let cancelled = false;

    (async () => {
      try {
        const me = await getMyProfile(auth.accessToken);
        const normalizedUser = me?.user
          ? {
              ...me.user,
              id: me.user.id ?? me.user.userId ?? null,
            }
          : null;
        if (!normalizedUser?.id || cancelled) return;
        const next = { ...auth, user: normalizedUser };
        saveAuthState(next);
        setAuth(next);
      } catch {
        // 인증 만료/오류는 공통 unauthorized handler에서 처리한다.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, currentUserId]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          AUTH_EXPIRED_NOTICE_KEY,
          '세션이 만료되었습니다. 다시 로그인해주세요.',
        );
      }
      clearAuthState();
      setAuth(null);
      setSelectedModule('workflow');
      setMainHubSection('pipeline');
      setActivePipelineId(null);
      setActiveUserPipelineId(null);
      setActiveDomainKey(null);
      if (typeof window !== 'undefined' && (window.location.pathname || '/') !== '/login') {
        window.history.pushState({}, '', '/login');
        setCurrentPath('/login');
      }
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key !== LOGOUT_CACHE_CLEAR_SIGNAL_KEY || !event.newValue) return;
      clearAppTemporaryCaches();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const moveToPath = (path) => {
    if (typeof window === 'undefined') return;
    const current = window.location.pathname || '/';
    if (current !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
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

  const requireAuthForCrud = (actionLabel = '이 작업', { cacheDraft = false } = {}) => {
    if (currentUserId) return true;
    appendSystemMessage(`${actionLabel}은 로그인 후 사용할 수 있습니다.`);
    if (cacheDraft && typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        AUTH_REQUIRED_DRAFT_CACHE_KEY,
        JSON.stringify({ cachedAt: new Date().toISOString(), draft: buildDraftCache() }),
      );
      appendSystemMessage('현재 작성 내용은 임시 보관되었습니다.');
    }
    const shouldMove = typeof window === 'undefined'
      ? true
      : window.confirm('로그인이 필요합니다. 로그인 화면으로 이동할까요?');
    if (shouldMove) moveToPath('/login');
    return false;
  };

  const requestLoginForDataFormDraft = (draftPayload) => {
    if (currentUserId) return true;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        AUTH_REQUIRED_DATA_FORM_CACHE_KEY,
        JSON.stringify({ cachedAt: new Date().toISOString(), draft: draftPayload }),
      );
    }
    appendSystemMessage('데이터 추가/수정 내용을 임시 보관했습니다.');
    const shouldMove = typeof window === 'undefined'
      ? true
      : window.confirm('로그인이 필요합니다. 로그인 화면으로 이동할까요?');
    if (shouldMove) moveToPath('/login');
    return false;
  };

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

  const handleSelectPipeline = (id) => {
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    setActivePipelineId(id);
    setActiveUserPipelineId(userPipelines.some((p) => p.id === id) ? id : null);
    const resolved = [...templatePipelines, ...userPipelines].find((p) => p.id === id);
    setActiveDomainKey(resolved?.domainKey ?? null);
  };

  const addDataSource = async (payload) => {
    if (!requireAuthForCrud('데이터 등록')) return false;
    const {
      name,
      source,
      rowsLabel,
      linkedPipelineId,
      domainIndustryContext,
      domainSubjectScope,
      domainRegulationScope,
      domainStakeholderNotes,
      dataModality,
      rowUnit,
      sensitivityNote,
    } = payload;
    try {
      const created = await createDataSourceApi({
        userId: currentUserId,
        name,
        source,
        rowsLabel,
        linkedPipelineId: linkedPipelineId || null,
        domainIndustryContext: domainIndustryContext || null,
        domainSubjectScope: domainSubjectScope || null,
        domainRegulationScope: domainRegulationScope || null,
        domainStakeholderNotes: domainStakeholderNotes || null,
        dataModality: dataModality || null,
        rowUnit: rowUnit || null,
        sensitivityNote: sensitivityNote || null,
      });
      setDataSources((prev) => [...prev, mapDataSourceRecordToRow(created.dataSource)]);
      appendSystemMessage(`"${name}" 데이터셋이 등록되었습니다.`);
      return true;
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 400 || error.status === 409) {
          appendSystemMessage(`데이터소스 등록 실패: ${error.message}`);
          return false;
        }
        if (error.isTimeout) {
          appendSystemMessage('요청 시간이 초과되었습니다. 다시 시도해주세요.');
          return false;
        }
      }
      appendSystemMessage('데이터소스 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      return false;
    }
  };

  const updateDataSource = async (updatedData) => {
    if (!requireAuthForCrud('데이터 수정')) return false;
    const patch = {
      userId: currentUserId,
      name: updatedData.name,
      source: updatedData.source,
      rowsLabel: updatedData.rowsLabel,
      linkedPipelineId: updatedData.linkedPipelineId ?? null,
      domainIndustryContext: updatedData.domainIndustryContext ?? null,
      domainSubjectScope: updatedData.domainSubjectScope ?? null,
      domainRegulationScope: updatedData.domainRegulationScope ?? null,
      domainStakeholderNotes: updatedData.domainStakeholderNotes ?? null,
      dataModality: updatedData.dataModality ?? null,
      rowUnit: updatedData.rowUnit ?? null,
      sensitivityNote: updatedData.sensitivityNote ?? null,
    };
    try {
      const linkedPipelineChanged = Object.prototype.hasOwnProperty.call(updatedData, 'linkedPipelineId');
      const updated = linkedPipelineChanged
        ? await updateDataSourceLinkedPipelineApi(updatedData.id, updatedData.linkedPipelineId ?? null)
        : await updateDataSourceApi(updatedData.id, patch);
      setDataSources((prev) =>
        prev.map((item) => (item.id === updatedData.id ? mapDataSourceRecordToRow(updated.dataSource) : item)),
      );
      appendSystemMessage(`"${updatedData.name}" 데이터 정보가 수정되었습니다.`);
      return true;
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 404) {
          appendSystemMessage('대상 데이터소스를 찾을 수 없습니다. 목록을 새로고침합니다.');
          await reloadDataSources();
          return false;
        }
        if (error.status === 400 || error.status === 409) {
          appendSystemMessage(`데이터소스 수정 실패: ${error.message}`);
          return false;
        }
      }
      appendSystemMessage('데이터소스 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
      return false;
    }
  };

  const deleteDataSource = (id) => {
    const target = dataSources.find((d) => d.id === id);
    if (!target) return;
    setDataSourceToDelete(target);
    setIsDataDeleteModalOpen(true);
  };

  const confirmDataDelete = async () => {
    if (!requireAuthForCrud('데이터 삭제')) return;
    if (!dataSourceToDelete) return;

    const { id, name } = dataSourceToDelete;
    try {
      await deleteDataSourceApi(id);
      setDataSources((prev) => prev.filter((d) => d.id !== id));
      appendSystemMessage(`"${name}" 데이터셋이 삭제되었습니다.`);
      setIsDataDeleteModalOpen(false);
      setDataSourceToDelete(null);
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        appendSystemMessage('이미 삭제된 데이터소스입니다. 목록을 동기화합니다.');
        await reloadDataSources();
        setIsDataDeleteModalOpen(false);
        setDataSourceToDelete(null);
        return;
      }
      appendSystemMessage('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const connectDataToPipeline = (pipelineId) => {
    handleSelectPipeline(pipelineId);
    setMainHubSection('pipeline');
  };

  /** 모듈/워크플로 전환만 담당. 파이프라인 선택은 handleSelectPipeline·onClearPipeline에서만 바꿈 */
  const handleSelectModule = (moduleId) => {
    setSelectedModule(moduleId);
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

  const copyTemplateToUser = async (templateId) => {
    if (!requireAuthForCrud('템플릿 복사')) return;
    const template = templatePipelines.find((p) => p.id === templateId);
    if (!template) return;
    try {
      const copied = await copyPipelineTemplateApi(templateId, {
        userId: currentUserId,
        title: `${template.title} (복사본)`,
      });
      const pipeline = mapPipelineRecordToUi(copied.pipeline);
      setUserPipelines((prev) => [...prev, pipeline]);
      setPendingPipelineId(pipeline.id);
      setPendingTitle(template.title);
      setIsModalOpen(true);
      setActiveDomainKey(pipeline.domainKey);
      appendSystemMessage(`내 파이프라인 "${pipeline.title}"이(가) 만들어졌습니다.`);
    } catch (error) {
      appendSystemMessage(`템플릿 복사 실패: ${error?.message || '오류가 발생했습니다.'}`);
    }
  };

  const updateUserPipeline = async (id, { title, description, clearAutoNamed }) => {
    if (!requireAuthForCrud('파이프라인 수정')) return false;
    const current = userPipelines.find((p) => p.id === id);
    if (!current) return false;
    const patch = {
      userId: currentUserId,
      title: title != null ? String(title).trim() || current.title : current.title,
      description: description != null ? String(description).trim() : current.description,
      autoNamed: clearAutoNamed ? false : current.autoNamed,
    };
    try {
      const updated = await updatePipelineApi(id, patch);
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === id ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
      return true;
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        appendSystemMessage('대상 파이프라인이 존재하지 않습니다. 목록을 갱신합니다.');
        await reloadUserPipelines();
        return false;
      }
      appendSystemMessage(`파이프라인 수정 실패: ${error?.message || '오류가 발생했습니다.'}`);
      return false;
    }
  };

  const createPipelineAndLinkData = async ({
    datasetName,
    source,
    rowsLabel,
    templateId,
    pipelineTitle,
    pipelineDescription,
    domainIndustryContext,
    domainSubjectScope,
    domainRegulationScope,
    domainStakeholderNotes,
    dataModality,
    rowUnit,
    sensitivityNote,
  }) => {
    if (!requireAuthForCrud('파이프라인 생성')) return false;
    const template = templatePipelines.find((p) => p.id === templateId);
    if (!template) return;
    const hasCustomTitle = Boolean(pipelineTitle?.trim());
    const title = hasCustomTitle ? pipelineTitle.trim() : `파이프라인 ${userPipelines.length + 1}`;

    try {
      const createdPipeline = await copyPipelineTemplateApi(templateId, {
        userId: currentUserId,
        title,
      });
      let pipeline = mapPipelineRecordToUi(createdPipeline.pipeline);
      if (pipelineDescription?.trim()) {
        const updatedPipeline = await updatePipelineApi(pipeline.id, {
          userId: currentUserId,
          description: pipelineDescription.trim(),
        });
        pipeline = mapPipelineRecordToUi(updatedPipeline.pipeline);
      }
      setUserPipelines((prev) => [...prev, pipeline]);

      try {
        const createdDataSource = await createDataSourceApi({
          userId: currentUserId,
          name: datasetName,
          source,
          rowsLabel,
          linkedPipelineId: pipeline.id,
          domainIndustryContext: domainIndustryContext || null,
          domainSubjectScope: domainSubjectScope || null,
          domainRegulationScope: domainRegulationScope || null,
          domainStakeholderNotes: domainStakeholderNotes || null,
          dataModality: dataModality || null,
          rowUnit: rowUnit || null,
          sensitivityNote: sensitivityNote || null,
        });
        setDataSources((prev) => [...prev, mapDataSourceRecordToRow(createdDataSource.dataSource)]);
        appendSystemMessage(`파이프라인 "${pipeline.title}"이(가) 만들어지고 데이터와 연결되었습니다.`);
      } catch {
        appendSystemMessage('파이프라인은 생성되었지만 데이터 연결에 실패했습니다. 데이터 연결을 다시 시도해주세요.');
      }
      return true;
    } catch (error) {
      appendSystemMessage(`파이프라인 생성 실패: ${error?.message || '오류가 발생했습니다.'}`);
      return false;
    }
  };

  const duplicateUserPipeline = async (id) => {
    if (!requireAuthForCrud('파이프라인 복제')) return;
    const source = userPipelines.find((p) => p.id === id);
    if (!source) return;
    try {
      const duplicated = await duplicatePipelineApi(id, {
        userId: currentUserId,
        title: `${source.title} (복사본)`,
      });
      const copy = mapPipelineRecordToUi(duplicated.pipeline);
      setUserPipelines((prev) => [...prev, copy]);
      setActiveUserPipelineId(copy.id);
      setActivePipelineId(copy.id);
      setActiveDomainKey(copy.domainKey);
      setSelectedModule('workflow');
      appendSystemMessage(`파이프라인 "${copy.title}"이(가) 복사되었습니다.`);
    } catch (error) {
      appendSystemMessage(`파이프라인 복제 실패: ${error?.message || '오류가 발생했습니다.'}`);
    }
  };

  const deleteUserPipeline = (id) => {
    const pl = userPipelines.find((p) => p.id === id);
    if (!pl) return;
    
    setPipelineToDelete(pl); 
    setIsDeleteModalOpen(true);
};

  const confirmDelete = async () => {
    if (!requireAuthForCrud('파이프라인 삭제')) return;
    if (!pipelineToDelete) return;
    try {
      const id = pipelineToDelete.id;
      await deletePipelineApi(id);
      setUserPipelines((prev) => prev.filter((p) => p.id !== id));

      if (activeUserPipelineId === id) setActiveUserPipelineId(null);
      if (activePipelineId === id) {
        setActivePipelineId(null);
        setActiveDomainKey(null);
      }

      appendSystemMessage(`"${pipelineToDelete.title}" 파이프라인이 삭제되었습니다.`);
      setIsDeleteModalOpen(false);
      setPipelineToDelete(null);
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        appendSystemMessage('이미 삭제된 파이프라인입니다. 목록을 동기화합니다.');
        await reloadUserPipelines();
        setIsDeleteModalOpen(false);
        setPipelineToDelete(null);
        return;
      }
      appendSystemMessage('파이프라인 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const addModuleToUserPipeline = async (moduleId) => {
    if (!requireAuthForCrud('모듈 추가')) return;
    if (!activeUserPipelineId) return;
    const def = ALL_MODULE_CATALOG.find((m) => m.id === moduleId);
    const pl = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (def?.domainKey && pl?.domainKey && def.domainKey !== pl.domainKey) return;
    try {
      const updated = await addPipelineModuleApi(activeUserPipelineId, { moduleId });
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 409)) {
        appendSystemMessage(`모듈 추가 실패: ${error.message}`);
        return;
      }
      appendSystemMessage('모듈 추가에 실패했습니다. 목록을 다시 불러옵니다.');
      await reloadUserPipelines();
    }
  };

  const removeModuleFromUserPipeline = async (moduleId) => {
    if (!requireAuthForCrud('모듈 삭제')) return;
    if (!activeUserPipelineId) return;
    try {
      const updated = await removePipelineModuleApi(activeUserPipelineId, moduleId);
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 409)) {
        appendSystemMessage(`모듈 삭제 실패: ${error.message}`);
        return;
      }
      appendSystemMessage('모듈 삭제에 실패했습니다. 목록을 다시 불러옵니다.');
      await reloadUserPipelines();
    }
  };

  const moveModuleInUserPipeline = async (fromIndex, toIndex) => {
    if (!requireAuthForCrud('모듈 순서 변경')) return;
    if (!activeUserPipelineId) return;
    const current = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (!current) return;
    const n = current.moduleIds.length;
    if (fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n || fromIndex === toIndex) return;
    const next = [...current.moduleIds];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    try {
      const updated = await reorderPipelineModulesApi(activeUserPipelineId, next);
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
    } catch (error) {
      appendSystemMessage(`모듈 순서 변경 실패: ${error?.message || '오류가 발생했습니다.'}`);
      await reloadUserPipelines();
    }
  };

  /** 실행 순서에서 toModuleId를 fromModuleId 바로 뒤로 옮김 (출력→입력 드래그 연결) */
  const connectModuleAfterInUserPipeline = async (fromModuleId, toModuleId) => {
    if (!requireAuthForCrud('모듈 연결')) return;
    if (!activeUserPipelineId || fromModuleId === toModuleId) return;
    const current = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (!current) return;
    const ids = [...current.moduleIds];
    const iFrom = ids.indexOf(fromModuleId);
    const iTo = ids.indexOf(toModuleId);
    if (iFrom === -1 || iTo === -1) return;
    try {
      if (iTo !== iFrom + 1) {
        ids.splice(iTo, 1);
        const newFrom = ids.indexOf(fromModuleId);
        ids.splice(newFrom + 1, 0, toModuleId);
        const reordered = await reorderPipelineModulesApi(activeUserPipelineId, ids);
        setUserPipelines((prev) =>
          prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(reordered.pipeline) : p)),
        );
      }
      const connected = await connectPipelineAfterApi(activeUserPipelineId, fromModuleId);
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(connected.pipeline) : p)),
      );
    } catch (error) {
      appendSystemMessage(`모듈 연결 실패: ${error?.message || '오류가 발생했습니다.'}`);
      await reloadUserPipelines();
    }
  };

  const resolveDomainMetaForModule = (def) => {
    if (def.domainKey) {
      const pl = templatePipelines.find((p) => p.domainKey === def.domainKey);
      return {
        domainKey: def.domainKey,
        domainLabel: pl?.domainLabel ?? '의료',
      };
    }
    const containing = templatePipelines.find((p) => p.moduleIds.includes(def.id));
    if (containing) {
      return { domainKey: containing.domainKey, domainLabel: containing.domainLabel };
    }
    return { domainKey: 'medical', domainLabel: '의료' };
  };

  /** 모듈 조회/관리에서 연 모듈 전용: 이 모듈만 넣은 내 파이프라인을 만들고 워크플로 화면으로 이동 */
  const startPipelineFromModule = async (moduleId) => {
    if (!requireAuthForCrud('파이프라인 생성')) return;
    const def = ALL_MODULE_CATALOG.find((m) => m.id === moduleId);
    if (!def || def.id === 'workflow') return;
    const { domainKey, domainLabel } = resolveDomainMetaForModule(def);
    try {
      const created = await createPipelineApi({
        userId: currentUserId,
        kind: 'custom',
        domainKey,
        domainLabel,
        title: `${def.label}에서 시작`,
        description: `「${def.label}」 단계부터 이어서 구성할 수 있는 내 파이프라인입니다.`,
        moduleIds: [moduleId],
        connectedAfter: [],
        moduleLayout: {},
        highlight: '',
        autoNamed: true,
      });
      const newPl = mapPipelineRecordToUi(created.pipeline);
      setUserPipelines((prev) => [...prev, newPl]);
      await reloadUserPipelines();
      setActiveUserPipelineId(newPl.id);
      setActivePipelineId(newPl.id);
      setActiveDomainKey(domainKey);
      setSelectedModule('workflow');
      setMainHubSection('pipeline');
      appendSystemMessage(`「${def.label}」로 시작하는 파이프라인을 만들었습니다.`);
    } catch (error) {
      appendSystemMessage(`파이프라인 생성 실패: ${error?.message || '오류가 발생했습니다.'}`);
    }
  };

  /** index와 index+1 모듈 사이의 연결만 끊음 (모듈은 파이프라인에 그대로 둠) */
  const disconnectEdgeAfterInUserPipeline = async (afterIndex) => {
    if (!requireAuthForCrud('연결 해제')) return;
    if (!activeUserPipelineId) return;
    const current = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (!current) return;
    const moduleId = current.moduleIds[afterIndex];
    if (!moduleId) return;
    try {
      const updated = await disconnectPipelineAfterApi(activeUserPipelineId, moduleId);
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
    } catch (error) {
      appendSystemMessage(`연결 해제 실패: ${error?.message || '오류가 발생했습니다.'}`);
      await reloadUserPipelines();
    }
  };

  const setUserPipelineModulePosition = async (pipelineId, moduleId, pos) => {
    if (!requireAuthForCrud('모듈 위치 저장')) return;
    try {
      const updated = await updatePipelineModulePositionApi(pipelineId, moduleId, { x: pos.x, y: pos.y });
      setUserPipelines((prev) => prev.map((p) => (p.id === pipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)));
    } catch (error) {
      if (isApiError(error) && error.status === 400) return;
      appendSystemMessage('모듈 위치 저장에 실패했습니다.');
    }
  };

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

  const saveCurrentModule = async (moduleId) => {
    if (!requireAuthForCrud('모듈 저장', { cacheDraft: true })) return;
    if (!activeUserPipelineId) {
      appendSystemMessage('파이프라인를 먼저 선택한 뒤 저장할 수 있습니다.');
      return;
    }
    const state = {
      diagnosisResult,
      domainForm,
      selectedDatasets,
      matchingReview,
      synthesisOptions,
      resultFocus,
      domainModuleNotes,
    };
    const data = buildModuleDraft(moduleId, state);
    const summary = buildModuleSummary(moduleId, state);
    try {
      const response = await saveModuleSnapshotApi(activeUserPipelineId, moduleId, {
        userId: currentUserId,
        summary,
        data,
      });
      const saved = response?.moduleSnapshot;
      saveModuleSnapshotLocal(moduleId, saved?.data ?? data, saved?.summary ?? summary, saved?.savedAt);
    } catch (error) {
      appendSystemMessage('저장에 실패했습니다. 편집 상태는 유지되며 다시 시도할 수 있습니다.');
    }
  };

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
    const normalizedUser = login?.user
      ? {
          ...login.user,
          id: login.user.id ?? login.user.userId ?? null,
        }
      : null;
    const next = {
      accessToken: login.accessToken,
      tokenType: login.tokenType,
      expiresIn: login.expiresIn,
      user: normalizedUser,
    };
    saveAuthState(next);
    setAuth(next);
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
        }
        window.sessionStorage.removeItem(AUTH_REQUIRED_DRAFT_CACHE_KEY);
      }
    }
    moveToPath('/');
  };

  const handleLogout = async () => {
    await logout();
    if (typeof window !== 'undefined') {
      clearAppTemporaryCaches();
      window.localStorage.setItem(LOGOUT_CACHE_CLEAR_SIGNAL_KEY, String(Date.now()));
      window.localStorage.removeItem(LOGOUT_CACHE_CLEAR_SIGNAL_KEY);
    }
    clearAuthState();
    setAuth(null);
    setDataSources([]);
    setDataSourcesAuthRequired(true);
    setDataSourcesAuthMessage('로그인이 필요한 기능입니다.');
    setUserPipelines([]);
    setUserPipelinesAuthRequired(true);
    setUserPipelinesAuthMessage('로그인이 필요한 기능입니다.');
  };

  const handleGoHome = () => {
    moveToPath('/');
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    setActivePipelineId(null);
    setActiveUserPipelineId(null);
    setActiveDomainKey(null);
  };

  if (currentPath === '/login') {
    return (
      <div className="app-root">
        <LoginPage onBack={() => moveToPath('/')} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-root">
      <div
        className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}${
          chatPanelCollapsed ? ' app-shell--chat-collapsed' : ''
        }`}
      >
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

        <main className="workspace-area">
          <Workspace
            modules={ALL_MODULE_CATALOG}
            pipelines={templatePipelines}
            userPipelines={userPipelines}
            activePipelineId={activePipelineId}
            onSelectPipeline={handleSelectPipeline}
            onClearPipeline={() => {
              setActivePipelineId(null);
              setActiveUserPipelineId(null);
              setActiveDomainKey(null);
            }}
            onCopyTemplateToUser={copyTemplateToUser}
            onDuplicateUserPipeline={duplicateUserPipeline}
            onDeleteUserPipeline={deleteUserPipeline}
            selectedModule={selectedModule}
            onSelectModule={handleSelectModule}
            moduleStatus={moduleStatus}
            moduleMemory={moduleMemory}
            onSaveCurrentModule={saveCurrentModule}
            diagnosisResult={diagnosisResult}
            onDiagnosisChange={setDiagnosisResult}
            domainForm={domainForm}
            onDomainChange={handleDomainChange}
            onAutoDraftDomain={handleAutoDraftDomain}
            searchDomainContext={searchDomainContext}
            usingSavedDomain={usingSavedDomain}
            selectedDatasets={selectedDatasets}
            onToggleDataset={toggleDatasetSelection}
            matchingDatasets={matchingDatasets}
            usingSavedSearch={usingSavedSearch}
            matchingReview={matchingReview}
            onMatchingReviewChange={setMatchingReview}
            synthesisOptions={synthesisOptions}
            matchingContext={savedMatching}
            onSetSynthesisMode={setSynthesisMode}
            onToggleSynthesisConstraint={toggleSynthesisConstraint}
            onRunSynthesis={runSynthesis}
            resultFocus={resultFocus}
            onResultFocusChange={setResultFocus}
            synthesisContext={savedSynthesis}
            domainModuleNotes={domainModuleNotes}
            onDomainModuleNoteChange={(moduleId, value) =>
              setDomainModuleNotes((prev) => ({ ...prev, [moduleId]: value }))
            }
            mainHubSection={mainHubSection}
            onMainHubSectionChange={setMainHubSection}
            dataSources={dataSources}
            dataSourcesAuthRequired={dataSourcesAuthRequired}
            dataSourcesAuthMessage={dataSourcesAuthMessage}
            onAddDataSource={addDataSource}
            onUpdateDataSource={updateDataSource}
            onDeleteDataSource={deleteDataSource}
            onConnectDataToPipeline={connectDataToPipeline}
            onCreatePipelineAndLinkData={createPipelineAndLinkData}
            onRequireLoginForDataFormDraft={requestLoginForDataFormDraft}
            onGoLogin={() => moveToPath('/login')}
            isAuthenticated={isAuthenticated}
            userPipelinesAuthRequired={userPipelinesAuthRequired}
            userPipelinesAuthMessage={userPipelinesAuthMessage}
            onUpdateUserPipeline={updateUserPipeline}
            onMoveModuleInUserPipeline={moveModuleInUserPipeline}
            onRemoveModuleFromUserPipeline={removeModuleFromUserPipeline}
            onSetUserPipelineModulePosition={setUserPipelineModulePosition}
            onConnectModuleAfterInUserPipeline={connectModuleAfterInUserPipeline}
            onDisconnectEdgeAfterInUserPipeline={disconnectEdgeAfterInUserPipeline}
            activeUserPipelineId={activeUserPipelineId}
            onStartPipelineFromModule={startPipelineFromModule}
          />
        </main>

        {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>알림</h3>
            <p>
            <strong>"{pendingTitle}"</strong>이 복사되었습니다.<br/>
            '내 파이프라인' 메뉴에서 확인하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="btn-modal-primary" onClick={() => {
                setMainHubSection('pipeline-mine');
                //setActiveUserPipelineId(pendingPipelineId);
                //setActivePipelineId(null);
                setSelectedModule('workflow');
                setIsModalOpen(false);
              }}>예</button>
              <button className="btn-modal-secondary" onClick={() => setIsModalOpen(false)}>아니오</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>파이프라인 삭제</h3>
            <p>
              <strong>"{pipelineToDelete?.title}"</strong><br/>
              이 파이프라인을 정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-delete-primary" 
                onClick={confirmDelete}
              >
                삭제하기
              </button>
              <button className="btn-modal-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {isDataDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>데이터 삭제</h3>
            <p>
              <strong>"{dataSourceToDelete?.name}"</strong><br/>
              이 데이터셋을 정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-delete-primary"
                onClick={confirmDataDelete}
              >
                삭제하기
              </button>
              <button 
                className="btn-modal-secondary" 
                onClick={() => setIsDataDeleteModalOpen(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

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

export default App;
