import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = new URL(process.env.DATABASE_URL!)
url.searchParams.set('sslmode', 'require')

export default {
  schema: './src/lib/db/schema',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: url.toString(),
  },
} satisfies Config
