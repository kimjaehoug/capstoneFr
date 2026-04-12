const FIELDS = [
  { key: 'industry', label: 'industry' },
  { key: 'subdomain', label: 'subdomain' },
  { key: 'data_modality', label: 'data_modality' },
  { key: 'row_unit', label: 'row_unit' },
  { key: 'ml_task', label: 'ml_task' },
  { key: 'target_event', label: 'target_event' },
  { key: 'include_scope', label: 'include_scope', multiline: true },
  { key: 'exclude_scope', label: 'exclude_scope', multiline: true },
];

function DomainModule({ domainForm, onDomainChange, onAutoDraftDomain }) {
  return (
    <div>
      <div className="section-header-row">
        <div>
          <h3 className="section-title">도메인 정의 폼</h3>
          <p className="section-note">
            탐색 및 정합성 검토의 기준이 되는 도메인 컨텍스트를 정의합니다.
          </p>
        </div>
        <button type="button" onClick={onAutoDraftDomain}>
          AI가 자동 초안 작성
        </button>
      </div>

      <article className="card compact">
        <p className="muted-note">
          저장 전에는 draft 상태입니다. 저장하면 외부 탐색 모듈의 쿼리 초안 입력으로
          연결됩니다.
        </p>
      </article>

      <div className="form-grid">
        {FIELDS.map((field) => (
          <label key={field.key} className="form-field">
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                rows={3}
                value={domainForm[field.key]}
                onChange={(event) => onDomainChange(field.key, event.target.value)}
              />
            ) : (
              <input
                type="text"
                value={domainForm[field.key]}
                onChange={(event) => onDomainChange(field.key, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default DomainModule;
