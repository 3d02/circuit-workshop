// Learner progress, kept in this browser only.

const KEY = "cw-progress-v2";
const listeners = new Set();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return { done: s.done || {}, answers: s.answers || {} };
  } catch {}
  return { done: {}, answers: {} };
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  for (const fn of listeners) fn();
}

export const progress = {
  done: (id) => !!state.done[id],
  mark(id) {
    if (state.done[id]) return false;
    state.done[id] = Date.now();
    save();
    return true;
  },
  answer(id, choice, correct) {
    state.answers[id] = { choice, correct };
    state.done[id] ||= Date.now();
    save();
  },
  answerOf: (id) => state.answers[id],
  count: (ids) => ids.filter((id) => state.done[id]).length,
  reset() {
    state = { done: {}, answers: {} };
    save();
  },
  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
