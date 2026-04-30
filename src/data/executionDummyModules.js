export const EXECUTION_DUMMY_BY_TASK = {
  diagnosis: {
    inputSummary: 'clinical_trials_subset_2024.csv · 12,480행 · 28컬럼 · classification',
    evidence: ['소수 클래스 비율 높음', '기관별 분포 편차 존재', '결측 컬럼 3개 감지'],
    expectedResult: '불균형 위험 높음, 보정 전략 권장',
    subTasks: [
      '이상 클래스 희소성 심화 분석',
      '시계열 결측 구간 분석',
      '데이터 누수 가능성 탐지',
      '클래스 경계 중첩 분석',
    ],
  },
  domain: {
    inputSummary: '임상/이상반응 키워드 기반 도메인 후보 분석',
    evidence: ['추천 도메인 5개', '의료/생명과학 relevance 높음', '설명문 신호 3개 추출'],
    expectedResult: '의료(임상) + 생명과학 우선 확정',
    subTasks: [
      '정상·이상 라벨 매핑',
      '예측 시점·관찰 구간 설정',
      '임상 변수 의미 매핑',
      '분석 대상 환자군·제외 기준 설정',
    ],
  },
  search: {
    inputSummary: '선택 도메인 기준 외부 후보 데이터셋 탐색',
    evidence: ['후보 데이터셋 12건', '메타데이터 스키마 매칭 7건', '라이선스 적합 5건'],
    expectedResult: '정합성 검토 대상으로 3건 선별',
    subTasks: [
      '논문 기반 데이터 근거 탐색',
      '임상 가이드라인 기반 기준 탐색',
      '후보 데이터셋 우선순위 추천',
      '외부 데이터 라이선스·활용 조건 확인',
    ],
  },
  matching: {
    inputSummary: '내부 데이터와 후보 데이터 의미/스키마 정합성 비교',
    evidence: ['컬럼 매핑 성공률 82%', '타겟 라벨 의미 일치', '시간 축 불일치 1건'],
    expectedResult: '부분 적합(보정 후 사용 가능)',
    subTasks: [
      '임상 의미 정합성 검토',
      '라벨 기준 정합성 검토',
      '시계열 해상도 비교',
      '환자군 분포 비교',
    ],
  },
  synthesis: {
    inputSummary: '희소 라벨 보완용 합성 데이터 전략 설정',
    evidence: ['제약조건 4개 적용', '민감 속성 보호 규칙 반영', '샘플 확장 배수 x1.8'],
    expectedResult: '학습용 증강 세트 생성 준비 완료',
    subTasks: [
      '보완 전략 추천',
      '이상 샘플 생성 조건 설정',
      '도메인 제약 기반 생성 규칙',
      '시계열 이상 패턴 설계',
    ],
  },
  results: {
    inputSummary: '원본/보완/합성 결과 지표 비교',
    evidence: ['PR-AUC +0.06', '재현율 +0.11', '정밀도 -0.02'],
    expectedResult: '보완 데이터 적용안 승인 검토',
    subTasks: [
      'False Negative 감소 분석',
      'AUROC/AUPRC 중심 검증',
      '합성데이터 품질 검증',
      '임계값별 성능 분석',
    ],
  },
};
