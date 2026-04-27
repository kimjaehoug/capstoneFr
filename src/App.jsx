import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import ChatPanel from './components/ChatPanel';
import LoginPage from './components/LoginPage';
import { PIPELINES } from './data/pipelines';
import { DOMAIN_MODULES, DOMAIN_MODULE_IDS } from './data/domainModules';
import { DATA_SOURCES_KEY, loadDataSources } from './data/dataSources';
import { defaultLayoutFromIds } from './utils/pipelineLayout';
import { clearAuthState, loadAuthState, logout, saveAuthState } from './utils/auth';
import {
  connectAfterReorder,
  defaultConnectedAfter,
  mergeConnectionsAfterRemove,
  normalizeConnectedAfter,
  reconnectAfterReorder,
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

/** http 등 비보안 컨텍스트에서도 동작하도록 UUID 대체 포함 */
function newEntityId(prefix) {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${suffix}`;
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

function createInitialModuleMemory() {
  return SAVEABLE_MODULES.reduce((acc, moduleId) => {
    acc[moduleId] = { savedAt: null, summary: '', data: null };
    return acc;
  }, {});
}

function App() {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname || '/'
  );
  const [selectedModule, setSelectedModule] = useState('workflow');
  /** 사이드바 목록에서 한 번 클릭으로만 바뀌는 강조(설정 화면은 더블클릭) */
  const [moduleSidebarFocus, setModuleSidebarFocus] = useState('workflow');
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [activeUserPipelineId, setActiveUserPipelineId] = useState(null);
  const [userPipelines, setUserPipelines] = useState(() => loadUserPipelines());
  const [activeDomainKey, setActiveDomainKey] = useState(null);
  const [mainHubSection, setMainHubSection] = useState('pipeline');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
  const [dataSources, setDataSources] = useState(() => loadDataSources());
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

  useEffect(() => {
    localStorage.setItem(USER_PIPELINES_KEY, JSON.stringify(userPipelines));
  }, [userPipelines]);

  useEffect(() => {
    localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(dataSources));
  }, [dataSources]);

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
    const resolved = [...PIPELINES, ...userPipelines].find((p) => p.id === id);
    setActiveDomainKey(resolved?.domainKey ?? null);
  };

  const addDataSource = (payload) => {
    const {
      name,
      source,
      rowsLabel,
      linkedPipelineId,
      domainDescription,
      domainIndustryContext,
      domainSubjectScope,
      domainRegulationScope,
      domainStakeholderNotes,
      dataModality,
      rowUnit,
      sensitivityNote,
    } = payload;
    setDataSources((prev) => [
      ...prev,
      {
        id: newEntityId('ds'),
        name,
        source,
        updated: '방금 추가',
        rows: rowsLabel,
        linkedPipelineId: linkedPipelineId || null,
        ...(domainDescription?.trim() ? { domainDescription: domainDescription.trim() } : {}),
        ...(domainIndustryContext?.trim() ? { domainIndustryContext: domainIndustryContext.trim() } : {}),
        ...(domainSubjectScope?.trim() ? { domainSubjectScope: domainSubjectScope.trim() } : {}),
        ...(domainRegulationScope?.trim() ? { domainRegulationScope: domainRegulationScope.trim() } : {}),
        ...(domainStakeholderNotes?.trim() ? { domainStakeholderNotes: domainStakeholderNotes.trim() } : {}),
        ...(dataModality?.trim() ? { dataModality: dataModality.trim() } : {}),
        ...(rowUnit?.trim() ? { rowUnit: rowUnit.trim() } : {}),
        ...(sensitivityNote?.trim() ? { sensitivityNote: sensitivityNote.trim() } : {}),
      },
    ]);
  };

  const deleteDataSource = (id) => {
    setDataSources((prev) => prev.filter((d) => d.id !== id));
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

  const copyTemplateToUser = (templateId) => {
    const template = PIPELINES.find((p) => p.id === templateId);
    if (!template) return;
    setMainHubSection('pipeline');
    const newPl = {
      id: newEntityId('user'),
      domainKey: template.domainKey,
      domainLabel: template.domainLabel,
      title: `${template.title} (복사본)`,
      description: template.description,
      moduleIds: [...template.moduleIds],
      connectedAfter: defaultConnectedAfter(template.moduleIds.length),
      moduleLayout: defaultLayoutFromIds(template.moduleIds),
      highlight: template.highlight || '',
      createdAt: new Date().toISOString(),
      autoNamed: false,
    };
    setUserPipelines((prev) => [...prev, newPl]);
    setActiveUserPipelineId(newPl.id);
    setActivePipelineId(newPl.id);
    setActiveDomainKey(template.domainKey);
    setSelectedModule('workflow');
    appendSystemMessage(
      `내 파이프라인 "${newPl.title}"이(가) 만들어졌습니다. 왼쪽에서 모듈을 조정할 수 있습니다.`
    );
  };

  const updateUserPipeline = (id, { title, description, clearAutoNamed }) => {
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p };
        if (title != null) next.title = String(title).trim() || p.title;
        if (description != null) next.description = String(description).trim();
        if (clearAutoNamed) next.autoNamed = false;
        return next;
      })
    );
  };

  const createPipelineAndLinkData = ({
    datasetName,
    source,
    rowsLabel,
    templateId,
    pipelineTitle,
    pipelineDescription,
    domainDescription,
    domainIndustryContext,
    domainSubjectScope,
    domainRegulationScope,
    domainStakeholderNotes,
    dataModality,
    rowUnit,
    sensitivityNote,
  }) => {
    const template = PIPELINES.find((p) => p.id === templateId);
    if (!template) return;
    const idx = userPipelines.length + 1;
    const hasCustomTitle = Boolean(pipelineTitle?.trim());
    const title = hasCustomTitle ? pipelineTitle.trim() : `파이프라인 ${idx}`;
    const description =
      pipelineDescription?.trim() ||
      `「${datasetName}」에 연결된 처리 흐름입니다. 모듈을 진행한 뒤 이름·설명을 다듬을 수 있습니다.`;
    const newPl = {
      id: newEntityId('user'),
      domainKey: template.domainKey,
      domainLabel: template.domainLabel,
      title,
      description,
      moduleIds: [...template.moduleIds],
      connectedAfter: defaultConnectedAfter(template.moduleIds.length),
      moduleLayout: defaultLayoutFromIds(template.moduleIds),
      highlight: template.highlight || '',
      createdAt: new Date().toISOString(),
      autoNamed: !hasCustomTitle,
    };
    setUserPipelines((prev) => [...prev, newPl]);
    setDataSources((prev) => [
      ...prev,
      {
        id: newEntityId('ds'),
        name: datasetName,
        source,
        updated: '방금 추가',
        rows: rowsLabel,
        linkedPipelineId: newPl.id,
        ...(domainDescription?.trim() ? { domainDescription: domainDescription.trim() } : {}),
        ...(domainIndustryContext?.trim() ? { domainIndustryContext: domainIndustryContext.trim() } : {}),
        ...(domainSubjectScope?.trim() ? { domainSubjectScope: domainSubjectScope.trim() } : {}),
        ...(domainRegulationScope?.trim() ? { domainRegulationScope: domainRegulationScope.trim() } : {}),
        ...(domainStakeholderNotes?.trim() ? { domainStakeholderNotes: domainStakeholderNotes.trim() } : {}),
        ...(dataModality?.trim() ? { dataModality: dataModality.trim() } : {}),
        ...(rowUnit?.trim() ? { rowUnit: rowUnit.trim() } : {}),
        ...(sensitivityNote?.trim() ? { sensitivityNote: sensitivityNote.trim() } : {}),
      },
    ]);
    appendSystemMessage(`파이프라인 "${title}"이(가) 만들어지고 데이터와 연결되었습니다.`);
  };

  const duplicateUserPipeline = (id) => {
    const source = userPipelines.find((p) => p.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: newEntityId('user'),
      title: `${source.title} (복사본)`,
      createdAt: new Date().toISOString(),
      autoNamed: false,
    };
    setUserPipelines((prev) => [...prev, copy]);
    setActiveUserPipelineId(copy.id);
    setActivePipelineId(copy.id);
    setActiveDomainKey(source.domainKey);
    setSelectedModule('workflow');
    appendSystemMessage(`파이프라인 "${copy.title}"이(가) 복사되었습니다.`);
  };

  const deleteUserPipeline = (id) => {
    const pl = userPipelines.find((p) => p.id === id);
    if (!pl) return;
    if (!window.confirm(`"${pl.title}" 파이프라인을 삭제할까요?`)) return;
    setUserPipelines((prev) => prev.filter((p) => p.id !== id));
    if (activeUserPipelineId === id) setActiveUserPipelineId(null);
    if (activePipelineId === id) {
      setActivePipelineId(null);
      setActiveDomainKey(null);
    }
    appendSystemMessage('파이프라인이 삭제되었습니다.');
  };

  const addModuleToUserPipeline = (moduleId) => {
    if (!activeUserPipelineId) return;
    const def = ALL_MODULE_CATALOG.find((m) => m.id === moduleId);
    const pl = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (def?.domainKey && pl?.domainKey && def.domainKey !== pl.domainKey) return;
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== activeUserPipelineId) return p;
        if (p.moduleIds.includes(moduleId)) return p;
        const layout = { ...(p.moduleLayout || {}) };
        const lastId = p.moduleIds[p.moduleIds.length - 1];
        if (lastId && layout[lastId]) {
          layout[moduleId] = { x: layout[lastId].x + 120, y: layout[lastId].y + 60 };
        } else {
          layout[moduleId] = { x: 160 + p.moduleIds.length * 48, y: 160 + p.moduleIds.length * 48 };
        }
        const prevConn = normalizeConnectedAfter(p.moduleIds, p.connectedAfter);
        return {
          ...p,
          moduleIds: [...p.moduleIds, moduleId],
          connectedAfter: [...prevConn, true],
          moduleLayout: layout,
        };
      })
    );
  };

  const removeModuleFromUserPipeline = (moduleId) => {
    if (!activeUserPipelineId) return;
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== activeUserPipelineId) return p;
        if (p.moduleIds.length <= 1) return p;
        if (!p.moduleIds.includes(moduleId)) return p;
        const layout = { ...(p.moduleLayout || {}) };
        delete layout[moduleId];
        const { moduleIds: newIds, connectedAfter: newConn } = mergeConnectionsAfterRemove(
          p.moduleIds,
          p.connectedAfter,
          moduleId
        );
        return { ...p, moduleIds: newIds, connectedAfter: newConn, moduleLayout: layout };
      })
    );
  };

  const moveModuleInUserPipeline = (fromIndex, toIndex) => {
    if (!activeUserPipelineId) return;
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== activeUserPipelineId) return p;
        const n = p.moduleIds.length;
        if (fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n) return p;
        if (fromIndex === toIndex) return p;
        const oldIds = [...p.moduleIds];
        const oldConn = normalizeConnectedAfter(oldIds, p.connectedAfter);
        const next = [...oldIds];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        const newConn = reconnectAfterReorder(oldIds, oldConn, next);
        return { ...p, moduleIds: next, connectedAfter: newConn };
      })
    );
  };

  /** 실행 순서에서 toModuleId를 fromModuleId 바로 뒤로 옮김 (출력→입력 드래그 연결) */
  const connectModuleAfterInUserPipeline = (fromModuleId, toModuleId) => {
    if (!activeUserPipelineId || fromModuleId === toModuleId) return;
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== activeUserPipelineId) return p;
        const oldIds = [...p.moduleIds];
        const oldConn = normalizeConnectedAfter(oldIds, p.connectedAfter);
        const ids = [...oldIds];
        const iFrom = ids.indexOf(fromModuleId);
        const iTo = ids.indexOf(toModuleId);
        if (iFrom === -1 || iTo === -1) return p;
        if (iTo === iFrom + 1) {
          if (oldConn[iFrom]) return p;
          const nextConn = [...oldConn];
          nextConn[iFrom] = true;
          return { ...p, connectedAfter: nextConn };
        }
        ids.splice(iTo, 1);
        const newFrom = ids.indexOf(fromModuleId);
        ids.splice(newFrom + 1, 0, toModuleId);
        const newConn = connectAfterReorder(oldIds, oldConn, ids, fromModuleId, toModuleId);
        return { ...p, moduleIds: ids, connectedAfter: newConn };
      })
    );
  };

  const resolveDomainMetaForModule = (def) => {
    if (def.domainKey) {
      const pl = PIPELINES.find((p) => p.domainKey === def.domainKey);
      return {
        domainKey: def.domainKey,
        domainLabel: pl?.domainLabel ?? '의료',
      };
    }
    const containing = PIPELINES.find((p) => p.moduleIds.includes(def.id));
    if (containing) {
      return { domainKey: containing.domainKey, domainLabel: containing.domainLabel };
    }
    return { domainKey: 'medical', domainLabel: '의료' };
  };

  /** 모듈 조회/관리에서 연 모듈 전용: 이 모듈만 넣은 내 파이프라인을 만들고 워크플로 화면으로 이동 */
  const startPipelineFromModule = (moduleId) => {
    const def = ALL_MODULE_CATALOG.find((m) => m.id === moduleId);
    if (!def || def.id === 'workflow') return;
    const { domainKey, domainLabel } = resolveDomainMetaForModule(def);
    const newPl = {
      id: newEntityId('user'),
      domainKey,
      domainLabel,
      title: `${def.label}에서 시작`,
      description: `「${def.label}」 단계부터 이어서 구성할 수 있는 내 파이프라인입니다.`,
      moduleIds: [moduleId],
      connectedAfter: [],
      moduleLayout: defaultLayoutFromIds([moduleId]),
      highlight: '',
      createdAt: new Date().toISOString(),
      autoNamed: true,
    };
    setUserPipelines((prev) => [...prev, newPl]);
    setActiveUserPipelineId(newPl.id);
    setActivePipelineId(newPl.id);
    setActiveDomainKey(domainKey);
    setSelectedModule('workflow');
    setMainHubSection('pipeline');
    appendSystemMessage(
      `「${def.label}」로 시작하는 파이프라인을 만들었습니다. 캔버스에서 흐름을 이어 구성할 수 있습니다.`
    );
  };

  /** index와 index+1 모듈 사이의 연결만 끊음 (모듈은 파이프라인에 그대로 둠) */
  const disconnectEdgeAfterInUserPipeline = (afterIndex) => {
    if (!activeUserPipelineId) return;
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== activeUserPipelineId) return p;
        const ids = p.moduleIds;
        if (afterIndex < 0 || afterIndex >= ids.length - 1) return p;
        const conn = normalizeConnectedAfter(ids, p.connectedAfter);
        if (!conn[afterIndex]) return p;
        const next = [...conn];
        next[afterIndex] = false;
        return { ...p, connectedAfter: next };
      })
    );
  };

  const setUserPipelineModulePosition = (pipelineId, moduleId, pos) => {
    setUserPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== pipelineId) return p;
        return {
          ...p,
          moduleLayout: {
            ...(p.moduleLayout || {}),
            [moduleId]: { x: pos.x, y: pos.y },
          },
        };
      })
    );
  };

  const saveModuleSnapshot = (moduleId, data, summary) => {
    const now = new Date().toISOString();
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

  const saveCurrentModule = (moduleId) => {
    if (moduleId === 'diagnosis') {
      const diagnosisLabelMap = {
        imbalance_high: '불균형 가능성 높음',
        suspected: '의심',
        healthy: '현재 양호',
      };
      saveModuleSnapshot(
        'diagnosis',
        { diagnosisResult },
        `결과: ${diagnosisLabelMap[diagnosisResult]}`
      );
    }

    if (moduleId === 'domain') {
      saveModuleSnapshot(
        'domain',
        { ...domainForm },
        `${domainForm.industry || '미정'} / ${domainForm.ml_task || '미정'}`
      );
    }

    if (moduleId === 'search') {
      saveModuleSnapshot(
        'search',
        { selectedDatasets: [...selectedDatasets] },
        `선택 데이터셋 ${selectedDatasets.length}개`
      );
    }

    if (moduleId === 'matching') {
      saveModuleSnapshot(
        'matching',
        { ...matchingReview },
        `정합성: ${matchingReview.finalFit}`
      );
    }

    if (moduleId === 'synthesis') {
      saveModuleSnapshot(
        'synthesis',
        { ...synthesisOptions },
        `모드: ${synthesisOptions.mode}`
      );
    }

    if (moduleId === 'results') {
      saveModuleSnapshot(
        'results',
        { focusMetric: resultFocus },
        `포커스 지표: ${resultFocus}`
      );
    }

    if (DOMAIN_MODULE_IDS.includes(moduleId)) {
      const note = domainModuleNotes[moduleId] ?? '';
      const summary =
        note.trim().length > 0
          ? `${note.trim().slice(0, 40)}${note.trim().length > 40 ? '…' : ''}`
          : '메모 없음';
      saveModuleSnapshot(moduleId, { note }, summary);
    }
  };

  const moduleStatus = useMemo(() => {
    const getDraftPayload = (moduleId) => {
      if (moduleId === 'diagnosis') return { diagnosisResult };
      if (moduleId === 'domain') return domainForm;
      if (moduleId === 'search') return { selectedDatasets };
      if (moduleId === 'matching') return matchingReview;
      if (moduleId === 'synthesis') return synthesisOptions;
      if (moduleId === 'results') return { focusMetric: resultFocus };
      if (DOMAIN_MODULE_IDS.includes(moduleId)) return { note: domainModuleNotes[moduleId] ?? '' };
      return {};
    };

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

      const isDirty =
        JSON.stringify(memory.data) !== JSON.stringify(getDraftPayload(module.id));

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
    const next = {
      accessToken: login.accessToken,
      tokenType: login.tokenType,
      expiresIn: login.expiresIn,
      user: login.user,
    };
    saveAuthState(next);
    setAuth(next);
    moveToPath('/');
  };

  const handleLogout = async () => {
    await logout();
    clearAuthState();
    setAuth(null);
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
      <header className="app-topbar">
        <button type="button" className="app-topbar-logo" onClick={handleGoHome} aria-label="처음 화면으로 이동">
          WWorkbench
        </button>
        {auth?.user ? (
          <div className="top-auth-box">
            <span className="top-auth-name">{auth.user.name || auth.user.email}</span>
            <button type="button" className="top-login-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <button type="button" className="top-login-btn" onClick={() => moveToPath('/login')}>
            로그인
          </button>
        )}
      </header>

      <div
        className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}${
          chatPanelCollapsed ? ' app-shell--chat-collapsed' : ''
        }`}
      >
        <Sidebar
          showModuleSidebar={showModuleSidebar}
          workflowModule={MODULES[0]}
          baseModules={MODULES.slice(1)}
          domainModules={domainSidebarModules}
          mainHubSection={mainHubSection}
          onMainHubSectionChange={setMainHubSection}
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
            pipelines={PIPELINES}
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
            onAddDataSource={addDataSource}
            onDeleteDataSource={deleteDataSource}
            onConnectDataToPipeline={connectDataToPipeline}
            onCreatePipelineAndLinkData={createPipelineAndLinkData}
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

        <ChatPanel
          messages={chatMessages}
          onSendMessage={appendChat}
          onUsePrompt={appendChat}
          modules={ALL_MODULE_CATALOG}
          moduleStatus={moduleStatus}
          moduleMemory={moduleMemory}
          collapsed={chatPanelCollapsed}
          onToggleCollapsed={() => setChatPanelCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}

export default App;
