/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   source: string;
 *   updated: string;
 *   rows: string;
 *   linkedPipelineId: string | null;
 *   domainDescription?: string;
 *   domainIndustryContext?: string;
 *   domainSubjectScope?: string;
 *   domainRegulationScope?: string;
 *   domainStakeholderNotes?: string;
 *   dataModality?: string;
 *   rowUnit?: string;
 *   sensitivityNote?: string;
 *   domainKey?: string | null;
 *   domainLabel?: string;
 *   domainNotes?: string;
 * }} DataSourceRow
 */

export const DATA_SOURCES_KEY = 'ai-workbench-data-sources';

export const DEFAULT_DATA_SOURCES = [
  {
    id: 'ds-1',
    name: '임상 요약 테이블',
    source: 'DW · 방문 단위',
    updated: '동기화됨',
    rows: '12.4만 행',
    linkedPipelineId: 'med-mortality',
    domainIndustryContext: '의료 · 다기관 임상 시험 Phase II–III 성인 코호트.',
    domainSubjectScope: '방문 단위 행. 라벨은 AE·사망 포함.',
    domainRegulationScope: 'IRB 승인 범위 내 사용.',
    dataModality: '테이블',
    rowUnit: '환자 방문',
  },
  {
    id: 'ds-2',
    name: '행정 사망 등록',
    source: '질병청 연계',
    updated: '2일 전',
    rows: '8.1만 행',
    linkedPipelineId: 'med-mortality',
    domainIndustryContext: '공공 보건·행정 연계.',
    domainSubjectScope: '사망 신고와 임상 기록 정합용 참조 데이터.',
    domainRegulationScope: '재식별 방지 키 매핑 규칙은 별도 문서.',
  },
  {
    id: 'ds-3',
    name: '실험실 검체 로그',
    source: 'LIS',
    updated: '실시간',
    rows: '연속 수집',
    linkedPipelineId: 'finance-aml',
    domainIndustryContext: '금융 AML 시나리오 데모.',
    domainSubjectScope: '샘플 연계 로그.',
    domainStakeholderNotes: '실제 도메인은 팀 내 데이터 사전을 따름.',
  },
];

export function loadDataSources() {
  try {
    const raw = localStorage.getItem(DATA_SOURCES_KEY);
    if (!raw) return [...DEFAULT_DATA_SOURCES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_DATA_SOURCES];
    return parsed;
  } catch {
    return [...DEFAULT_DATA_SOURCES];
  }
}
