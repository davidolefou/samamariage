// SamaMariage — routage modèles + pricing de l'AI Gateway.

export const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export type AiTask = 'budget' | 'planning' | 'chat' | 'ndawtal' | 'mood';

// Sonnet pour le raisonnement (budget/planning/chat) ; Haiku pour le parsing
// rapide et bon marché (ndawtal/mood).
export const TASK_MODEL: Record<AiTask, ModelId> = {
  budget: MODELS.sonnet,
  planning: MODELS.sonnet,
  chat: MODELS.sonnet,
  ndawtal: MODELS.haiku,
  mood: MODELS.haiku,
};

// Tâches dont la réponse ne doit JAMAIS être mise en cache (conversationnel).
export const NO_CACHE_TASKS: AiTask[] = ['chat'];

// Pricing $/1M tokens — pour le coût loggé dans AiInteraction.
export const PRICING: Record<ModelId, { in: number; out: number; cachedIn: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15, cachedIn: 0.3 },
  'claude-haiku-4-5': { in: 1, out: 5, cachedIn: 0.1 },
};
