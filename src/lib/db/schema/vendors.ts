import { pgTable, uuid, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const vendorCategories = pgTable('vendor_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  categoryId: uuid('category_id').references(() => vendorCategories.id),
  businessName: text('business_name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  phone: text('phone'),
  email: text('email'),
  city: text('city').notNull().default('Dakar'),
  address: text('address'),
  instagramUrl: text('instagram_url'),
  portfolioUrl: text('portfolio_url'),
  priceMin: integer('price_min'),
  priceMax: integer('price_max'),
  isVerified: boolean('is_verified').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  isPremium: boolean('is_premium').notNull().default(false),
  averageRating: real('average_rating'),
  reviewCount: integer('review_count').notNull().default(0),
  profileImageUrl: text('profile_image_url'),
  coverImageUrl: text('cover_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vendorServices = pgTable('vendor_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  priceFcfa: integer('price_fcfa'),
  priceType: text('price_type', { enum: ['fixe', 'heure', 'jour', 'personne', 'sur_devis'] }).notNull().default('fixe'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vendorAvailability = pgTable('vendor_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  notes: text('notes'),
})

// Relations
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, { fields: [vendors.userId], references: [users.id] }),
  category: one(vendorCategories, { fields: [vendors.categoryId], references: [vendorCategories.id] }),
  services: many(vendorServices),
  availability: many(vendorAvailability),
}))

export type Vendor = typeof vendors.$inferSelect
export type NewVendor = typeof vendors.$inferInsert
export type VendorService = typeof vendorServices.$inferSelect
