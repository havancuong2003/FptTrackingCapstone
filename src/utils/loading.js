const listeners = new Set();
let loadingCount = 0;

export function getLoadingCount() {
  return loadingCount;
}

export function subscribeLoading(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) l(loadingCount);
}

export function startLoading() {
  loadingCount += 1;
  emit();
}

export function stopLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  emit();
} 