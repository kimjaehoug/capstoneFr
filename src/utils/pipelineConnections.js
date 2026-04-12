/** @param {number} moduleCount */
export function defaultConnectedAfter(moduleCount) {
  if (moduleCount <= 1) return [];
  return Array(moduleCount - 1).fill(true);
}

/**
 * @param {string[]} moduleIds
 * @param {boolean[] | undefined} connectedAfter
 */
export function normalizeConnectedAfter(moduleIds, connectedAfter) {
  const n = moduleIds.length;
  if (n <= 1) return [];
  const need = n - 1;
  if (!Array.isArray(connectedAfter) || connectedAfter.length !== need) {
    return Array(need).fill(true);
  }
  return connectedAfter.map((x) => Boolean(x));
}

function pairKey(a, b) {
  return `${a}|${b}`;
}

function pairSetFromConn(ids, conn) {
  const set = new Set();
  for (let i = 0; i < conn.length; i++) {
    if (conn[i]) set.add(pairKey(ids[i], ids[i + 1]));
  }
  return set;
}

/** @param {string[]} newIds */
function connFromPairs(newIds, pairSet) {
  const n = newIds.length;
  const out = Array(n - 1).fill(false);
  for (let i = 0; i < n - 1; i++) {
    if (pairSet.has(pairKey(newIds[i], newIds[i + 1]))) out[i] = true;
  }
  return out;
}

/**
 * 순서만 바뀐 뒤, 기존에 이어져 있던 모듈 쌍은 그대로 연결 유지
 * @param {string[]} oldIds
 * @param {boolean[]} oldConnNorm
 * @param {string[]} newIds
 */
export function reconnectAfterReorder(oldIds, oldConnNorm, newIds) {
  const pairSet = pairSetFromConn(oldIds, oldConnNorm);
  return connFromPairs(newIds, pairSet);
}

/**
 * 드래그 연결 후: 순서 변경 + (from→to) 연결을 true로
 * @param {string[]} oldIds
 * @param {boolean[]} oldConnNorm
 * @param {string[]} newIds
 * @param {string} fromId
 * @param {string} toId
 */
export function connectAfterReorder(oldIds, oldConnNorm, newIds, fromId, toId) {
  const pairSet = pairSetFromConn(oldIds, oldConnNorm);
  const newConn = connFromPairs(newIds, pairSet);
  const fi = newIds.indexOf(fromId);
  if (fi !== -1 && newIds[fi + 1] === toId) newConn[fi] = true;
  return newConn;
}

/**
 * @param {string[]} moduleIds
 * @param {boolean[] | undefined} connectedAfter
 * @param {string} moduleId
 */
export function mergeConnectionsAfterRemove(moduleIds, connectedAfter, moduleId) {
  const k = moduleIds.indexOf(moduleId);
  if (k === -1) {
    return {
      moduleIds,
      connectedAfter: normalizeConnectedAfter(moduleIds, connectedAfter),
    };
  }
  const n = moduleIds.length;
  const conn = normalizeConnectedAfter(moduleIds, connectedAfter);
  const newIds = moduleIds.filter((id) => id !== moduleId);
  if (newIds.length <= 1) return { moduleIds: newIds, connectedAfter: [] };
  if (k === 0) {
    return { moduleIds: newIds, connectedAfter: conn.slice(1) };
  }
  if (k === n - 1) {
    return { moduleIds: newIds, connectedAfter: conn.slice(0, -1) };
  }
  const newConn = [...conn.slice(0, k - 1), conn[k - 1] && conn[k], ...conn.slice(k + 1)];
  return { moduleIds: newIds, connectedAfter: newConn };
}
