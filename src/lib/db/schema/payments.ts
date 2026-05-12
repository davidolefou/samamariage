import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { weddings } from './weddings'

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'premium', 'diaspora'] }).notNull().default('free'),
  status: text('status', { enum: ['active', 'cancelled', 'expired', 'trialing'] }).notNull().default('active'),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  weddingId: uuid('wedding_id').references(() => weddings.id),
  type: text('type', { enum: ['subscription', 'commission', 'deposit'] }).notNull(),
  amountFcfa: integer('amount_fcfa').notNull(),
  currency: text('currency', { enum: ['XOF', 'EUR'] }).notNull().default('XOF'),
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).notNull().default('pending'),
  provider: text('provider', { enum: ['wave', 'orange_money', 'stripe', 'paydunya', 'cash'] }).notNull(),
  providerTransactionId: text('provider_transaction_id').unique(),
  providerReference: text('provider_reference'),
  metadata: text('metadata'),
  isCommission: boolean('is_commission').notNull().default(false),
  commissionRate: integer('commission_rate'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull().references(() => users.id),
  referredUserId: uuid('referred_user_id').references(() => users.id),
  code: text('code').notNull().unique(),
  rewardFcfa: integer('reward_fcfa').notNull().default(0),
  isPaid: boolean('is_paid').notNull().default(false),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  wedding: one(weddings, { fields: [payments.weddingId], references: [weddings.id] }),
}))

export type Payment = typeof payments.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
