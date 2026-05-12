import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { weddings } from './weddings'
import { vendors, vendorServices } from './vendors'

export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').references(() => vendorServices.id),
  status: text('status', {
    enum: ['envoyee', 'vue', 'repondus', 'acceptee', 'refusee', 'expiree'],
  }).notNull().default('envoyee'),
  message: text('message'),
  eventDate: timestamp('event_date', { withTimezone: true }),
  guestCount: integer('guest_count'),
  budget: integer('budget'),
  vendorResponse: text('vendor_response'),
  proposedPriceFcfa: integer('proposed_price_fcfa'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id),
  status: text('status', {
    enum: ['confirme', 'en_attente', 'annule', 'termine'],
  }).notNull().default('en_attente'),
  totalPriceFcfa: integer('total_price_fcfa').notNull(),
  depositPaid: integer('deposit_paid').notNull().default(0),
  eventDate: timestamp('event_date', { withTimezone: true }),
  notes: text('notes'),
  contractUrl: text('contract_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  wedding: one(weddings, { fields: [quoteRequests.weddingId], references: [weddings.id] }),
  vendor: one(vendors, { fields: [quoteRequests.vendorId], references: [vendors.id] }),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  wedding: one(weddings, { fields: [bookings.weddingId], references: [weddings.id] }),
  vendor: one(vendors, { fields: [bookings.vendorId], references: [vendors.id] }),
  quoteRequest: one(quoteRequests, { fields: [bookings.quoteRequestId], references: [quoteRequests.id] }),
}))

export type QuoteRequest = typeof quoteRequests.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
