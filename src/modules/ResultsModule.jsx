const RESULT_CARDS = [
  {
    id: 'original',
    title: '원본 데이터',
    metrics: {
      accuracy: 0.82,
      f1: 0.61,
      minority_recall: 0.41,
    },
  },
  {
    id: 'augmented',
    title: '보완 데이터',
    metrics: {
      accuracy: 0.84,
      f1: 0.69,
      minority_recall: 0.57,
    },
  },
  {
    id: 'synthetic',
    title: '합성데이터 적용',
    metrics: {
      accuracy: 0.83,
      f1: 0.72,
      minority_recall: 0.66,
    },
  },
];

const FOCUS_METRICS = ['accuracy', 'f1', 'minority_recall'];

function metricToPercent(value) {
  return Math.round(value * 100);
}

function ResultsModule({ resultFocus, onResultFocusChange, synthesisContext }) {
  return (
    <div>
      <h3 className="section-title">결과 비교</h3>
      <p className="section-note">
        원본/보완/합성 데이터 기준 결과를 비교하는 더미 지표입니다.
      </p>

      <article className="card compact">
        <h4>입력 소스</h4>
        <p className={`fit-tag ${synthesisContext ? 'fit-good' : 'fit-mid'}`}>
          {synthesisContext
            ? `합성 설계 저장본 사용 (${synthesisContext.mode})`
            : '합성 설계 저장본 없음: 기본 더미 비교 표시'}
        </p>
      </article>

      <div className="button-row">
        {FOCUS_METRICS.map((metric) => (
          <button
            key={metric}
            type="button"
            className={resultFocus === metric ? 'active' : ''}
            onClick={() => onResultFocusChange(metric)}
          >
            {metric}
          </button>
        ))}
      </div>

      <div className="card-grid three-col">
        {RESULT_CARDS.map((card) => (
          <article key={card.id} className="card">
            <h4>{card.title}</h4>

            {Object.entries(card.metrics).map(([key, value]) => (
              <div
                key={key}
                className={`metric-row ${resultFocus === key ? 'focused-metric' : ''}`}
              >
                <div className="metric-head">
                  <span>{key}</span>
                  <span>{metricToPercent(value)}</span>
                </div>
                <div className="metric-bar-bg">
                  <div
                    className="metric-bar"
                    style={{ width: `${metricToPercent(value)}%` }}
                  />
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

export default ResultsModule;
