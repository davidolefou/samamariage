import { router } from './server'
import { authRouter } from './routers/auth'
import { aiRouter } from './routers/ai'

export const appRouter = router({
  auth: authRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter
