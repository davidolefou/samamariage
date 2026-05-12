import { pgTable, uuid, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const weddingStyleEnum = pgEnum('wedding_style', [
  'traditionnel',
  'moderne',
  'fusion',
  'royal',
  'boheme',
])

export const ceremonyTypeEnum = pgEnum('ceremony_type', [
  'takk',
  'ceet',
  'civil',
  'reception',
])

export const weddings = pgTable('weddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  partnerName: text('partner_name'),
  weddingDate: timestamp('wedding_date', { withTimezone: true }),
  weddingDateApprox: text('wedding_date_approx'),
  city: text('city').notNull().default('Dakar'),
  guestCount: integer('guest_count').notNull().default(200),
  style: weddingStyleEnum('style').notNull().default('fusion'),
  budgetTotal: integer('budget_total'),
  isPublic: boolean('is_public').notNull().default(false),
  publicSlug: text('public_slug').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ceremonies = pgTable('ceremonies', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  type: ceremonyTypeEnum('type').notNull(),
  date: timestamp('date', { withTimezone: true }),
  venue: text('venue'),
  guestCount: integer('guest_count'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const weddingTasks = pgTable('wedding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  isCompleted: boolean('is_completed').notNull().default(false),
  priority: text('priority', { enum: ['haute', 'moyenne', 'basse'] }).notNull().default('moyenne'),
  category: text('category'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  user: one(users, { fields: [weddings.userId], references: [users.id] }),
  ceremonies: many(ceremonies),
  tasks: many(weddingTasks),
}))

export const ceremoniesRelations = relations(ceremonies, ({ one }) => ({
  wedding: one(weddings, { fields: [ceremonies.weddingId], references: [weddings.id] }),
}))

export type Wedding = typeof weddings.$inferSelect
export type NewWedding = typeof weddings.$inferInsert
export type Ceremony = typeof ceremonies.$inferSelect
export type WeddingTask = typeof weddingTasks.$inferSelect
