/**
 * 도메인별 공유 가능한 데이터 파이프라인 정의.
 * 각 파이프라인은 이 시나리오에서 사용할 모듈 id 목록을 가집니다.
 */
export const PIPELINES = [
  {
    id: 'med-mortality',
    domainKey: 'medical',
    domainLabel: '의료',
    title: '사망환자 탐지 데이터 파이프라인',
    description:
      '행정·임상 기록을 결합해 사망·중증 악화 신호를 조기 탐지하기 위한 표준 흐름입니다. 팀 내에서 동일한 단계로 재현·공유할 수 있도록 구성했습니다.',
    moduleIds: ['diagnosis', 'domain', 'search', 'matching', 'synthesis', 'results'],
    highlight: '희소 사망 라벨·클래스 불균형·민감정보 스코프에 초점',
    author: '이준형',
    date: '2001.03.27.',
  },
  {
    id: 'finance-aml',
    domainKey: 'finance',
    domainLabel: '금융',
    title: '이상 거래 탐지 데이터 파이프라인',
    description:
      '실시간·배치 거래 로그에서 의심 패턴을 정의하고, 외부 레퍼런스·규제 가이드와의 정합성을 맞추는 흐름입니다.',
    moduleIds: ['diagnosis', 'domain', 'search', 'matching', 'results'],
    highlight: '합성 단계는 제외하고 탐색·정합·평가 중심으로 공유',
    author: '변백현',
    date: '1992.05.06.',
  },
  {
    id: 'mfg-quality',
    domainKey: 'manufacturing',
    domainLabel: '제조',
    title: '품질 이상 탐지 데이터 파이프라인',
    description:
      '센서·LOT 단위 데이터의 품질 편차를 진단하고, 필요 시 합성 보완까지 이어지는 라인입니다.',
    moduleIds: ['diagnosis', 'domain', 'matching', 'synthesis', 'results'],
    highlight: '시계열·탭ular 혼합, 외부 벤치마크 탐색은 선택',
    author: '이상혁',
    date: '1996.05.07.',
  },
];
