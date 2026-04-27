/**
 * 부가 구조 모듈: 각 항목은 특정 기본 구조 모듈(parentCoreModule)에 속합니다.
 * description에는 기본 모듈 대비 차이점을 적습니다.
 */
export const DOMAIN_KEYS = {
  medical: 'medical',
};

/** 부가 모듈을 모듈 조회/관리 등에서 묶어 보여줄 때 순서 */
export const ADDON_PARENT_ORDER = ['diagnosis', 'domain', 'search', 'matching', 'synthesis', 'results'];

/** 기본 구조 모듈 id → 표시 이름 */
export const PARENT_CORE_LABELS = {
  diagnosis: '데이터 진단',
  domain: '도메인 정의',
  search: '외부 데이터 탐색',
  matching: '정합성 검토',
  synthesis: '합성데이터 설계',
  results: '결과 비교',
};

export const DOMAIN_MODULES = [
  /* ---------- 데이터 진단 ---------- */
  {
    id: 'addon_dx_anomaly_sparsity_deep',
    parentCoreModule: 'diagnosis',
    domainKey: DOMAIN_KEYS.medical,
    label: '이상 클래스 희소성 심화 분석',
    description:
      '단순 클래스 비율이 아니라, 이상 클래스가 어떤 환자군·시점·변수 조건에서 부족한지 분석합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dx_timeseries_missing_segments',
    parentCoreModule: 'diagnosis',
    domainKey: DOMAIN_KEYS.medical,
    label: '시계열 결측 구간 분석',
    description: '단순 결측치 개수가 아니라, 시간 흐름에서 어느 구간이 비어 있는지 분석합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dx_leakage_detection',
    parentCoreModule: 'diagnosis',
    domainKey: DOMAIN_KEYS.medical,
    label: '데이터 누수 가능성 탐지',
    description: '예측 시점 이후 정보가 입력 변수에 섞였는지 점검합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dx_class_boundary_overlap',
    parentCoreModule: 'diagnosis',
    domainKey: DOMAIN_KEYS.medical,
    label: '클래스 경계 중첩 분석',
    description: '정상·이상 클래스가 변수 공간에서 얼마나 겹치는지 분석합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dx_patient_level_duplicate',
    parentCoreModule: 'diagnosis',
    domainKey: DOMAIN_KEYS.medical,
    label: '환자 단위 중복 진단',
    description: '동일 환자·동일 입원 기록이 중복되거나 분할 저장되었는지 확인합니다.',
    pipelineFrom: [],
  },

  /* ---------- 도메인 정의 ---------- */
  {
    id: 'addon_dom_label_mapping_clinical',
    parentCoreModule: 'domain',
    domainKey: DOMAIN_KEYS.medical,
    label: '정상·이상 라벨 매핑',
    description:
      '단순 라벨 선택이 아니라 사망·중증 악화·재입원 등 임상 결과 기준으로 라벨 규칙을 세부 정의합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dom_prediction_horizon',
    parentCoreModule: 'domain',
    domainKey: DOMAIN_KEYS.medical,
    label: '예측 시점·관찰 구간 설정',
    description: '몇 시간 데이터를 보고 몇 시간 뒤 이상을 탐지할지 시간 구조를 정의합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dom_variable_semantics',
    parentCoreModule: 'domain',
    domainKey: DOMAIN_KEYS.medical,
    label: '임상 변수 의미 매핑',
    description: '컬럼명을 심박수, 혈압, 산소포화도 등 임상 의미와 연결합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dom_anomaly_subtype',
    parentCoreModule: 'domain',
    domainKey: DOMAIN_KEYS.medical,
    label: '이상 유형 세분화',
    description:
      '이상을 사망, 급성 악화, 검사 이상, 생체신호 이상 등 하위 유형으로 구분합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_dom_cohort_inclusion',
    parentCoreModule: 'domain',
    domainKey: DOMAIN_KEYS.medical,
    label: '분석 대상 환자군·제외 기준 설정',
    description: 'ICU 환자, 응급실 환자, 특정 질환군 등 포함·제외 기준을 설정합니다.',
    pipelineFrom: [],
  },

  /* ---------- 외부 데이터 탐색 ---------- */
  {
    id: 'addon_search_paper_evidence',
    parentCoreModule: 'search',
    domainKey: DOMAIN_KEYS.medical,
    label: '논문 기반 데이터 근거 탐색',
    description:
      '단순 데이터셋 검색이 아니라 유사 연구에서 실제 사용된 데이터·변수·라벨을 찾습니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_search_guideline_criteria',
    parentCoreModule: 'search',
    domainKey: DOMAIN_KEYS.medical,
    label: '임상 가이드라인 기반 기준 탐색',
    description: '정상 범위, 위험 기준, 이상 판단 기준을 의료 지식에서 탐색합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_search_dataset_ranking',
    parentCoreModule: 'search',
    domainKey: DOMAIN_KEYS.medical,
    label: '후보 데이터셋 우선순위 추천',
    description: '후보를 관련성·접근성·품질 기준으로 점수화해 정렬합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_search_license_terms',
    parentCoreModule: 'search',
    domainKey: DOMAIN_KEYS.medical,
    label: '외부 데이터 라이선스·활용 조건 확인',
    description: '데이터 사용 가능 범위, 재배포 제한, 연구·상업 사용 가능성을 검토합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_search_similar_task_cases',
    parentCoreModule: 'search',
    domainKey: DOMAIN_KEYS.medical,
    label: '유사 태스크 사례 탐색',
    description: '사망 예측, 재입원 예측, ICU 악화 탐지 등 유사 문제 사례를 탐색합니다.',
    pipelineFrom: [],
  },

  /* ---------- 정합성 검토 ---------- */
  {
    id: 'addon_match_clinical_semantics',
    parentCoreModule: 'matching',
    domainKey: DOMAIN_KEYS.medical,
    label: '임상 의미 정합성 검토',
    description: '같은 컬럼처럼 보여도 실제 임상 의미가 같은지 검토합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_match_label_consistency',
    parentCoreModule: 'matching',
    domainKey: DOMAIN_KEYS.medical,
    label: '라벨 기준 정합성 검토',
    description: '정상·이상 라벨 정의가 원본과 외부 데이터에서 일관되는지 확인합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_match_temporal_resolution',
    parentCoreModule: 'matching',
    domainKey: DOMAIN_KEYS.medical,
    label: '시계열 해상도 비교',
    description: '샘플링 주기, 관측 시간, 시간 단위가 호환되는지 검토합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_match_population_distribution',
    parentCoreModule: 'matching',
    domainKey: DOMAIN_KEYS.medical,
    label: '환자군 분포 비교',
    description: '연령, 성별, 질환군, 중증도 등 데이터 모집단 차이를 비교합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_match_physio_range',
    parentCoreModule: 'matching',
    domainKey: DOMAIN_KEYS.medical,
    label: '의료 변수 생리학적 범위 검증',
    description: '심박수, 혈압, 체온, 검사 수치 등이 의학적으로 가능한 범위인지 검토합니다.',
    pipelineFrom: [],
  },

  /* ---------- 합성데이터 설계 ---------- */
  {
    id: 'addon_syn_strategy_recommend',
    parentCoreModule: 'synthesis',
    domainKey: DOMAIN_KEYS.medical,
    label: '보완 전략 추천',
    description: '데이터 특성에 따라 외부 데이터 병합, class weight, 합성 생성 등 전략을 추천합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_syn_anomaly_generation_conditions',
    parentCoreModule: 'synthesis',
    domainKey: DOMAIN_KEYS.medical,
    label: '이상 샘플 생성 조건 설정',
    description: '이상 클래스별로 생성 조건, 생성 비율, 제외 조건을 세부 설정합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_syn_domain_constraint_rules',
    parentCoreModule: 'synthesis',
    domainKey: DOMAIN_KEYS.medical,
    label: '도메인 제약 기반 생성 규칙',
    description: '의료 변수 범위, 변수 간 관계, 라벨 조건을 반영한 생성 규칙을 정의합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_syn_timeseries_anomaly_patterns',
    parentCoreModule: 'synthesis',
    domainKey: DOMAIN_KEYS.medical,
    label: '시계열 이상 패턴 설계',
    description: '급격한 악화, 점진적 악화, 회복 후 재악화 같은 시간 패턴을 설계합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_syn_method_comparison',
    parentCoreModule: 'synthesis',
    domainKey: DOMAIN_KEYS.medical,
    label: '생성 방식 비교 선택',
    description: 'SMOTE 계열, 통계 기반, 생성 모델 기반 등 생성 방식을 비교 후 선택합니다.',
    pipelineFrom: [],
  },

  /* ---------- 결과 비교 ---------- */
  {
    id: 'addon_res_false_negative_analysis',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: 'False Negative 감소 분석',
    description: '이상 환자를 정상으로 놓친 비율이 얼마나 줄었는지 집중 분석합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_res_auroc_auprc_focus',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: 'AUROC/AUPRC 중심 검증',
    description: '불균형 이상탐지에 적합한 지표 중심으로 성능을 평가합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_res_synthetic_quality_check',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: '합성데이터 품질 검증',
    description: '원본과 합성데이터의 분포, 상관관계, 중복 여부를 검토합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_res_threshold_performance',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: '임계값별 성능 분석',
    description:
      'anomaly score 또는 예측 확률 임계값에 따른 성능 변화를 비교합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_res_explainable_report',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: '설명 가능 결과 리포트',
    description: '어떤 변수와 시간 구간이 이상 판단에 영향을 줬는지 리포트를 생성합니다.',
    pipelineFrom: [],
  },
  {
    id: 'addon_res_failure_case_analysis',
    parentCoreModule: 'results',
    domainKey: DOMAIN_KEYS.medical,
    label: '실패 사례 분석',
    description: '보완 후에도 탐지하지 못한 이상 사례를 분석해 개선 방향을 제시합니다.',
    pipelineFrom: [],
  },
];

export const DOMAIN_MODULE_IDS = DOMAIN_MODULES.map((m) => m.id);
