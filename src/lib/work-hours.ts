export type WorkInterval = {
  id: string;
  start_time: string;
  end_time: string;
};

export function isValidWorkDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidWorkTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateWorkInterval(date: unknown, start: unknown, end: unknown) {
  if (!isValidWorkDate(date)) return "Informe uma data válida.";
  if (!isValidWorkTime(start) || !isValidWorkTime(end)) {
    return "Informe horários válidos para entrada e saída.";
  }
  if (end <= start) return "A saída deve ser posterior à entrada no mesmo dia.";
  return null;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function findOverlappingWorkIntervals(
  intervals: WorkInterval[],
  start: string,
  end: string,
  excludedId?: string,
) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return intervals.filter((interval) => {
    if (interval.id === excludedId) return false;

    const existingStart = timeToMinutes(interval.start_time);
    const existingEnd = timeToMinutes(interval.end_time);
    return startMinutes < existingEnd && endMinutes > existingStart;
  });
}
