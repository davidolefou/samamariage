import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../server'
import { db } from '@/lib/db'
import { ndawtalRecords, returnObligations, weddings } from '@/lib/db/schema'
import { eq, and, sum, count } from 'drizzle-orm'
import { aiComplete } from '@/lib/ai/gateway'
import { buildNdawtalParsingPrompt } from '@/lib/ai/prompts/ndawtal'

const addInput = z.object({
  weddingId: z.string().uuid(),
  donorName: z.string().min(2),
  donorPhone: z.string().optional(),
  relationship: z.enum(['tante', 'cousine', 'amie', 'voisine', 'collegue', 'famille_marie', 'autre']).default('amie'),
  familySide: z.enum(['mariee', 'marie', 'les_deux']).default('mariee'),
  type: z.enum(['cash', 'cadeau', 'service']).default('cash'),
  amountFcfa: z.number().min(0).optional(),
  giftDescription: z.string().optional(),
  ceremony: z.enum(['takk', 'ceet', 'civil', 'reception']).default('reception'),
  notes: z.string().optional(),
  aiConfidence: z.number().optional(),
  createObligation: z.boolean().default(true),
})

export const ndawtalRouter = router({
  list: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      return db.select().from(ndawtalRecords)
        .where(eq(ndawtalRecords.weddingId, input.weddingId))
        .orderBy(ndawtalRecords.receivedAt)
    }),

  stats: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      const [totals] = await db
        .select({ total: sum(ndawtalRecords.amountFcfa), nb: count() })
        .from(ndawtalRecords)
        .where(eq(ndawtalRecords.weddingId, input.weddingId))

      const [obligations] = await db
        .select({ totalOwed: sum(returnObligations.amountOwed) })
        .from(returnObligations)
        .where(and(
          eq(returnObligations.weddingId, input.weddingId),
          eq(returnObligations.isReturned, false),
        ))

      return {
        totalCollected: Number(totals.total ?? 0),
        donorCount: Number(totals.nb ?? 0),
        totalObligations: Number(obligations.totalOwed ?? 0),
      }
    }),

  parseAndPreview: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid(), message: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      const result = await aiComplete({
        task: 'ndawtal_parsing',
        prompt: buildNdawtalParsingPrompt(input.message),
        systemPrompt: 'Tu es un assistant spécialisé dans les dons de mariage sénégalais (ndawtal). Réponds uniquement en JSON valide.',
        userId: ctx.dbUser!.id,
        maxTokens: 400,
        temperature: 0.1,
        cache: false,
      }, { isPremium: ctx.dbUser?.isPremium ?? false })

      try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned) as {
          donor_name: string
          amount_fcfa: number | null
          type: 'cash' | 'cadeau' | 'service'
          gift_description: string | null
          confidence: number
          needs_clarification: boolean
          clarification_question: string | null
        }
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Parsing IA échoué. Réessaie.' })
      }
    }),

  add: protectedProcedure
    .input(addInput)
    .mutation(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      const [record] = await db.insert(ndawtalRecords).values({
        weddingId: input.weddingId,
        donorName: input.donorName,
        donorPhone: input.donorPhone,
        relationship: input.relationship,
        familySide: input.familySide,
        type: input.type,
        amountFcfa: input.amountFcfa,
        giftDescription: input.giftDescription,
        ceremony: input.ceremony,
        notes: input.notes,
        aiConfidence: input.aiConfidence,
      }).returning()

      if (input.createObligation && input.type === 'cash' && input.amountFcfa) {
        await db.insert(returnObligations).values({
          ndawtalId: record.id,
          weddingId: input.weddingId,
          donorName: input.donorName,
          donorPhone: input.donorPhone,
          amountOwed: input.amountFcfa,
        })
      }

      return record
    }),

  markReceiptSent: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.update(ndawtalRecords)
        .set({ receiptSent: true, receiptSentAt: new Date() })
        .where(eq(ndawtalRecords.id, input.id))
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(returnObligations).where(eq(returnObligations.ndawtalId, input.id))
      await db.delete(ndawtalRecords).where(eq(ndawtalRecords.id, input.id))
    }),

  listObligations: protectedProcedure
    .input(z.object({ weddingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [wedding] = await db.select().from(weddings)
        .where(and(eq(weddings.id, input.weddingId), eq(weddings.userId, ctx.dbUser!.id)))
        .limit(1)
      if (!wedding) throw new TRPCError({ code: 'NOT_FOUND' })

      return db.select().from(returnObligations)
        .where(eq(returnObligations.weddingId, input.weddingId))
        .orderBy(returnObligations.createdAt)
    }),

  markObligationReturned: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      returnedAmount: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      await db.update(returnObligations)
        .set({ isReturned: true, returnedAt: new Date(), returnedAmount: input.returnedAmount })
        .where(eq(returnObligations.id, input.id))
    }),
})
