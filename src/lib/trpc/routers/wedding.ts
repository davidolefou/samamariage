import { router, protectedProcedure } from '../server'
import { db } from '@/lib/db'
import { weddings, ceremonies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const weddingRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.dbUser) return null
    const [wedding] = await db.select().from(weddings)
      .where(eq(weddings.userId, ctx.dbUser.id)).limit(1)
    if (!wedding) return null

    const weddingCeremonies = await db.select().from(ceremonies)
      .where(eq(ceremonies.weddingId, wedding.id))

    return { ...wedding, ceremonies: weddingCeremonies }
  }),
})
