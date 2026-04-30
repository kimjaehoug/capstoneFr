export function requireAuthForCrud(actionLabel = '이 작업', options = {}, deps) {
  const { cacheDraft = false } = options;
  const {
    currentUserId,
    appendSystemMessage,
    buildDraftCache,
    moveToPath,
    draftCacheKey,
  } = deps;

  if (currentUserId) return true;
  appendSystemMessage(`${actionLabel}은 로그인 후 사용할 수 있습니다.`);
  if (cacheDraft && typeof window !== 'undefined') {
    window.sessionStorage.setItem(
      draftCacheKey,
      JSON.stringify({ cachedAt: new Date().toISOString(), draft: buildDraftCache() }),
    );
    appendSystemMessage('현재 작성 내용은 임시 보관되었습니다.');
  }
  const shouldMove = typeof window === 'undefined'
    ? true
    : window.confirm('로그인이 필요합니다. 로그인 화면으로 이동할까요?');
  if (shouldMove) moveToPath('/login');
  return false;
}

export function requestLoginForDataFormDraft(draftPayload, deps) {
  const {
    currentUserId,
    appendSystemMessage,
    moveToPath,
    dataFormCacheKey,
  } = deps;

  if (currentUserId) return true;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(
      dataFormCacheKey,
      JSON.stringify({ cachedAt: new Date().toISOString(), draft: draftPayload }),
    );
  }
  appendSystemMessage('데이터 추가/수정 내용을 임시 보관했습니다.');
  const shouldMove = typeof window === 'undefined'
    ? true
    : window.confirm('로그인이 필요합니다. 로그인 화면으로 이동할까요?');
  if (shouldMove) moveToPath('/login');
  return false;
}
