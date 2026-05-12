import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { weddings, ceremonyTypeEnum } from './weddings'

export const outfitGroups = pgTable('outfit_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ceremony: ceremonyTypeEnum('ceremony').notNull().default('reception'),
  description: text('description'),
  deadline: timestamp('deadline', { withTimezone: true }),
  tailorName: text('tailor_name'),
  tailorPhone: text('tailor_phone'),
  totalCotisation: integer('total_cotisation').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const outfitMembers = pgTable('outfit_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => outfitGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  measurements: text('measurements'),
  cotisationAmount: integer('cotisation_amount').notNull().default(0),
  hasPaid: boolean('has_paid').notNull().default(false),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  outfitReady: boolean('outfit_ready').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const fabricOptions = pgTable('fabric_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => outfitGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  voteCount: integer('vote_count').notNull().default(0),
  isSelected: boolean('is_selected').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const outfitGroupsRelations = relations(outfitGroups, ({ one, many }) => ({
  wedding: one(weddings, { fields: [outfitGroups.weddingId], references: [weddings.id] }),
  members: many(outfitMembers),
  fabrics: many(fabricOptions),
}))

export type OutfitGroup = typeof outfitGroups.$inferSelect
export type OutfitMember = typeof outfitMembers.$inferSelect
