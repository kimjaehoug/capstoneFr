const DATASET_CANDIDATES = [
  {
    id: 'trial-safety-benchmark',
    name: 'Trial Safety Benchmark v2',
    description: '임상시험 이상반응 분류를 위한 구조화 표본 데이터셋',
    fit: '적합',
  },
  {
    id: 'ehr-adverse-events',
    name: 'Hospital EHR Adverse Events',
    description: '병원 EHR 기반 이상반응 이벤트 로그',
    fit: '부분 적합',
  },
  {
    id: 'claims-longitudinal',
    name: 'Claims Longitudinal Cohort',
    description: '청구데이터 기반 장기 추적 코호트, 라벨 정의 차이 존재',
    fit: '부적합',
  },
  {
    id: 'public-rct-registry',
    name: 'Public RCT Registry Snapshot',
    description: '공개 임상시험 레지스트리 요약 테이블',
    fit: '적합',
  },
];

function SearchModule({
  domainContext,
  usingSavedDomain,
  selectedDatasets,
  onToggleDataset,
}) {
  const queryDrafts = [
    `industry:${domainContext.industry || 'Healthcare'} AND subdomain:${
      domainContext.subdomain || 'Clinical Trial Safety'
    }`,
    `task:${domainContext.ml_task || 'Binary Classification'} target:${
      domainContext.target_event || 'Adverse Event Flag'
    }`,
    `modality:${domainContext.data_modality || 'Tabular'} row_unit:${
      domainContext.row_unit || 'Patient Visit'
    }`,
  ];

  return (
    <div>
      <h3 className="section-title">외부 데이터 탐색</h3>
      <p className="section-note">
        실제 검색 없이, 쿼리 초안과 후보 데이터셋 더미 결과를 검토합니다.
      </p>

      <article className="card compact">
        <h4>입력 소스</h4>
        <p className={`fit-tag ${usingSavedDomain ? 'fit-good' : 'fit-mid'}`}>
          {usingSavedDomain
            ? '저장된 도메인 정의 사용 중'
            : '도메인 저장본 없음: 현재 draft를 임시 사용'}
        </p>
      </article>

      <article className="card">
        <h4>검색 쿼리 초안</h4>
        <ul className="simple-list">
          {queryDrafts.map((query) => (
            <li key={query}>{query}</li>
          ))}
        </ul>
      </article>

      <div className="card-grid">
        {DATASET_CANDIDATES.map((dataset) => {
          const selected = selectedDatasets.includes(dataset.id);
          return (
            <article key={dataset.id} className={`card ${selected ? 'selected' : ''}`}>
              <h4>{dataset.name}</h4>
              <p>{dataset.description}</p>
              <p
                className={`fit-tag ${
                  dataset.fit === '적합'
                    ? 'fit-good'
                    : dataset.fit === '부분 적합'
                    ? 'fit-mid'
                    : 'fit-bad'
                }`}
              >
                {dataset.fit}
              </p>
              <button type="button" onClick={() => onToggleDataset(dataset.id)}>
                {selected ? '선택 해제' : '선택'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default SearchModule;
