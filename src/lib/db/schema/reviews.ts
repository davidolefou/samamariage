import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { vendors } from './vendors'
import { weddings } from './weddings'

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  weddingId: uuid('wedding_id').references(() => weddings.id),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  isVerified: boolean('is_verified').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  vendorReply: text('vendor_reply'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const moodBoards = pgTable('mood_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Mon ambiance'),
  description: text('description'),
  aiAnalysis: text('ai_analysis'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const moodImages = pgTable('mood_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id').notNull().references(() => moodBoards.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  sourceUrl: text('source_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  vendor: one(vendors, { fields: [reviews.vendorId], references: [vendors.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}))

export const moodBoardsRelations = relations(moodBoards, ({ one, many }) => ({
  wedding: one(weddings, { fields: [moodBoards.weddingId], references: [weddings.id] }),
  images: many(moodImages),
}))

export type Review = typeof reviews.$inferSelect
export type MoodBoard = typeof moodBoards.$inferSelect
