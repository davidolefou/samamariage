import { pgTable, uuid, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { weddings, ceremonyTypeEnum } from './weddings'

export const ndawtalRecords = pgTable('ndawtal_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  donorName: text('donor_name').notNull(),
  donorPhone: text('donor_phone'),
  relationship: text('relationship', {
    enum: ['tante', 'cousine', 'amie', 'voisine', 'collegue', 'famille_marie', 'autre'],
  }).notNull().default('amie'),
  familySide: text('family_side', { enum: ['mariee', 'marie', 'les_deux'] }).notNull().default('mariee'),
  type: text('type', { enum: ['cash', 'cadeau', 'service'] }).notNull().default('cash'),
  amountFcfa: integer('amount_fcfa'),
  giftDescription: text('gift_description'),
  ceremony: ceremonyTypeEnum('ceremony').notNull().default('reception'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  receiptSent: boolean('receipt_sent').notNull().default(false),
  receiptSentAt: timestamp('receipt_sent_at', { withTimezone: true }),
  notes: text('notes'),
  aiConfidence: real('ai_confidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const returnObligations = pgTable('return_obligations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ndawtalId: uuid('ndawtal_id').notNull().references(() => ndawtalRecords.id, { onDelete: 'cascade' }),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  donorName: text('donor_name').notNull(),
  donorPhone: text('donor_phone'),
  amountOwed: integer('amount_owed'),
  eventType: text('event_type'),
  isReturned: boolean('is_returned').notNull().default(false),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  returnedAmount: integer('returned_amount'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const ndawtalRecordsRelations = relations(ndawtalRecords, ({ one, many }) => ({
  wedding: one(weddings, { fields: [ndawtalRecords.weddingId], references: [weddings.id] }),
  obligations: many(returnObligations),
}))

export const returnObligationsRelations = relations(returnObligations, ({ one }) => ({
  ndawtal: one(ndawtalRecords, { fields: [returnObligations.ndawtalId], references: [ndawtalRecords.id] }),
  wedding: one(weddings, { fields: [returnObligations.weddingId], references: [weddings.id] }),
}))

export type NdawtalRecord = typeof ndawtalRecords.$inferSelect
export type NewNdawtalRecord = typeof ndawtalRecords.$inferInsert
export type ReturnObligation = typeof returnObligations.$inferSelect
