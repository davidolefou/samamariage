import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: uuid('auth_id').unique().notNull(),
  fullName: text('full_name'),
  phone: text('phone').unique(),
  email: text('email').unique(),
  role: text('role', { enum: ['mariee', 'prestataire', 'admin'] })
    .notNull()
    .default('mariee'),
  isPremium: boolean('is_premium').notNull().default(false),
  isDiaspora: boolean('is_diaspora').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
