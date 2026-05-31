// SamaMariage — types Budget.

export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  allocated: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetResponse {
  ok: boolean;
  categories: BudgetCategory[];
  totals: {
    budget: number; // enveloppe globale (Wedding.budget)
    allocated: number;
    spent: number;
    remaining: number; // budget - spent
  };
}
