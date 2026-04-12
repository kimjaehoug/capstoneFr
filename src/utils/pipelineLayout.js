/** @param {string[]} moduleIds */
export function defaultLayoutFromIds(moduleIds) {
  const o = {};
  moduleIds.forEach((id, i) => {
    o[id] = {
      x: 140 + (i % 4) * 420,
      y: 120 + Math.floor(i / 4) * 300,
    };
  });
  return o;
}

/**
 * 저장된 레이아웃과 목록을 합치고, 없는 모듈은 격자로 채웁니다.
 * @param {string[]} moduleIds
 * @param {Record<string, { x: number; y: number }> | undefined} stored
 */
export function mergeModuleLayout(moduleIds, stored) {
  const prev = stored && typeof stored === 'object' ? { ...stored } : {};
  const out = {};
  moduleIds.forEach((id, i) => {
    const p = prev[id];
    if (p && typeof p.x === 'number' && typeof p.y === 'number') {
      out[id] = { x: p.x, y: p.y };
    } else {
      out[id] = {
        x: 140 + (i % 4) * 420,
        y: 120 + Math.floor(i / 4) * 300,
      };
    }
  });
  return out;
}
