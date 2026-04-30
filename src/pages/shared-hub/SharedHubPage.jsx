import PipelineHub from '../../modules/PipelineHub';

function SharedHubPage({
  templatePipelines,
  modules,
  moduleStatus,
  moduleMemory,
  activePipelineId,
  onSelectPipeline,
  onClearPipeline,
  onStartModule,
  onCopyTemplateToUser,
  onDuplicateUserPipeline,
  onDeleteUserPipeline,
  onUpdateUserPipeline,
  onMoveModuleInUserPipeline,
  onRemoveModuleFromUserPipeline,
  onSetUserPipelineModulePosition,
  onConnectModuleAfterInUserPipeline,
  onDisconnectEdgeAfterInUserPipeline,
}) {
  return (
    <PipelineHub
      templatePipelines={templatePipelines}
      userPipelines={[]}
      modules={modules}
      moduleStatus={moduleStatus}
      moduleMemory={moduleMemory}
      activePipelineId={activePipelineId}
      onSelectPipeline={onSelectPipeline}
      onClearPipeline={onClearPipeline}
      onStartModule={onStartModule}
      onCopyTemplateToUser={onCopyTemplateToUser}
      onDuplicateUserPipeline={onDuplicateUserPipeline}
      onDeleteUserPipeline={onDeleteUserPipeline}
      onUpdateUserPipeline={onUpdateUserPipeline}
      onMoveModuleInUserPipeline={onMoveModuleInUserPipeline}
      onRemoveModuleFromUserPipeline={onRemoveModuleFromUserPipeline}
      onSetUserPipelineModulePosition={onSetUserPipelineModulePosition}
      onConnectModuleAfterInUserPipeline={onConnectModuleAfterInUserPipeline}
      onDisconnectEdgeAfterInUserPipeline={onDisconnectEdgeAfterInUserPipeline}
      userPipelinesAuthRequired={false}
      userPipelinesAuthMessage=""
    />
  );
}

export default SharedHubPage;
