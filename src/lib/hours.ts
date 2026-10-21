export function formatHours(hours: number) {
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  return `${hours < 0 ? "−" : ""}${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}min`;
}

export function workedMinutes(start: string, end: string) {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  if (![startHours, startMinutes, endHours, endMinutes].every(Number.isFinite)) return 0;

  return Math.max(0, endHours * 60 + endMinutes - startHours * 60 - startMinutes);
}

export function workedHours(start: string, end: string) {
  return workedMinutes(start, end) / 60;
}

export function parseDailyTarget(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 1 || totalMinutes > 24 * 60) return null;
  if (hours === 24 && minutes !== 0) return null;

  return totalMinutes;
}

export function formatDailyTarget(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours}h` : `${hours}h ${String(remainder).padStart(2, "0")}min`;
}
