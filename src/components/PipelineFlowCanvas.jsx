import { useCallback, useMemo, useRef, useState } from 'react';
import { mergeModuleLayout } from '../utils/pipelineLayout';
import { normalizeConnectedAfter } from '../utils/pipelineConnections';

const NODE_W = 280;
const NODE_H = 112;

function eventToContentCoords(e, scrollEl) {
  if (!scrollEl) return { x: 0, y: 0 };
  const r = scrollEl.getBoundingClientRect();
  return {
    x: e.clientX - r.left + scrollEl.scrollLeft,
    y: e.clientY - r.top + scrollEl.scrollTop,
  };
}

function computeBoardSize(moduleIds, layout) {
  let maxX = 1680;
  let maxY = 1100;
  moduleIds.forEach((id) => {
    const p = layout[id];
    if (p) {
      maxX = Math.max(maxX, p.x + NODE_W + 120);
      maxY = Math.max(maxY, p.y + NODE_H + 120);
    }
  });
  return { width: maxX, height: maxY };
}

function EdgesSvg({ moduleIds, connectedAfter, layout, width, height }) {
  const paths = [];
  for (let i = 0; i < moduleIds.length - 1; i++) {
    if (!connectedAfter[i]) continue;
    const a = moduleIds[i];
    const b = moduleIds[i + 1];
    const pa = layout[a];
    const pb = layout[b];
    if (!pa || !pb) continue;
    const x1 = pa.x + NODE_W;
    const y1 = pa.y + NODE_H / 2;
    const x2 = pb.x;
    const y2 = pb.y + NODE_H / 2;
    const cx1 = x1 + (x2 - x1) * 0.35;
    const cx2 = x1 + (x2 - x1) * 0.65;
    const d = `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
    paths.push(
      <path
        key={`${a}-${b}`}
        d={d}
        className="pipeline-canvas-edge"
        fill="none"
        markerEnd="url(#pipeline-arrow)"
      />
    );
  }
  return (
    <svg className="pipeline-canvas-svg" width={width} height={height} aria-hidden>
      <defs>
        <marker
          id="pipeline-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L8,4 L0,8 z" className="pipeline-canvas-arrowhead" />
        </marker>
      </defs>
      {paths}
    </svg>
  );
}

function LinkDragPreview({ layout, fromId, end, width, height }) {
  const p = layout[fromId];
  if (!p || !end) return null;
  const x1 = p.x + NODE_W;
  const y1 = p.y + NODE_H / 2;
  const d = `M ${x1} ${y1} L ${end.x} ${end.y}`;
  return (
    <svg className="pipeline-canvas-link-layer" width={width} height={height} aria-hidden>
      <path d={d} className="pipeline-canvas-link-preview" fill="none" />
    </svg>
  );
}

function PipelineFlowCanvas({
  steps,
  moduleIdsOrdered,
  connectedAfter: connectedAfterProp,
  moduleLayout,
  moduleStatus,
  moduleMemory: _moduleMemory,
  formatSavedTime: _formatSavedTime,
  editable,
  pipelineId,
  onOpenModule,
  onRemoveModule,
  onMoveModule: _onMoveModule,
  onDisconnectAfter,
  onModulePositionChange,
  onConnectModuleAfter,
}) {
  const scrollRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [linkDragFromId, setLinkDragFromId] = useState(null);
  const [linkDragEnd, setLinkDragEnd] = useState(null);

  const layout = useMemo(
    () => mergeModuleLayout(moduleIdsOrdered, moduleLayout),
    [moduleIdsOrdered, moduleLayout]
  );

  const connectedAfter = useMemo(
    () => normalizeConnectedAfter(moduleIdsOrdered, connectedAfterProp),
    [moduleIdsOrdered, connectedAfterProp]
  );

  const boardSize = useMemo(
    () => computeBoardSize(moduleIdsOrdered, layout),
    [moduleIdsOrdered, layout]
  );

  const startDrag = useCallback(
    (e, moduleId) => {
      if (!editable || !onModulePositionChange || !pipelineId) return;
      e.preventDefault();
      e.stopPropagation();
      const scrollEl = scrollRef.current;
      const start = eventToContentCoords(e, scrollEl);
      const orig = layout[moduleId];
      if (!orig) return;
      const grab = { x: start.x - orig.x, y: start.y - orig.y };
      setDraggingId(moduleId);

      const move = (ev) => {
        const p = eventToContentCoords(ev, scrollEl);
        const x = Math.round(p.x - grab.x);
        const y = Math.round(p.y - grab.y);
        onModulePositionChange(pipelineId, moduleId, { x, y });
      };
      const up = () => {
        setDraggingId(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [editable, layout, onModulePositionChange, pipelineId]
  );

  const startLinkDrag = useCallback(
    (e, fromId) => {
      if (!editable || !onConnectModuleAfter) return;
      e.preventDefault();
      e.stopPropagation();
      const scrollEl = scrollRef.current;
      setLinkDragFromId(fromId);

      const move = (ev) => {
        setLinkDragEnd(eventToContentCoords(ev, scrollEl));
      };
      const up = (ev) => {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const pin = el?.closest?.('[data-pipeline-port-in]');
        const toId = pin?.getAttribute?.('data-module-id');
        if (fromId && toId && toId !== fromId) {
          onConnectModuleAfter(fromId, toId);
        }
        setLinkDragFromId(null);
        setLinkDragEnd(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      move(e);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [editable, onConnectModuleAfter]
  );

  const indexById = useMemo(() => {
    const m = {};
    moduleIdsOrdered.forEach((id, i) => {
      m[id] = i;
    });
    return m;
  }, [moduleIdsOrdered]);

  if (steps.length === 0) {
    return (
      <div className="pipeline-flow pipeline-flow--empty">
        <p className="pipeline-flow-empty-msg">이 파이프라인에 연결된 모듈이 없습니다.</p>
        {editable ? (
          <p className="pipeline-flow-empty-hint muted-note">왼쪽 사이드바에서 모듈을 추가할 수 있습니다.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`pipeline-flow pipeline-flow--canvas ${draggingId || linkDragFromId ? 'pipeline-flow--dragging' : ''}`}
    >
      <div className="pipeline-flow-toolbar pipeline-flow-toolbar--canvas">
        <span className="pipeline-flow-toolbar-label">처리 흐름 · 자유 배치</span>
        <span className="pipeline-flow-toolbar-hint">
          {editable
            ? '막대: 위치 이동 · 오른쪽 주황 점에서 드래그해 다른 모듈 왼쪽 파란 점에 연결합니다. 끊기는 다음 단계와의 연결만 끊고 모듈은 남깁니다.'
            : '카드 더블클릭으로 모듈을 열 수 있습니다.'}
        </span>
      </div>

      <div ref={scrollRef} className="pipeline-canvas-scroll">
        <div
          className="pipeline-canvas-board"
          style={{
            width: boardSize.width,
            height: boardSize.height,
            minWidth: boardSize.width,
            minHeight: boardSize.height,
          }}
        >
          <EdgesSvg
            moduleIds={moduleIdsOrdered}
            connectedAfter={connectedAfter}
            layout={layout}
            width={boardSize.width}
            height={boardSize.height}
          />
          {linkDragFromId && linkDragEnd ? (
            <LinkDragPreview
              layout={layout}
              fromId={linkDragFromId}
              end={linkDragEnd}
              width={boardSize.width}
              height={boardSize.height}
            />
          ) : null}

          {steps.map((module) => {
            const i = indexById[module.id];
            const pos = layout[module.id] || { x: 0, y: 0 };
            const hasLinkedNext = i < moduleIdsOrdered.length - 1 && connectedAfter[i];
            return (
              <article
                key={module.id}
                className={`pipeline-flow-node pipeline-flow-node--free ${draggingId === module.id ? 'pipeline-flow-node--dragging' : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  minHeight: NODE_H,
                }}
              >
                {editable && onConnectModuleAfter ? (
                  <span
                    className="pipeline-port pipeline-port-in"
                    data-pipeline-port-in=""
                    data-module-id={module.id}
                    title="여기에 연결"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                ) : null}
                {editable && onConnectModuleAfter ? (
                  <span
                    role="button"
                    tabIndex={0}
                    className="pipeline-port pipeline-port-out"
                    data-pipeline-port-out=""
                    data-module-id={module.id}
                    onPointerDown={(e) => startLinkDrag(e, module.id)}
                    title="드래그하여 다른 모듈 입력에 연결"
                  />
                ) : null}
                <div
                  className="pipeline-flow-node-drag"
                  onPointerDown={(e) => startDrag(e, module.id)}
                  title={editable ? '드래그하여 위치 이동' : undefined}
                >
                  <span className="pipeline-flow-node-grip" aria-hidden>
                    ⋮⋮
                  </span>
                  <span className="pipeline-flow-node-index">{i + 1}</span>
                </div>
                <div
                  className="pipeline-flow-node-body"
                  onDoubleClick={() => onOpenModule(module.id)}
                  title="더블클릭하여 열기"
                >
                  <div className="pipeline-flow-node-head">
                    <h4 className="pipeline-flow-node-title">{module.label}</h4>
                    <span className={`status-pill mini ${moduleStatus[module.id]?.state || 'draft'}`}>
                      {moduleStatus[module.id]?.label || '미저장'}
                    </span>
                  </div>
                  {editable ? (
                    <div className="pipeline-flow-node-actions">
                      {hasLinkedNext ? (
                        <button
                          type="button"
                          className="pipeline-flow-chip pipeline-flow-chip--warn"
                          title="다음 단계와의 연결만 끊기 (모듈은 파이프라인에 유지)"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDisconnectAfter(i);
                          }}
                        >
                          끊기
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="pipeline-flow-chip pipeline-flow-chip--danger"
                        disabled={steps.length <= 1}
                        title="파이프라인에서 제거"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveModule(module.id);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PipelineFlowCanvas;
