import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../server'
import { db } from '@/lib/db'
import { budgets, budgetCategories, budgetItems, weddings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { aiComplete } from '@/lib/ai/gateway'
import { buildBudgetSystemPrompt, buildBudgetUserPrompt } from '@/lib/ai/prompts/budget'

export const budgetRouter = router({
  // Get budget for current wedding
  get: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      const [budget] = await db.select().from(budgets)
        .where(eq(budgets.weddingId, input.weddingId)).limit(1)
      if (!budget) return null

      const categories = await db.select().from(budgetCategories)
        .where(eq(budgetCategories.budgetId, budget.id))
        .orderBy(budgetCategories.sortOrder)

      return { ...budget, categories }
    }),

  // Generate AI budget
  generate: protectedProcedure
    .input(z.object({
      weddingId: z.string().uuid(),
      budgetTotal: z.number().min(500_000),
      guestCount: z.number().min(10),
      city: z.string(),
      style: z.string(),
      ceremonies: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      // Call AI
      const result = await aiComplete({
        task: 'budget_generation',
        prompt: buildBudgetUserPrompt(input),
        systemPrompt: buildBudgetSystemPrompt(),
        userId: ctx.dbUser!.id,
        maxTokens: 3000,
        temperature: 0.3,
        cache: true,
      }, { isPremium: ctx.dbUser?.isPremium ?? false })

      let parsed: { categories: Array<{
        name: string; amount_min: number; amount_max: number
        amount_recommended: number; percentage: number
        justification: string; tips: string[]
      }>; total_planned: number; contingency: number; warnings: string[] }

      try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur de génération IA. Réessaie.' })
      }

      // Delete existing budget if any
      const existing = await db.select().from(budgets).where(eq(budgets.weddingId, input.weddingId)).limit(1)
      if (existing[0]) {
        await db.delete(budgetCategories).where(eq(budgetCategories.budgetId, existing[0].id))
        await db.delete(budgets).where(eq(budgets.id, existing[0].id))
      }

      // Insert new budget
      const [budget] = await db.insert(budgets).values({
        weddingId: input.weddingId,
        totalPlanned: parsed.total_planned,
        contingency: parsed.contingency,
        aiGeneratedAt: new Date(),
        warnings: parsed.warnings ?? [],
      }).returning()

      // Insert categories
      const categories = await db.insert(budgetCategories).values(
        parsed.categories.map((c, i) => ({
          budgetId: budget.id,
          name: c.name,
          amountMin: c.amount_min,
          amountMax: c.amount_max,
          amountRecommended: c.amount_recommended,
          percentage: c.percentage,
          justification: c.justification,
          tips: c.tips ?? [],
          sortOrder: i,
        }))
      ).returning()

      // Update wedding budget total
      await db.update(weddings).set({ budgetTotal: input.budgetTotal }).where(eq(weddings.id, input.weddingId))

      return { ...budget, categories }
    }),

  // Add expense to a category
  addExpense: protectedProcedure
    .input(z.object({
      categoryId: z.string().uuid(),
      description: z.string().min(2),
      amount: z.number().min(100),
      paymentMethod: z.enum(['wave', 'orange_money', 'cash', 'stripe', 'virement']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [item] = await db.insert(budgetItems).values({
        categoryId: input.categoryId,
        description: input.description,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      }).returning()

      // Update amountSpent on category
      const items = await db.select().from(budgetItems).where(eq(budgetItems.categoryId, input.categoryId))
      const spent = items.reduce((sum, i) => sum + i.amount, 0)
      await db.update(budgetCategories).set({ amountSpent: spent }).where(eq(budgetCategories.id, input.categoryId))

      return item
    }),

  // Get items for a category
  getItems: protectedProcedure
    .input(z.object({ categoryId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.select().from(budgetItems).where(eq(budgetItems.categoryId, input.categoryId))
    }),

  // Update wedding budget total
  updateTotal: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid(), budgetTotal: z.number().min(500_000) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(weddings)
        .set({ budgetTotal: input.budgetTotal })
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
    }),
})
