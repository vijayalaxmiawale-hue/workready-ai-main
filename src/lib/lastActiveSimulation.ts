const STORAGE_KEY = "workready-last-active-simulation-path";

/** Default when nothing has been opened yet (matches Dashboard “last mission” copy). */
export const DEFAULT_LAST_SIMULATION_PATH = "/simulation/salary";

export function getLastActiveSimulationPath(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw.startsWith("/")) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_LAST_SIMULATION_PATH;
}

export function setLastActiveSimulationPath(path: string): void {
  if (!path.startsWith("/")) return;
  try {
    localStorage.setItem(STORAGE_KEY, path);
    window.dispatchEvent(new CustomEvent("last-active-simulation-changed"));
  } catch {
    // ignore
  }
}
