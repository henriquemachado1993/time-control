// Construct dates in local time: stored YYYY-MM-DD values are calendar dates, not UTC instants.
export function localDate(key: string) {
  const [year, month, day] = key.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" });
}

