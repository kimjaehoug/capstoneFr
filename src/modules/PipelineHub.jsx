import { useEffect, useState } from 'react';
import PipelineTimelineColumns from '../components/pipeline/PipelineTimelineColumns';

function PipelineHub({
  templatePipelines,
  userPipelines,
  modules,
  moduleStatus,
  moduleMemory: _moduleMemory,
  activePipelineId,
  onSelectPipeline,
  onClearPipeline,
  onStartModule,
  onCopyTemplateToUser,
  onDuplicateUserPipeline,
  onDeleteUserPipeline,
  onUpdateUserPipeline,
  onMoveModuleInUserPipeline: _onMoveModuleInUserPipeline,
  onRemoveModuleFromUserPipeline,
  onSetUserPipelineModulePosition: _onSetUserPipelineModulePosition,
  onConnectModuleAfterInUserPipeline: _onConnectModuleAfterInUserPipeline,
  onDisconnectEdgeAfterInUserPipeline: _onDisconnectEdgeAfterInUserPipeline,
  userPipelinesAuthRequired,
  userPipelinesAuthMessage,
}) {
  const allPipelines = [...templatePipelines, ...userPipelines];
  const active = allPipelines.find((p) => p.id === activePipelineId);
  const activeIsUser = Boolean(active && userPipelines.some((p) => p.id === active?.id));

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [detailMetaEditing, setDetailMetaEditing] = useState(false);
  const [listEditId, setListEditId] = useState(null);
  const [listEditTitle, setListEditTitle] = useState('');
  const [listEditDesc, setListEditDesc] = useState('');

  useEffect(() => {
    if (active && activeIsUser) {
      setEditTitle(active.title);
      setEditDesc(active.description);
    }
  }, [active?.id, active?.title, active?.description, activeIsUser]);

  useEffect(() => {
    setDetailMetaEditing(false);
  }, [active?.id]);

  useEffect(() => {
    if (listEditId) {
      const p = userPipelines.find((x) => x.id === listEditId);
      if (p) {
        setListEditTitle(p.title);
        setListEditDesc(p.description);
      }
    }
  }, [listEditId, userPipelines]);

  if (active) {
    return (
      <div className="pipeline-detail">
        <div className="pipeline-hub-toolbar">
          <div className="pipeline-toolbar-pills">
            <span className="domain-pill">{active.domainLabel}</span>
            {activeIsUser ? (
              <span className="domain-pill domain-pill-user">내 파이프라인</span>
            ) : null}
            {activeIsUser && active.autoNamed ? (
              <span
                className="domain-pill domain-pill-auto"
                title="자동으로 붙은 이름입니다. 제목 옆 수정을 눌러 바꿀 수 있습니다."
              >
                자동 이름
              </span>
            ) : null}
          </div>
        </div>

        {activeIsUser && onUpdateUserPipeline ? (
          detailMetaEditing ? (
            <div className="pipeline-user-meta-edit">
              <h4 className="pipeline-meta-edit-title">이름·설명 수정</h4>
              <label className="form-field">
                <span>파이프라인 이름</span>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </label>
              <label className="form-field">
                <span>설명</span>
                <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </label>
              <div className="pipeline-meta-edit-actions">
                <button
                  type="button"
                  className="btn-primary-inline"
                  onClick={() => {
                    onUpdateUserPipeline(active.id, {
                      title: editTitle,
                      description: editDesc,
                      clearAutoNamed: true,
                    });
                    setDetailMetaEditing(false);
                  }}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="btn-secondary-inline"
                  onClick={() => {
                    setEditTitle(active.title);
                    setEditDesc(active.description);
                    setDetailMetaEditing(false);
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="pipeline-detail-readonly">
              <div className="pipeline-detail-readonly-head">
                <h3 className="section-title pipeline-detail-title">{active.title}</h3>
                <button
                  type="button"
                  className="pipeline-detail-edit-trigger"
                  onClick={() => setDetailMetaEditing(true)}
                >
                  수정
                </button>
              </div>
              <p className="section-note pipeline-detail-desc">{active.description}</p>
            </div>
          )
        ) : (
          <>
            <h3 className="section-title pipeline-detail-title">{active.title}</h3>
            <p className="section-note pipeline-detail-desc">{active.description}</p>
            {onCopyTemplateToUser ? (
              <div className="pipeline-detail-template-actions">
                <button
                  type="button"
                  className="btn-secondary-inline"
                  onClick={() => onCopyTemplateToUser(active.id)}
                >
                  내 파이프라인으로 복사
                </button>
              </div>
            ) : null}
          </>
        )}

        {active.highlight ? (
          <p className="pipeline-highlight">
            <span className="pipeline-highlight-label">요약</span>
            {active.highlight}
          </p>
        ) : null}

        <PipelineTimelineColumns
          pipelineKey={activeIsUser ? active.id : `tpl:${active.id}`}
          editable={activeIsUser}
          pipelineModuleIds={active.moduleIds}
          modules={modules}
          moduleStatus={moduleStatus}
          onOpenModule={onStartModule}
        />
      </div>
    );
  }

  return (
    <div className="hub-page">
      <header className="hub-hero">
        <p className="hub-eyebrow">Pipeline</p>
        <h3 className="hub-hero-title">파이프라인 조회/관리</h3>
        <p className="hub-hero-lead">
          도메인별 데이터 파이프라인을 열고, 템플릿을 내 파이프라인으로 복사해 구성을 시작합니다. 연 뒤에는 고정된
          6단계 가로 타임라인에서 단계별 부가 기능 후보를 고를 수 있습니다.
        </p>
      </header>

      {templatePipelines && templatePipelines.length > 0 && (
        <section className="hub-section" aria-labelledby="hub-templates-heading">
          <div className="hub-section-head">
            <h4 id="hub-templates-heading" className="hub-section-title">
              공유 템플릿
            </h4>
            <span className="hub-section-meta">{templatePipelines.length}개</span>
          </div>
          <div className="card-grid pipeline-catalog">
            {templatePipelines.map((pipeline) => (
              <article
                key={pipeline.id}
                className="card workflow-card pipeline-card pipeline-card--template"
              >
                <div className="workflow-card-head">
                  <h4>{pipeline.title}</h4>
                  <span className="domain-pill subtle">{pipeline.domainLabel}</span>
                </div>
                <p>{pipeline.description}</p>
                <p className="muted-note pipeline-module-count">포함 모듈 {pipeline.moduleIds.length}개</p>
                <div className="pipeline-card-actions">
                  <button type="button" className="btn-primary-inline" onClick={() => onSelectPipeline(pipeline.id)}>
                    파이프라인 열기
                  </button>
                  <button type="button" className="btn-secondary-inline" onClick={() => onCopyTemplateToUser(pipeline.id)}>
                    내 파이프라인으로 복사
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(userPipelines.length > 0 || templatePipelines.length === 0) && (
        <section className="hub-section hub-section--mine" aria-labelledby="hub-mine-heading">
          <div className="hub-section-head">
            <h4 id="hub-mine-heading" className="hub-section-title">
              내 파이프라인
            </h4>
            <span className="hub-section-meta">{userPipelines.length}개</span>
          </div>
          {userPipelines.length === 0 ? (
            <div className="hub-empty">
              <p className="hub-empty-text">
                {userPipelinesAuthRequired
                  ? userPipelinesAuthMessage || '로그인 후 조회 가능합니다.'
                  : "아직 없습니다. '공유 템플릿' 메뉴에서 복사하거나, 데이터 조회/관리에서 새로 만들 수 있습니다."}
              </p>
            </div>
          ) : (
            <div className="card-grid pipeline-catalog">
              {userPipelines.map((pipeline) => (
                <article
                  key={pipeline.id}
                  className="card workflow-card pipeline-card pipeline-card--user"
                >
                  {listEditId === pipeline.id && onUpdateUserPipeline ? (
                    <div className="pipeline-list-edit">
                      <label className="form-field">
                        <span>이름</span>
                        <input value={listEditTitle} onChange={(e) => setListEditTitle(e.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>설명</span>
                        <textarea rows={2} value={listEditDesc} onChange={(e) => setListEditDesc(e.target.value)} />
                      </label>
                      <div className="pipeline-list-edit-actions">
                        <button
                          type="button"
                          className="btn-primary-inline"
                          onClick={() => {
                            onUpdateUserPipeline(pipeline.id, {
                              title: listEditTitle,
                              description: listEditDesc,
                              clearAutoNamed: true,
                            });
                            setListEditId(null);
                          }}
                        >
                          저장
                        </button>
                        <button type="button" className="btn-secondary-inline" onClick={() => setListEditId(null)}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="workflow-card-head">
                        <h4>{pipeline.title}</h4>
                        <span className="domain-pill subtle">{pipeline.domainLabel}</span>
                      </div>
                      {pipeline.autoNamed ? (
                        <p className="pipeline-auto-named-hint">이름이 자동으로 붙었습니다. 수정에서 바꿀 수 있습니다.</p>
                      ) : null}
                      <p>{pipeline.description}</p>
                      <p className="muted-note pipeline-module-count">포함 모듈 {pipeline.moduleIds.length}개</p>
                    </>
                  )}
                  <div className="pipeline-card-actions pipeline-card-actions--user">
                    <div className="pipeline-card-actions-primary">
                      <button type="button" className="btn-primary-inline" onClick={() => onSelectPipeline(pipeline.id)}>
                        파이프라인 열기
                      </button>
                      {onUpdateUserPipeline && listEditId !== pipeline.id ? (
                        <button type="button" className="btn-secondary-inline" onClick={() => setListEditId(pipeline.id)}>
                          수정
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn-secondary-inline"
                        onClick={() => onDuplicateUserPipeline(pipeline.id)}
                      >
                        복사
                      </button>
                    </div>
                    <button type="button" className="btn-danger-inline" onClick={() => onDeleteUserPipeline(pipeline.id)}>
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {active && (
      <PipelineTimelineColumns
        pipelineKey={activeIsUser ? active.id : `tpl:${active.id}`}
        editable={activeIsUser}
        pipelineModuleIds={active.moduleIds}
        modules={modules}
        moduleStatus={moduleStatus}
        onOpenModule={onStartModule}
        onMoveModule={_onMoveModuleInUserPipeline}
        onRemoveModule={onRemoveModuleFromUserPipeline}
        onSetModulePosition={_onSetUserPipelineModulePosition}
        onConnectAfter={_onConnectModuleAfterInUserPipeline}
        onDisconnectAfter={_onDisconnectEdgeAfterInUserPipeline}
      />
    )}
  </div>
);
}

export default PipelineHub;
