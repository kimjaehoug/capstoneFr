import { useMemo, useState } from 'react';
import { suggestPipelineFromDataset } from '../utils/pipelineSuggest';

const MODALITY_OPTIONS = ['테이블', '시계열', '텍스트·문서', '이미지', '로그·이벤트', '혼합', '기타'];

const DOMAIN_SEGMENT_LABELS = [
  ['domainIndustryContext', '산업·과제'],
  ['domainSubjectScope', '대상·단위·범위'],
  ['domainRegulationScope', '규제·민감도·제약'],
  ['domainStakeholderNotes', '이해관계자·기타'],
];

/** 목록/툴팁용 (구형 domainDescription·domainNotes·domainLabel 호환) */
function dataSourceDomainText(r) {
  const parts = [];
  for (const [key, label] of DOMAIN_SEGMENT_LABELS) {
    const v = r[key]?.trim();
    if (v) parts.push(`${label}: ${v}`);
  }
  if (parts.length) return parts.join('\n');
  const s = r.domainDescription?.trim();
  if (s) return s;
  const legacyNotes = r.domainNotes?.trim();
  if (legacyNotes) return legacyNotes;
  if (r.domainLabel) return r.domainLabel;
  return '';
}

function MainHubDataView({
  dataSources,
  templatePipelines,
  userPipelines,
  onAddDataSource,
  onDeleteDataSource,
  onConnectToPipeline,
  onCreatePipelineAndLinkData,
}) {
  /** 목록 | 추가 폼(기본·도메인·상세 한 화면) */
  const [dataFormView, setDataFormView] = useState('list');
  const [linkMode, setLinkMode] = useState('existing');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [rowsLabel, setRowsLabel] = useState('');
  const [linkedPipelineId, setLinkedPipelineId] = useState('');
  const [baseTemplateId, setBaseTemplateId] = useState('');
  const [pipelineTitle, setPipelineTitle] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [domainIndustryContext, setDomainIndustryContext] = useState('');
  const [domainSubjectScope, setDomainSubjectScope] = useState('');
  const [domainRegulationScope, setDomainRegulationScope] = useState('');
  const [domainStakeholderNotes, setDomainStakeholderNotes] = useState('');
  const [dataModality, setDataModality] = useState('');
  const [rowUnit, setRowUnit] = useState('');
  const [sensitivityNote, setSensitivityNote] = useState('');

  const pipelineOptions = useMemo(() => {
    const templates = templatePipelines.map((p) => ({ ...p, kind: 'template' }));
    const mine = userPipelines.map((p) => ({ ...p, kind: 'user' }));
    return [...templates, ...mine];
  }, [templatePipelines, userPipelines]);

  const firstPipelineId = pipelineOptions[0]?.id ?? '';
  const firstTemplateId = templatePipelines[0]?.id ?? '';

  const resolvePipelineTitle = (pipelineId) => {
    if (!pipelineId) return '—';
    const p = pipelineOptions.find((x) => x.id === pipelineId);
    return p ? p.title : '(삭제된 파이프라인)';
  };

  const selectedTemplateForSuggest = useMemo(
    () => templatePipelines.find((t) => t.id === (baseTemplateId || firstTemplateId)),
    [templatePipelines, baseTemplateId, firstTemplateId]
  );

  const resetFormFields = () => {
    setName('');
    setSource('');
    setRowsLabel('');
    setLinkedPipelineId(firstPipelineId);
    setBaseTemplateId(firstTemplateId);
    setPipelineTitle('');
    setPipelineDescription('');
    setDomainIndustryContext('');
    setDomainSubjectScope('');
    setDomainRegulationScope('');
    setDomainStakeholderNotes('');
    setDataModality('');
    setRowUnit('');
    setSensitivityNote('');
    setLinkMode('existing');
  };

  const openForm = () => {
    setDataFormView('form');
    if (firstPipelineId) setLinkedPipelineId(firstPipelineId);
    if (firstTemplateId) setBaseTemplateId(firstTemplateId);
  };

  const closeForm = () => {
    setDataFormView('list');
    resetFormFields();
  };

  const handleAiSuggest = () => {
    const dn = name.trim() || '데이터셋';
    const tpl = selectedTemplateForSuggest || templatePipelines[0];
    if (!tpl) return;
    const s = suggestPipelineFromDataset(dn, tpl);
    setPipelineTitle(s.title);
    setPipelineDescription(s.description);
  };

  const domainPayload = () => {
    const out = {};
    if (domainIndustryContext.trim()) out.domainIndustryContext = domainIndustryContext.trim();
    if (domainSubjectScope.trim()) out.domainSubjectScope = domainSubjectScope.trim();
    if (domainRegulationScope.trim()) out.domainRegulationScope = domainRegulationScope.trim();
    if (domainStakeholderNotes.trim()) out.domainStakeholderNotes = domainStakeholderNotes.trim();
    if (dataModality.trim()) out.dataModality = dataModality.trim();
    if (rowUnit.trim()) out.rowUnit = rowUnit.trim();
    if (sensitivityNote.trim()) out.sensitivityNote = sensitivityNote.trim();
    return out;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;

    const extra = domainPayload();

    if (linkMode === 'new') {
      const tid = baseTemplateId || firstTemplateId;
      if (!tid) return;
      onCreatePipelineAndLinkData({
        datasetName: n,
        source: source.trim() || '미지정',
        rowsLabel: rowsLabel.trim() || '-',
        templateId: tid,
        pipelineTitle,
        pipelineDescription,
        ...extra,
      });
    } else {
      const pid = (linkedPipelineId || firstPipelineId || '').trim() || null;
      if (!pid && pipelineOptions.length > 0) return;
      onAddDataSource({
        name: n,
        source: source.trim() || '미지정',
        rowsLabel: rowsLabel.trim() || '-',
        linkedPipelineId: pid,
        ...extra,
      });
    }

    closeForm();
  };

  const formBlock = (
    <form className="main-hub-add-form main-hub-add-form--detail" onSubmit={handleAddSubmit}>
      <div className="main-hub-add-stack">
        <div className="main-hub-link-mode" role="radiogroup" aria-label="데이터 연결 방식">
          <span className="main-hub-link-mode-label" id="main-hub-link-mode-heading">
            연결 방식
          </span>
          <div className="main-hub-segmented" aria-labelledby="main-hub-link-mode-heading">
            <label className={`main-hub-segment ${linkMode === 'existing' ? 'main-hub-segment--active' : ''}`}>
              <input
                type="radio"
                name="linkMode"
                className="main-hub-segment-input"
                checked={linkMode === 'existing'}
                onChange={() => setLinkMode('existing')}
              />
              <span className="main-hub-segment-title">기존 파이프라인</span>
              <span className="main-hub-segment-desc">이미 있는 흐름에 데이터만 연결</span>
            </label>
            <label className={`main-hub-segment ${linkMode === 'new' ? 'main-hub-segment--active' : ''}`}>
              <input
                type="radio"
                name="linkMode"
                className="main-hub-segment-input"
                checked={linkMode === 'new'}
                onChange={() => setLinkMode('new')}
              />
              <span className="main-hub-segment-title">새 파이프라인</span>
              <span className="main-hub-segment-desc">템플릿으로 새로 만들며 연결</span>
            </label>
          </div>
        </div>

        <div className="main-hub-add-grid">
          <label className="form-field">
            <span>데이터셋 이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: ICU 바이탈 스트림"
              required
            />
          </label>
          <label className="form-field">
            <span>출처</span>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="예: EMR · 시계열" />
          </label>
          <label className="form-field">
            <span>규모·비고</span>
            <input value={rowsLabel} onChange={(e) => setRowsLabel(e.target.value)} placeholder="예: 약 3만 행" />
          </label>

          <div className="form-field main-hub-domain-field main-hub-add-grid-span">
            <span>도메인 설명</span>
            <p className="main-hub-field-hint main-hub-field-hint--block">
              항목별로 짧게 나누어 적습니다. 비워 둘 수 있는 칸은 비워도 됩니다.
            </p>
            <div className="main-hub-domain-segments">
              <label className="main-hub-domain-segment">
                <span className="main-hub-domain-segment-label">산업·과제 맥락</span>
                <textarea
                  className="main-hub-domain-segment-input"
                  rows={3}
                  value={domainIndustryContext}
                  onChange={(e) => setDomainIndustryContext(e.target.value)}
                  placeholder="예: 의료 · 병원군 EMR, AML 탐지 업무 등"
                />
              </label>
              <label className="main-hub-domain-segment">
                <span className="main-hub-domain-segment-label">대상·단위·범위</span>
                <textarea
                  className="main-hub-domain-segment-input"
                  rows={3}
                  value={domainSubjectScope}
                  onChange={(e) => setDomainSubjectScope(e.target.value)}
                  placeholder="예: 행은 환자·방문 단위, 포함·제외 코호트, 알려진 결측"
                />
              </label>
              <label className="main-hub-domain-segment">
                <span className="main-hub-domain-segment-label">규제·민감도·제약</span>
                <textarea
                  className="main-hub-domain-segment-input"
                  rows={3}
                  value={domainRegulationScope}
                  onChange={(e) => setDomainRegulationScope(e.target.value)}
                  placeholder="예: PHI, 외부 반출 불가, 보존 기간"
                />
              </label>
              <label className="main-hub-domain-segment">
                <span className="main-hub-domain-segment-label">이해관계자·기타</span>
                <textarea
                  className="main-hub-domain-segment-input"
                  rows={2}
                  value={domainStakeholderNotes}
                  onChange={(e) => setDomainStakeholderNotes(e.target.value)}
                  placeholder="예: 데이터 오너, 승인 절차, 품질 이슈"
                />
              </label>
            </div>
          </div>

          <div className="main-hub-detail-domain main-hub-add-grid-span">
            <p className="main-hub-detail-domain-title">데이터 형태·규제 (선택, 짧게)</p>
            <div className="main-hub-detail-domain-grid">
              <label className="form-field">
                <span>데이터 형태</span>
                <select value={dataModality} onChange={(e) => setDataModality(e.target.value)}>
                  <option value="">선택…</option>
                  {MODALITY_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>행(레코드) 단위</span>
                <input
                  value={rowUnit}
                  onChange={(e) => setRowUnit(e.target.value)}
                  placeholder="예: 환자·방문, 거래 건, LOT 단위"
                />
              </label>
              <label className="form-field form-field-span2">
                <span>민감도·규제 한 줄 (선택)</span>
                <input
                  value={sensitivityNote}
                  onChange={(e) => setSensitivityNote(e.target.value)}
                  placeholder="예: PHI 포함, 내부망 전용"
                />
              </label>
            </div>
          </div>

          {linkMode === 'existing' ? (
            <label className="form-field">
              <span>연결 파이프라인</span>
              <select
                value={linkedPipelineId || firstPipelineId || ''}
                onChange={(e) => setLinkedPipelineId(e.target.value)}
                required={pipelineOptions.length > 0}
              >
                {pipelineOptions.length === 0 ? (
                  <option value="">파이프라인이 없습니다. 새로 만들기를 선택하세요.</option>
                ) : (
                  pipelineOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.kind === 'user' ? '· 내 파이프라인' : '· 템플릿'}
                    </option>
                  ))
                )}
              </select>
            </label>
          ) : (
            <>
              <label className="form-field">
                <span>베이스 템플릿</span>
                <select
                  value={baseTemplateId || firstTemplateId}
                  onChange={(e) => setBaseTemplateId(e.target.value)}
                  required
                >
                  {templatePipelines.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.domainLabel})
                    </option>
                  ))}
                </select>
              </label>
              <div className="main-hub-new-pipeline-sub">
                <p className="main-hub-new-pipeline-heading">새 파이프라인 이름·설명</p>
                <label className="form-field">
                  <span>이름 (비우면 자동 번호)</span>
                  <input
                    value={pipelineTitle}
                    onChange={(e) => setPipelineTitle(e.target.value)}
                    placeholder="예: 사망 케이스 보강 라인"
                  />
                </label>
                <label className="form-field">
                  <span>설명 (비우면 기본 문구)</span>
                  <textarea
                    rows={2}
                    value={pipelineDescription}
                    onChange={(e) => setPipelineDescription(e.target.value)}
                    placeholder="이 흐름으로 무엇을 할지 적습니다."
                  />
                </label>
                <div className="main-hub-ai-row">
                  <button type="button" className="btn-secondary-inline" onClick={handleAiSuggest}>
                    추천 받기
                  </button>
                  <span className="main-hub-ai-hint">
                    데이터셋 이름·템플릿을 기준으로 이름·설명 초안을 채웁니다.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="main-hub-add-actions">
        <button type="button" className="btn-secondary-inline" onClick={closeForm}>
          취소
        </button>
        <button
          type="submit"
          className="btn-primary-inline"
          disabled={
            !name.trim() ||
            (linkMode === 'existing' && pipelineOptions.length === 0) ||
            (linkMode === 'new' && !firstTemplateId)
          }
        >
          등록
        </button>
      </div>
    </form>
  );

  if (dataFormView === 'form') {
    return (
      <div className="main-hub-data">
        <div className="main-hub-data-form-screen">
          <div className="main-hub-data-form-nav">
            <button type="button" className="btn-ghost-back" onClick={closeForm}>
              <span className="btn-ghost-back-icon" aria-hidden>
                ←
              </span>
              목록으로
            </button>
            <div className="main-hub-data-form-titles">
              <h3 className="main-hub-data-form-title">데이터 추가</h3>
              <p className="main-hub-data-form-sub">
                도메인은 버튼이 아니라 글로 풀어 적습니다. 형태·규제는 아래에서 짧게만 적어도 됩니다.
              </p>
            </div>
          </div>
          {formBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="main-hub-data">
      <header className="main-hub-section-head">
        <h3 className="main-hub-section-title">데이터 조회/관리</h3>
        <p className="main-hub-section-desc">
          기존 파이프라인에 연결하거나, 템플릿을 골라 새 파이프라인을 만들면서 연결할 수 있습니다.           도메인은 의료/금융 같은 태그가 아니라, 맥락을 글로 적어 두는 것을 권장합니다.
        </p>
      </header>

      <div className="main-hub-toolbar">
        <button type="button" className="btn-primary-inline" onClick={openForm}>
          데이터 추가
        </button>
      </div>

      <div className="main-hub-table-wrap">
        <table className="main-hub-table">
          <thead>
            <tr>
              <th>데이터셋</th>
              <th>도메인 설명</th>
              <th>출처</th>
              <th>상태</th>
              <th>규모</th>
              <th>연결 파이프라인</th>
              <th className="main-hub-th-actions">관리</th>
            </tr>
          </thead>
          <tbody>
            {dataSources.length === 0 ? (
              <tr>
                <td colSpan={7} className="main-hub-table-empty">
                  등록된 데이터가 없습니다. 위에서 추가하세요.
                </td>
              </tr>
            ) : (
              dataSources.map((r) => {
                const domainFull = dataSourceDomainText(r);
                const domainPreview =
                  domainFull.length > 140 ? `${domainFull.slice(0, 140).trim()}…` : domainFull;
                return (
                <tr key={r.id}>
                  <td>
                    <span className="main-hub-ds-name">{r.name}</span>
                    {r.dataModality || r.rowUnit ? (
                      <span className="main-hub-ds-sub">
                        {[r.dataModality, r.rowUnit].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                  </td>
                  <td className="main-hub-domain-desc-cell" title={domainFull || undefined}>
                    {domainFull ? (
                      <span className="main-hub-domain-preview">{domainPreview}</span>
                    ) : (
                      '—'
                    )}
                    {r.sensitivityNote ? (
                      <span className="main-hub-domain-lock" title={r.sensitivityNote}>
                        {' '}
                        · 민감
                      </span>
                    ) : null}
                  </td>
                  <td>{r.source}</td>
                  <td>{r.updated}</td>
                  <td>{r.rows}</td>
                  <td className="main-hub-pipeline-title">{resolvePipelineTitle(r.linkedPipelineId)}</td>
                  <td className="main-hub-actions-cell">
                    <button
                      type="button"
                      className="btn-pipeline-link"
                      disabled={!r.linkedPipelineId}
                      title={r.linkedPipelineId ? '이 파이프라인 화면으로 이동' : '연결된 파이프라인이 없습니다'}
                      onClick={() => r.linkedPipelineId && onConnectToPipeline(r.linkedPipelineId)}
                    >
                      파이프라인 연결
                    </button>
                    <button
                      type="button"
                      className="btn-row-delete"
                      onClick={() => onDeleteDataSource(r.id)}
                      aria-label={`${r.name} 삭제`}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MainHubDataView;
