import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function createContext() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let dbUser = null
  if (authUser) {
    const result = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
    dbUser = result[0] ?? null
  }

  return { supabase, authUser, dbUser }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({ transformer: superjson })

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.authUser) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, authUser: ctx.authUser, dbUser: ctx.dbUser } })
})
