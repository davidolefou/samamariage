import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../server'
import { aiComplete } from '@/lib/ai/gateway'
import { buildBudgetSystemPrompt, buildBudgetUserPrompt, buildBudgetInsightsPrompt } from '@/lib/ai/prompts/budget'
import { buildNdawtalParsingPrompt } from '@/lib/ai/prompts/ndawtal'

export const aiRouter = router({
  generateBudget: protectedProcedure
    .input(z.object({
      budgetTotal: z.number().min(500_000),
      guestCount: z.number().min(10),
      city: z.string(),
      style: z.string(),
      ceremonies: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await aiComplete({
        task: 'budget_generation',
        prompt: buildBudgetUserPrompt(input),
        systemPrompt: buildBudgetSystemPrompt(),
        userId: ctx.dbUser?.id ?? ctx.authUser.id,
        maxTokens: 3000,
        temperature: 0.3,
        cache: true,
      }, { isPremium: ctx.dbUser?.isPremium ?? false })

      try {
        // Strip markdown code fences if present
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned)
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur de parsing de la réponse IA.' })
      }
    }),

  getBudgetInsights: protectedProcedure
    .input(z.object({
      categories: z.array(z.object({
        name: z.string(),
        amountRecommended: z.number(),
        amountSpent: z.number(),
      })),
      totalPlanned: z.number(),
      totalSpent: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await aiComplete({
        task: 'budget_insights',
        prompt: buildBudgetInsightsPrompt(input),
        userId: ctx.dbUser?.id ?? ctx.authUser.id,
        maxTokens: 1000,
        temperature: 0.7,
        cache: false,
      }, { isPremium: ctx.dbUser?.isPremium ?? false })

      try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned) as { insights: string[] }
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur de parsing.' })
      }
    }),

  parseNdawtal: protectedProcedure
    .input(z.object({ message: z.string().min(3).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const result = await aiComplete({
        task: 'ndawtal_parsing',
        prompt: buildNdawtalParsingPrompt(input.message),
        userId: ctx.dbUser?.id ?? ctx.authUser.id,
        maxTokens: 300,
        temperature: 0.1,
        cache: false,
      }, { isPremium: ctx.dbUser?.isPremium ?? false })

      try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned)
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur de parsing.' })
      }
    }),
})
