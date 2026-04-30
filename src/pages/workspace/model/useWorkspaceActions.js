import { isApiError } from '../../../api/client';
import { WORKSPACE_STEP_PIPELINE } from '../../../entities/workspace/model/workspaceStep';
import {
  createDataSource as createDataSourceApi,
  createDataSource,
  updateDataSource as updateDataSourceApi,
  updateDataSourceLinkedPipeline as updateDataSourceLinkedPipelineApi,
  deleteDataSource as deleteDataSourceApi,
} from '../../../features/data-sources/api/dataSourcesApi';
import {
  addPipelineModule as addPipelineModuleApi,
  connectPipelineAfter as connectPipelineAfterApi,
  copyPipelineTemplate as copyPipelineTemplateApi,
  createPipeline as createPipelineApi,
  deletePipeline as deletePipelineApi,
  disconnectPipelineAfter as disconnectPipelineAfterApi,
  duplicatePipeline as duplicatePipelineApi,
  removePipelineModule as removePipelineModuleApi,
  reorderPipelineModules as reorderPipelineModulesApi,
  updatePipeline as updatePipelineApi,
  updatePipelineModulePosition as updatePipelineModulePositionApi,
} from '../../../features/pipelines/api/pipelinesApi';
import { saveModuleSnapshot as saveModuleSnapshotApi } from '../../../features/module-snapshots/api/moduleSnapshotsApi';
import { trackEvent } from '../../../utils/analytics';

