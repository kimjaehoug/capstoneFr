const PROFILE_MAP = {
  'trial-safety-benchmark': {
    name: 'Trial Safety Benchmark v2',
    rows: [
      { item: '데이터 형태', current: 'Tabular', candidate: 'Tabular', result: '적합' },
      {
        item: '라벨 의미',
        current: 'Adverse Event Flag',
        candidate: 'Adverse Event Flag',
        result: '적합',
      },
      {
        item: '행 단위',
        current: 'Patient Visit',
        candidate: 'Patient Visit',
        result: '적합',
      },
      {
        item: '피처 유사성',
        current: 'Vitals + Labs',
        candidate: 'Vitals + Labs + Med',
        result: '부분 적합',
      },
    ],
  },
  'ehr-adverse-events': {
    name: 'Hospital EHR Adverse Events',
    rows: [
      { item: '데이터 형태', current: 'Tabular', candidate: 'Tabular', result: '적합' },
      {
        item: '라벨 의미',
        current: 'Adverse Event Flag',
        candidate: 'Safety Incident Code',
        result: '부분 적합',
      },
      {
        item: '행 단위',
        current: 'Patient Visit',
        candidate: 'Encounter',
        result: '부분 적합',
      },
      {
        item: '피처 유사성',
        current: 'Vitals + Labs',
        candidate: 'Labs + Orders + Notes',
        result: '부분 적합',
      },
    ],
  },
  'claims-longitudinal': {
    name: 'Claims Longitudinal Cohort',
    rows: [
      { item: '데이터 형태', current: 'Tabular', candidate: 'Tabular', result: '적합' },
      {
        item: '라벨 의미',
        current: 'Adverse Event Flag',
        candidate: 'Claim Rejection',
        result: '부적합',
      },
      {
        item: '행 단위',
        current: 'Patient Visit',
        candidate: 'Monthly Member',
        result: '부적합',
      },
      {
        item: '피처 유사성',
        current: 'Vitals + Labs',
        candidate: 'Claims Codes',
        result: '부적합',
      },
    ],
  },
  'public-rct-registry': {
    name: 'Public RCT Registry Snapshot',
    rows: [
      { item: '데이터 형태', current: 'Tabular', candidate: 'Tabular', result: '적합' },
      {
        item: '라벨 의미',
        current: 'Adverse Event Flag',
        candidate: 'Adverse Event Category',
        result: '부분 적합',
      },
      {
        item: '행 단위',
        current: 'Patient Visit',
        candidate: 'Trial Arm Summary',
        result: '부적합',
      },
      {
        item: '피처 유사성',
        current: 'Vitals + Labs',
        candidate: 'Arm-level Metrics',
        result: '부적합',
      },
    ],
  },
};

const FINAL_FIT_OPTIONS = ['적합', '부분 적합', '부적합'];
const ACTION_PLANS = ['즉시 적용', '부분 적용 후 검증', '후보 제외'];

function MatchingModule({
  selectedDatasets,
  usingSavedSearch,
  matchingReview,
  onMatchingReviewChange,
}) {
  const activeId = selectedDatasets[0] || 'trial-safety-benchmark';
  const activeProfile = PROFILE_MAP[activeId] || PROFILE_MAP['trial-safety-benchmark'];

  const updateReview = (key, value) => {
    onMatchingReviewChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h3 className="section-title">정합성 검토</h3>
      <p className="section-note">
        현재 데이터와 후보 데이터의 의미적 정합성을 비교해 적합도를 확인합니다.
      </p>

      <article className="card compact">
        <h4>비교 대상</h4>
        <p>
          현재 데이터 vs <strong>{activeProfile.name}</strong>
        </p>
        <p className={`fit-tag ${usingSavedSearch ? 'fit-good' : 'fit-mid'}`}>
          {usingSavedSearch
            ? '저장된 외부 탐색 결과 사용 중'
            : '외부 탐색 저장본 없음: 현재 선택 Draft 사용'}
        </p>
        {selectedDatasets.length === 0 && (
          <p className="muted-note">
            외부 탐색에서 선택한 데이터셋이 없어 기본 예시를 사용 중입니다.
          </p>
        )}
      </article>

      <div className="comparison-table">
        <div className="table-row table-head">
          <div>비교 항목</div>
          <div>현재 데이터</div>
          <div>후보 데이터</div>
          <div>결과</div>
        </div>

        {activeProfile.rows.map((row) => (
          <div key={row.item} className="table-row">
            <div>{row.item}</div>
            <div>{row.current}</div>
            <div>{row.candidate}</div>
            <div>
              <span
                className={`fit-tag ${
                  row.result === '적합'
                    ? 'fit-good'
                    : row.result === '부분 적합'
                    ? 'fit-mid'
                    : 'fit-bad'
                }`}
              >
                {row.result}
              </span>
            </div>
          </div>
        ))}
      </div>

      <article className="card">
        <h4>검토 결론</h4>
        <div className="button-row">
          {FINAL_FIT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={matchingReview.finalFit === option ? 'active' : ''}
              onClick={() => updateReview('finalFit', option)}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="form-field">
          <span>후속 액션</span>
          <select
            value={matchingReview.actionPlan}
            onChange={(event) => updateReview('actionPlan', event.target.value)}
          >
            {ACTION_PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </label>
      </article>
    </div>
  );
}

export default MatchingModule;
