import { useState } from 'react';
import { isApiError } from '../../api/client';

export function useDeleteConfirm({
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
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [isDataDeleteModalOpen, setIsDataDeleteModalOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState(null);

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
      await deletePipelineById(id);
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
      notifyApiFailure('파이프라인 삭제', error, { retry: confirmDelete });
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
      await deleteDataSourceById(id);
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
      notifyApiFailure('데이터 삭제', error, { retry: confirmDataDelete });
    }
  };

  return {
    isDeleteModalOpen,
    pipelineToDelete,
    isDataDeleteModalOpen,
    dataSourceToDelete,
    deleteUserPipeline,
    confirmDelete,
    deleteDataSource,
    confirmDataDelete,
    closePipelineDeleteModal: () => setIsDeleteModalOpen(false),
    closeDataDeleteModal: () => setIsDataDeleteModalOpen(false),
  };
}
