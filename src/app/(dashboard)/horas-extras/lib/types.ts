export type ExtraHoursAvailable = {
  total_generated: number;
  total_used: number;
  available: number;
  breakdown_by_date: { [key: string]: number };
};

export type ExtraHoursUsage = {
  id: string;
  bank_id: string;
  date: string;
  hours_used: number;
  description?: string;
  created_at: string;
  bank: {
    id: string;
    total_hours: number;
    description: string;
    created_at: string;
    updated_at: string;
  };
};

export type OvertimeMovement =
  | { key: string; date: string; kind: "earned"; hours: number }
  | { key: string; date: string; kind: "used"; hours: number; usage: ExtraHoursUsage };

export type StatementFilters = { from?: string; to?: string; description: string };