export function useWorkspaceActions({
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
  allModulesCatalog,
  domainModuleIds,
  mapPipelineRecordToUi,
  mapDataSourceRecordToRow,
  buildModuleDraft,
  buildModuleSummary,
  saveModuleSnapshotLocal,
}) {
  const handleSelectPipeline = (id) => {
    setSelectedModule('workflow');
    setMainHubSection(WORKSPACE_STEP_PIPELINE);
    setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
    setActivePipelineId(id);
    setActiveUserPipelineId(userPipelines.some((p) => p.id === id) ? id : null);
    const resolved = [...templatePipelines, ...userPipelines].find((p) => p.id === id);
    setActiveDomainKey(resolved?.domainKey ?? null);
  };

  const connectDataToPipeline = (pipelineId, dataSourceId) => {
    setActiveDataSourceId(dataSourceId ?? null);
    handleSelectPipeline(pipelineId);
    setMainHubSectionWithStep(WORKSPACE_STEP_PIPELINE);
    setWorkspaceStep(WORKSPACE_STEP_PIPELINE);
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
        if (error.status === 400) {
          appendSystemMessage(`데이터소스 등록 실패: ${error.message}`);
          return false;
        }
        if (error.isTimeout) {
          appendSystemMessage('요청 시간이 초과되었습니다. 다시 시도해주세요.');
          return false;
        }
      }
      notifyApiFailure('데이터소스 등록', error);
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
        if (error.status === 400) {
          appendSystemMessage(`데이터소스 수정 실패: ${error.message}`);
          return false;
        }
      }
      notifyApiFailure('데이터소스 수정', error);
      return false;
    }
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
      setPendingTitle(template.title);
      setIsModalOpen(true);
      setActiveDomainKey(pipeline.domainKey);
      appendSystemMessage(`내 파이프라인 "${pipeline.title}"이(가) 만들어졌습니다.`);
    } catch (error) {
      notifyApiFailure('템플릿 복사', error, { retry: () => copyTemplateToUser(templateId) });
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
      notifyApiFailure('파이프라인 수정', error, { retry: () => updateUserPipeline(id, { title, description, clearAutoNamed }) });
      return false;
    }
  };

  const createPipelineAndLinkData = async (input) => {
    if (!requireAuthForCrud('파이프라인 생성')) return false;
    const {
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
    } = input;
    const template = templatePipelines.find((p) => p.id === templateId);
    if (!template) return false;
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
        const createdDataSource = await createDataSource({
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
      notifyApiFailure('파이프라인 생성', error, { retry: () => createPipelineAndLinkData(input) });
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
      notifyApiFailure('파이프라인 복제', error, { retry: () => duplicateUserPipeline(id) });
    }
  };

  const addModuleToUserPipeline = async (moduleId) => {
    if (!requireAuthForCrud('모듈 추가')) return;
    if (!activeUserPipelineId) return;
    const def = allModulesCatalog.find((m) => m.id === moduleId);
    const pl = userPipelines.find((p) => p.id === activeUserPipelineId);
    if (def?.domainKey && pl?.domainKey && def.domainKey !== pl.domainKey) return;
    try {
      const updated = await addPipelineModuleApi(activeUserPipelineId, { moduleId });
      setUserPipelines((prev) =>
        prev.map((p) => (p.id === activeUserPipelineId ? mapPipelineRecordToUi(updated.pipeline) : p)),
      );
      trackEvent('pipeline_module_added', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId,
        moduleId,
        step: workspaceStep,
        result: 'success',
      });
    } catch (error) {
      notifyApiFailure('모듈 추가', error, { retry: () => addModuleToUserPipeline(moduleId) });
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
      trackEvent('pipeline_module_removed', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId,
        moduleId,
        step: workspaceStep,
        result: 'success',
      });
    } catch (error) {
      notifyApiFailure('모듈 삭제', error, { retry: () => removeModuleFromUserPipeline(moduleId) });
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
      trackEvent('pipeline_module_reordered', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId,
        moduleId: item,
        step: workspaceStep,
        result: 'success',
      });
    } catch (error) {
      notifyApiFailure('모듈 순서 변경', error, { retry: () => moveModuleInUserPipeline(fromIndex, toIndex) });
      await reloadUserPipelines();
    }
  };

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
      trackEvent('pipeline_connection_toggled', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId,
        moduleId: fromModuleId,
        step: workspaceStep,
        result: 'success',
      });
    } catch (error) {
      notifyApiFailure('모듈 연결', error, { retry: () => connectModuleAfterInUserPipeline(fromModuleId, toModuleId) });
      await reloadUserPipelines();
    }
  };

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
      trackEvent('pipeline_connection_toggled', {
        userId: currentUserId,
        pipelineId: activeUserPipelineId,
        moduleId,
        step: workspaceStep,
        result: 'success',
      });
    } catch (error) {
      notifyApiFailure('연결 해제', error, { retry: () => disconnectEdgeAfterInUserPipeline(afterIndex) });
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
      notifyApiFailure('모듈 위치 저장', error, { retry: () => setUserPipelineModulePosition(pipelineId, moduleId, pos) });
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

  const startPipelineFromModule = async (moduleId) => {
    if (!requireAuthForCrud('파이프라인 생성')) return;
    const def = allModulesCatalog.find((m) => m.id === moduleId);
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
      setMainHubSection(WORKSPACE_STEP_PIPELINE);
      appendSystemMessage(`「${def.label}」로 시작하는 파이프라인을 만들었습니다.`);
    } catch (error) {
      notifyApiFailure('파이프라인 생성', error, { retry: () => startPipelineFromModule(moduleId) });
    }
  };

  const saveCurrentModule = async (moduleId, moduleState) => {
    if (!requireAuthForCrud('모듈 저장', { cacheDraft: true })) return;
    if (!activeUserPipelineId) {
      appendSystemMessage('파이프라인를 먼저 선택한 뒤 저장할 수 있습니다.');
      return;
    }
    const data = buildModuleDraft(moduleId, moduleState);
    const summary = buildModuleSummary(moduleId, moduleState);
    try {
      const response = await saveModuleSnapshotApi(activeUserPipelineId, moduleId, {
        userId: currentUserId,
        summary,
        data,
      });
      const saved = response?.moduleSnapshot;
      saveModuleSnapshotLocal(moduleId, saved?.data ?? data, saved?.summary ?? summary, saved?.savedAt);
    } catch {
      appendSystemMessage('저장에 실패했습니다. 편집 상태는 유지되며 다시 시도할 수 있습니다.');
    }
  };

  const deletePipelineById = async (id) => {
    await deletePipelineApi(id);
  };

  const deleteDataSourceById = async (id) => {
    await deleteDataSourceApi(id);
  };

  return {
    handleSelectPipeline,
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
    saveCurrentModule,
    deletePipelineById,
    deleteDataSourceById,
  };
}
