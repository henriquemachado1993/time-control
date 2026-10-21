export function formatHours(hours: number) {
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  return `${hours < 0 ? "−" : ""}${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}min`;
}

export function workedHours(start: string, end: string) {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  return Math.max(0, (endHours * 60 + endMinutes - startHours * 60 - startMinutes) / 60);
}
