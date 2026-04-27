import { useMemo, useState } from 'react';

const PROMPT_CHIPS = [
  '도메인 자동 작성해줘',
  '합성은 제외하고 탐색만',
  '임상시험 데이터 기준으로 좁혀줘',
  '양성 클래스만 보완해줘',
];

function formatSavedTime(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleTimeString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChatPanel({
  messages,
  onSendMessage,
  onUsePrompt,
  modules,
  moduleStatus,
  moduleMemory,
  collapsed,
  onToggleCollapsed,
}) {
  const [input, setInput] = useState('');

  const savedModules = useMemo(() => {
    return modules
      .filter((m) => m.id !== 'workflow' && moduleMemory[m.id]?.savedAt)
      .map((m) => ({
        ...m,
        savedAt: moduleMemory[m.id].savedAt,
        summary: moduleMemory[m.id].summary,
      }))
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }, [modules, moduleMemory]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSendMessage(input);
    setInput('');
  };

  return (
    <aside className={`chat-panel panel${collapsed ? ' chat-panel--collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-collapse-btn chat-collapse-btn"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'AI 보조 지시 패널 펼치기' : 'AI 보조 지시 패널 접기'}
        title={collapsed ? '펼치기' : '접기'}
      >
        {collapsed ? '«' : '»'}
      </button>

      {collapsed ? (
        <div className="chat-collapsed-label" aria-hidden>
          AI 보조 지시
        </div>
      ) : (
        <>
          <div className="chat-system-note">
            <h3>AI 보조 지시 패널</h3>
            <p>예외 조건 수정, 보조 요청, 범위 조정을 입력하세요.</p>
          </div>

          <div className="chip-list">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chip-button"
                onClick={() => onUsePrompt(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="chat-context">
            <h4>Pipeline Memory</h4>
            {savedModules.length === 0 ? (
              <p className="chat-context-empty">
                저장된 모듈이 없습니다. 작업 중인 모듈을 저장하면 여기에 표시됩니다.
              </p>
            ) : (
              <div className="context-list">
                {savedModules.map((module) => (
                  <div key={module.id} className="context-item">
                    <div className="context-item-main">
                      <span className="context-item-label">{module.label}</span>
                      <span className={`status-pill mini ${moduleStatus[module.id]?.state || 'draft'}`}>
                        {moduleStatus[module.id]?.label || '미저장'}
                      </span>
                    </div>
                    {module.summary ? (
                      <span className="context-item-summary">{module.summary}</span>
                    ) : null}
                    <span className="context-item-time">{formatSavedTime(module.savedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <span className="chat-role">{message.role}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="보조 지시를 입력하세요"
            />
            <button type="submit">전송</button>
          </form>
        </>
      )}
    </aside>
  );
}

export default ChatPanel;
