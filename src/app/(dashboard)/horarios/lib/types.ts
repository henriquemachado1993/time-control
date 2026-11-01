export type WorkHour = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  description?: string;
  created_at: string;
};

export type PeriodPreset = "all" | "today" | "week" | "month" | "custom";

