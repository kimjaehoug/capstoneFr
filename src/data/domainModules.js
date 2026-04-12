/**
 * 도메인별 전용 모듈. 파이프라인 도메인과 맞을 때 사이드바에서 추가할 수 있습니다.
 */
export const DOMAIN_KEYS = {
  medical: 'medical',
  finance: 'finance',
  manufacturing: 'manufacturing',
};

export const DOMAIN_MODULES = [
  {
    id: 'med_master_patient_index',
    domainKey: DOMAIN_KEYS.medical,
    label: '환자·표본 식별 정합',
    description: '기관 간 환자·생체 표본 키를 맞추고, 분할·중복 건을 정리합니다.',
    pipelineFrom: [],
  },
  {
    id: 'med_outcome_coding',
    domainKey: DOMAIN_KEYS.medical,
    label: '결과·사망 코드 체계',
    description: '사망·중증 전환 라벨과 진단·행정 코드의 매핑·검증 규칙을 둡니다.',
    pipelineFrom: [],
  },
  {
    id: 'med_privacy_cell',
    domainKey: DOMAIN_KEYS.medical,
    label: '민감정보 셀 통제',
    description: '필드·셀 단위 마스킹, 재식별 위험 검토, 접근 권한 범위를 정의합니다.',
    pipelineFrom: [],
  },
  {
    id: 'fin_entity_resolution',
    domainKey: DOMAIN_KEYS.finance,
    label: '거래 주체 해상도',
    description: '계좌·법인·결제수단을 하나의 실체로 묶고 이상 링크를 정리합니다.',
    pipelineFrom: [],
  },
  {
    id: 'fin_pattern_library',
    domainKey: DOMAIN_KEYS.finance,
    label: '탐지 패턴·임계값',
    description: '의심 시나리오 라이브러리와 점수·임계값 운영 규칙을 관리합니다.',
    pipelineFrom: [],
  },
  {
    id: 'fin_audit_trail',
    domainKey: DOMAIN_KEYS.finance,
    label: '감사·신고 필드 매핑',
    description: '규제 신고·감사 추적에 필요한 필드와 출처 시스템을 연결합니다.',
    pipelineFrom: [],
  },
  {
    id: 'mfg_sensor_align',
    domainKey: DOMAIN_KEYS.manufacturing,
    label: '센서 채널 정렬',
    description: '채널·샘플링 주기를 맞추고 결측·이상 구간 보간 정책을 둡니다.',
    pipelineFrom: [],
  },
  {
    id: 'mfg_lot_genealogy',
    domainKey: DOMAIN_KEYS.manufacturing,
    label: 'LOT·공정 계보',
    description: '원자재·공정·완제품 LOT의 역추적 키와 단계 전이를 정의합니다.',
    pipelineFrom: [],
  },
  {
    id: 'mfg_spc_rules',
    domainKey: DOMAIN_KEYS.manufacturing,
    label: 'SPC·알람 규칙',
    description: '관리도, Western Electric 류 규칙, 알람 임계와 에스컬레이션을 설정합니다.',
    pipelineFrom: [],
  },
];

export const DOMAIN_MODULE_IDS = DOMAIN_MODULES.map((m) => m.id);
