import { useEffect, useMemo, useRef, useState } from 'react';
import './ChatPanel.css';

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
  collapsed,
  onToggleCollapsed,
}) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('ai'); 
  const messagesRef = useRef(null);

  const aiMessages = useMemo(() => 
    messages.filter(m => m.role === 'user' || m.role === 'assistant'), 
    [messages]
  );
  
  const systemMessages = useMemo(() => 
    messages.filter(m => m.role === 'system'), 
    [messages]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => {
    if (!messagesRef.current || collapsed) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, collapsed, activeTab]);

  return (
    <aside className={`chat-panel panel${collapsed ? ' chat-panel--collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-collapse-btn chat-collapse-btn"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'AI 보조 지시 패널 펼치기' : 'AI 보조 지시 패널 접기'}
      >
        {collapsed ? '«' : '»'}
      </button>

      {collapsed ? (
        <div className="chat-collapsed-label">AI 보조 지시</div>
      ) : (
        <>
          <div className="chat-tab-toggle">
            <button
              type="button"
              className={`chat-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              AI 보조 지시
            </button>
            <button
              type="button"
              className={`chat-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              시스템 로그
            </button>
          </div>

          <div className="chat-tab-content">
  {activeTab === 'ai' && (
    <div className="ai-view">
      <div className="chat-system-note">
        <h3>AI 보조 지시 패널</h3>
        <p>예외 조건 수정, 보조 요청, 범위 조정을 입력하세요.</p>
      </div>
      <div className="chip-list">
        {PROMPT_CHIPS.map((chip) => (
          <button key={chip} type="button" className="chip-button" onClick={() => onUsePrompt(chip)}>
            {chip}
          </button>
        ))}
      </div>

      <div className="chat-messages ai-messages-scroll" ref={messagesRef}>
        <div className="ai-chat-flow">
          {aiMessages.map((msg, index) => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.role} ${index === aiMessages.length - 1 ? 'latest-message' : ''}`}
            >
              <span className="chat-role">{msg.role === 'user' ? 'user' : 'assistant'}</span>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {activeTab === 'chat' && (
    <div className="chat-log-section">
      <div className="chat-messages" ref={messagesRef}>
        {systemMessages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`chat-message system ${index === systemMessages.length - 1 ? 'latest-message' : ''}`}
          >
            <span className="chat-role">system</span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  )}

  {activeTab === 'ai' && (
    <form className="chat-input-row" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="지시를 입력하세요."
      />
      <button type="submit">전송</button>
    </form>
    )}
  </div>
</>
)}
</aside>
);
}

export default ChatPanel;