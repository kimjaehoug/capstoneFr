/**
 * 데이터셋·템플릿 맥락에 맞는 파이프라인 이름·설명 초안 (프로토타입용 추천 문구).
 */
export function suggestPipelineFromDataset(datasetName, template) {
  const dn = datasetName?.trim() || '데이터셋';
  const tTitle = template?.title || '파이프라인';
  const domain = template?.domainLabel || '';

  return {
    title: `${dn} · ${tTitle}`,
    description: `「${dn}」에 연결된 처리 흐름입니다. ${domain ? `${domain} 도메인` : '선택한 템플릿'} 구조를 따르며, 모듈 단계에서 세부를 조정할 수 있습니다.`,
  };
}
