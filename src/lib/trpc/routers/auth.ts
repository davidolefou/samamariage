import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '../server'
import { db } from '@/lib/db'
import { users, weddings, ceremonies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const authRouter = router({
  getMe: protectedProcedure.query(({ ctx }) => ctx.dbUser),

  createProfile: protectedProcedure
    .input(z.object({ fullName: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.authId, ctx.authUser.id))
        .limit(1)

      if (existing[0]) return existing[0]

      const [user] = await db.insert(users).values({
        authId: ctx.authUser.id,
        fullName: input.fullName,
        email: ctx.authUser.email ?? null,
        phone: ctx.authUser.phone ?? null,
      }).returning()

      return user
    }),

  completeOnboarding: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      weddingDate: z.string().nullable(),
      weddingDateApprox: z.string().nullable(),
      guestCount: z.number().min(10).max(5000),
      ceremonies: z.array(z.enum(['takk', 'ceet', 'civil', 'reception'])),
      style: z.enum(['traditionnel', 'moderne', 'fusion', 'royal', 'boheme']),
      city: z.string().default('Dakar'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update or create user profile
      let dbUser = ctx.dbUser
      if (!dbUser) {
        const [created] = await db.insert(users).values({
          authId: ctx.authUser.id,
          fullName: input.fullName,
          email: ctx.authUser.email ?? null,
          phone: ctx.authUser.phone ?? null,
        }).returning()
        dbUser = created
      } else {
        await db.update(users)
          .set({ fullName: input.fullName })
          .where(eq(users.id, dbUser.id))
      }

      // Create wedding
      const [wedding] = await db.insert(weddings).values({
        userId: dbUser.id,
        guestCount: input.guestCount,
        style: input.style,
        city: input.city,
        weddingDate: input.weddingDate ? new Date(input.weddingDate) : null,
        weddingDateApprox: input.weddingDateApprox ?? null,
      }).returning()

      // Create ceremonies
      if (input.ceremonies.length > 0) {
        await db.insert(ceremonies).values(
          input.ceremonies.map((type) => ({ weddingId: wedding.id, type }))
        )
      }

      return { user: dbUser, wedding }
    }),
})
