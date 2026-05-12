import { router } from './server'
import { authRouter } from './routers/auth'
import { aiRouter } from './routers/ai'
import { budgetRouter } from './routers/budget'
import { weddingRouter } from './routers/wedding'
import { ndawtalRouter } from './routers/ndawtal'

export const appRouter = router({
  auth: authRouter,
  ai: aiRouter,
  budget: budgetRouter,
  wedding: weddingRouter,
  ndawtal: ndawtalRouter,
})

export type AppRouter = typeof appRouter
