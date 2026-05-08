export function isLocked(kickoff_utc: string): boolean {
  return new Date(kickoff_utc).getTime() <= Date.now();
}
