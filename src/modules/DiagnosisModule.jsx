const STATUS_OPTIONS = [
  { id: 'imbalance_high', label: '불균형 가능성 높음' },
  { id: 'suspected', label: '의심' },
  { id: 'healthy', label: '현재 양호' },
];

const SUMMARY_CARDS = [
  { label: '샘플 수', value: '18,240' },
  { label: '클래스 분포', value: '양성 7.8% / 음성 92.2%' },
  { label: '결측치 비율', value: '3.4%' },
  { label: '불균형 의심 여부', value: 'High' },
];

function DiagnosisModule({ diagnosisResult, onDiagnosisChange, onMoveModule }) {
  const activeStatus =
    STATUS_OPTIONS.find((option) => option.id === diagnosisResult) ||
    STATUS_OPTIONS[0];

  return (
    <div>
      <h3 className="section-title">데이터 진단 요약</h3>
      <p className="section-note">업로드된 데이터가 있다고 가정한 더미 진단 화면입니다.</p>

      <div className="card-grid four-col">
        {SUMMARY_CARDS.map((item) => (
          <article key={item.label} className="card compact">
            <h4>{item.label}</h4>
            <p className="value">{item.value}</p>
          </article>
        ))}
      </div>

      <article className="card">
        <h4>진단 결과</h4>
        <p className="status-badge">{activeStatus.label}</p>
        <p className="muted-note">
          진단 결과를 저장하면 이후 모듈에서 기준 컨텍스트로 참조됩니다.
        </p>

        <div className="button-row">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={diagnosisResult === option.id ? 'active' : ''}
              onClick={() => onDiagnosisChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </article>

      <div className="button-row">
        <button type="button" onClick={() => onMoveModule('domain')}>
          도메인 정의 열기
        </button>
        <button type="button" onClick={() => onMoveModule('search')}>
          외부 탐색 추천 보기
        </button>
        <button type="button" onClick={() => onMoveModule('results')}>
          원본 데이터로 진행
        </button>
      </div>
    </div>
  );
}

export default DiagnosisModule;
