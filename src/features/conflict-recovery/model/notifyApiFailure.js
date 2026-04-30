import { isApiError } from '../../../api/client';

export function notifyApiFailure(actionLabel, error, deps, options = {}) {
  const {
    appendSystemMessage,
    setConflictInfo,
    trackEvent,
    currentUserId,
    activeUserPipelineId,
    activePipelineId,
    selectedModule,
    workspaceStep,
  } = deps;

  if (!isApiError(error)) {
    appendSystemMessage(`${actionLabel}에 실패했습니다. 다시 시도해주세요.`);
    return;
  }
  if (error.status === 401) {
    appendSystemMessage('로그인이 필요합니다. 다시 로그인해주세요.');
    trackEvent('auth_required_prompted', {
      userId: currentUserId,
      pipelineId: activePipelineId,
      moduleId: selectedModule,
      step: workspaceStep,
      result: 'fail',
      errorCode: 401,
    });
    return;
  }
  if (error.status === 403) {
    appendSystemMessage('권한이 없습니다. 본인 리소스인지 확인해주세요.');
    return;
  }
  if (error.status === 409) {
    setConflictInfo({ actionLabel, retry: options.retry });
    appendSystemMessage('동시 수정 충돌이 발생했습니다. 최신 상태를 불러오거나 다시 시도해주세요.');
    trackEvent('conflict_detected_409', {
      userId: currentUserId,
      pipelineId: activeUserPipelineId || activePipelineId,
      moduleId: selectedModule,
      step: workspaceStep,
      result: 'fail',
      errorCode: 409,
    });
    return;
  }
  appendSystemMessage(`${actionLabel} 실패: ${error.message || '오류가 발생했습니다.'}`);
}
