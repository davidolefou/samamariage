import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { weddings } from './weddings'

export const guestGroups = pgTable('guest_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  side: text('side', { enum: ['mariee', 'marie', 'commun'] }).notNull().default('commun'),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => guestGroups.id),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  side: text('side', { enum: ['mariee', 'marie', 'commun'] }).notNull().default('commun'),
  rsvpStatus: text('rsvp_status', { enum: ['en_attente', 'confirme', 'decline', 'peut_etre'] }).notNull().default('en_attente'),
  rsvpRespondedAt: timestamp('rsvp_responded_at', { withTimezone: true }),
  mealPreference: text('meal_preference'),
  tableNumber: integer('table_number'),
  inviteCode: text('invite_code').unique(),
  inviteSentAt: timestamp('invite_sent_at', { withTimezone: true }),
  plusOne: boolean('plus_one').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const guestGroupsRelations = relations(guestGroups, ({ one, many }) => ({
  wedding: one(weddings, { fields: [guestGroups.weddingId], references: [weddings.id] }),
  guests: many(guests),
}))

export const guestsRelations = relations(guests, ({ one }) => ({
  wedding: one(weddings, { fields: [guests.weddingId], references: [weddings.id] }),
  group: one(guestGroups, { fields: [guests.groupId], references: [guestGroups.id] }),
}))

export type Guest = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert
export type GuestGroup = typeof guestGroups.$inferSelect
