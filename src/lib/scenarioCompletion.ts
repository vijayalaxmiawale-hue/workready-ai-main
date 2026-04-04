const STORAGE_KEY = "workready-completed-scenarios";

export function getCompletedScenarioIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isScenarioComplete(scenarioId: string): boolean {
  return getCompletedScenarioIds().includes(scenarioId);
}

export function markScenarioComplete(scenarioId: string): void {
  const ids = new Set(getCompletedScenarioIds());
  const wasNew = !ids.has(scenarioId);
  ids.add(scenarioId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  if (wasNew) {
    window.dispatchEvent(new CustomEvent("scenario-completion-changed"));
  }
}
