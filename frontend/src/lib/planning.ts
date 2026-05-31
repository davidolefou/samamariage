// SamaMariage — types Planning.

export interface PlanningTask {
  id: string;
  userId: string;
  title: string;
  phase: string;
  dueDate: string | null;
  done: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningResponse {
  ok: boolean;
  tasks: PlanningTask[];
  progress: { total: number; done: number; pct: number };
}
