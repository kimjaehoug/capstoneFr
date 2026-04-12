const MODE_OPTIONS = [
  {
    id: 'minority_only',
    label: 'minority class only',
    description: '소수 클래스 표본만 집중 보완',
  },
  {
    id: 'subgroup_targeted',
    label: 'subgroup targeted',
    description: '취약 하위집단 중심 보완',
  },
  {
    id: 'balanced_augmentation',
    label: 'balanced augmentation',
    description: '전반적 균형을 맞추는 보완',
  },
];

const CONSTRAINT_FIELDS = [
  { key: 'preserveLabelSemantics', label: 'preserve label semantics' },
  { key: 'preserveFeatureRanges', label: 'preserve feature ranges' },
  { key: 'excludeUnrealisticSamples', label: 'exclude unrealistic samples' },
];

function SynthesisModule({
  synthesisOptions,
  matchingContext,
  onSetMode,
  onToggleConstraint,
  onRun,
}) {
  return (
    <div>
      <h3 className="section-title">합성데이터 설계</h3>
      <p className="section-note">
        합성 실행은 더미 상태 메시지만 갱신합니다. 실제 생성 로직은 없습니다.
      </p>

      <article className="card compact">
        <h4>입력 소스</h4>
        <p className={`fit-tag ${matchingContext ? 'fit-good' : 'fit-mid'}`}>
          {matchingContext
            ? `정합성 저장본 사용 (${matchingContext.finalFit || '부분 적합'})`
            : '정합성 저장본 없음: 현재 설정만으로 진행'}
        </p>
      </article>

      <div className="card-grid three-col">
        {MODE_OPTIONS.map((option) => (
          <article
            key={option.id}
            className={`card compact ${
              synthesisOptions.mode === option.id ? 'selected' : ''
            }`}
          >
            <h4>{option.label}</h4>
            <p>{option.description}</p>
            <button type="button" onClick={() => onSetMode(option.id)}>
              선택
            </button>
          </article>
        ))}
      </div>

      <article className="card">
        <h4>제약조건</h4>
        <div className="checkbox-column">
          {CONSTRAINT_FIELDS.map((item) => (
            <label key={item.key} className="checkbox-row">
              <input
                type="checkbox"
                checked={synthesisOptions.constraints[item.key]}
                onChange={() => onToggleConstraint(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </article>

      <div className="button-row">
        <button type="button" onClick={onRun}>
          합성 실행
        </button>
      </div>

      {synthesisOptions.statusMessage && (
        <article className="card compact">
          <h4>상태 메시지</h4>
          <p>{synthesisOptions.statusMessage}</p>
        </article>
      )}
    </div>
  );
}

export default SynthesisModule;
