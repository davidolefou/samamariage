import { pgTable, uuid, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { weddings } from './weddings'

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
  totalPlanned: integer('total_planned').notNull(),
  totalSpent: integer('total_spent').notNull().default(0),
  contingency: integer('contingency').notNull().default(0),
  currency: text('currency', { enum: ['XOF', 'EUR', 'USD'] }).notNull().default('XOF'),
  aiGeneratedAt: timestamp('ai_generated_at', { withTimezone: true }),
  warnings: text('warnings').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amountMin: integer('amount_min').notNull(),
  amountMax: integer('amount_max').notNull(),
  amountRecommended: integer('amount_recommended').notNull(),
  amountSpent: integer('amount_spent').notNull().default(0),
  percentage: real('percentage'),
  justification: text('justification'),
  tips: text('tips').array(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const budgetItems = pgTable('budget_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => budgetCategories.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  isPaid: boolean('is_paid').notNull().default(false),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentMethod: text('payment_method', { enum: ['wave', 'orange_money', 'cash', 'stripe', 'virement'] }),
  receiptUrl: text('receipt_url'),
  vendorId: uuid('vendor_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  wedding: one(weddings, { fields: [budgets.weddingId], references: [weddings.id] }),
  categories: many(budgetCategories),
}))

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  budget: one(budgets, { fields: [budgetCategories.budgetId], references: [budgets.id] }),
  items: many(budgetItems),
}))

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  category: one(budgetCategories, { fields: [budgetItems.categoryId], references: [budgetCategories.id] }),
}))

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type BudgetCategory = typeof budgetCategories.$inferSelect
export type BudgetItem = typeof budgetItems.$inferSelect
