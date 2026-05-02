import { useState, useMemo, useEffect } from 'react';
import PipelineHub from '../../modules/PipelineHub';

function SharedHubPage({
  templatePipelines,
  modules,
  moduleStatus,
  moduleMemory,
  activePipelineId,
  onSelectPipeline,
  onClearPipeline,
  onStartModule,
  onCopyTemplateToUser,
  onDuplicateUserPipeline,
  onDeleteUserPipeline,
  onUpdateUserPipeline,
  onMoveModuleInUserPipeline,
  onRemoveModuleFromUserPipeline,
  onSetUserPipelineModulePosition,
  onConnectModuleAfterInUserPipeline,
  onDisconnectEdgeAfterInUserPipeline,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    setVisibleCount(4);
  }, [searchQuery]);

  const filteredPipelines = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return templatePipelines;

  return templatePipelines.filter((p) => 
    p.title.toLowerCase().includes(query) || 
    p.description?.toLowerCase().includes(query)
  );
}, [templatePipelines, searchQuery]);

const visiblePipelines = useMemo(() => {
  return filteredPipelines.slice(0, visibleCount);
}, [filteredPipelines, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="hub-page">
      <header className="hub-hero">
        <p className="hub-eyebrow">Share Hub</p>
        <h3 className="hub-hero-title">공유 파이프라인 조회</h3>
        <p className="hub-hero-lead">
          공유 파이프라인을 탐색하거나, 내 파이프라인으로 복사할 수 있습니다.<br></br>검증된 데이터 파이프라인 템플릿을 작업에 바로 활용해 보세요.
        </p>
      </header>

      <section className="hub-controls">
        <div className="hub-search-bar">
          <svg className="search-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="파이프라인 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      <div className="hub-content-scroll-area">
        <PipelineHub
          templatePipelines={visiblePipelines}
          totalCount={filteredPipelines.length}
          userPipelines={[]}
          modules={modules}
          moduleStatus={moduleStatus}
          moduleMemory={moduleMemory}
          activePipelineId={activePipelineId}
          onSelectPipeline={onSelectPipeline}
          onClearPipeline={onClearPipeline}
          onStartModule={onStartModule}
          onCopyTemplateToUser={onCopyTemplateToUser}
          onDuplicateUserPipeline={onDuplicateUserPipeline}
          onDeleteUserPipeline={onDeleteUserPipeline}
          onUpdateUserPipeline={onUpdateUserPipeline}
          onMoveModuleInUserPipeline={onMoveModuleInUserPipeline}
          onRemoveModuleFromUserPipeline={onRemoveModuleFromUserPipeline}
          onSetUserPipelineModulePosition={onSetUserPipelineModulePosition}
          onConnectModuleAfterInUserPipeline={onConnectModuleAfterInUserPipeline}
          onDisconnectEdgeAfterInUserPipeline={onDisconnectEdgeAfterInUserPipeline}
          userPipelinesAuthRequired={false}
          userPipelinesAuthMessage=""
        />
      </div>

      {visibleCount < filteredPipelines.length && (
        <div className="hub-load-more">
          <button type="button" className="btn-load-more" onClick={handleLoadMore}>
            더보기
          </button>
        </div>
      )}
    </div>
  );
}

export default SharedHubPage;