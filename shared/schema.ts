import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gold consignments table
export const consignments = pgTable("consignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  consignmentNumber: varchar("consignment_number").unique().notNull(),
  description: text("description").notNull(),
  weight: decimal("weight", { precision: 10, scale: 4 }).notNull(),
  purity: decimal("purity", { precision: 5, scale: 3 }).notNull(),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, verified, stored, claimed
  storagePlan: varchar("storage_plan").notNull(), // standard, premium
  insuranceEnabled: boolean("insurance_enabled").default(true),
  vaultLocation: varchar("vault_location"),
  certificateUrl: text("certificate_url"),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consignment audit events
export const consignmentEvents = pgTable("consignment_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignments.id),
  eventType: varchar("event_type").notNull(), // created, verified, stored, status_changed
  description: text("description").notNull(),
  actor: varchar("actor"), // user_id or admin_id
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Digital wills table
export const digitalWills = pgTable("digital_wills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("draft"), // draft, active, executed
  totalAllocation: integer("total_allocation").default(0), // percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id").notNull().references(() => digitalWills.id),
  fullName: varchar("full_name").notNull(),
  relationship: varchar("relationship").notNull(),
  percentage: integer("percentage").notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced claims table (supports multiple claim types)
export const inheritanceClaims = pgTable("inheritance_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimType: varchar("claim_type").notNull().default("inheritance"), // inheritance, ownership_dispute, withdrawal_request, transfer_request
  willId: varchar("will_id").references(() => digitalWills.id), // nullable for non-inheritance claims
  beneficiaryId: varchar("beneficiary_id").references(() => beneficiaries.id), // nullable for non-inheritance claims
  consignmentId: varchar("consignment_id").references(() => consignments.id), // for ownership disputes/withdrawals
  claimantName: varchar("claimant_name").notNull(),
  claimantEmail: varchar("claimant_email").notNull(),
  claimantPhone: varchar("claimant_phone"),
  relationship: varchar("relationship"), // relationship to original owner
  claimReason: text("claim_reason"), // detailed reason for the claim
  requestedAction: varchar("requested_action"), // what the claimant wants (transfer, withdrawal, etc.)
  status: varchar("status").notNull().default("pending"), // pending, under_review, approved, rejected, requires_more_info
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  documentUrls: text("document_urls").array(),
  documentTypes: text("document_types").array(), // IDs, court_orders, death_certificates, etc.
  adminNotes: text("admin_notes"),
  communicationLog: jsonb("communication_log"), // track all communications
  assignedTo: varchar("assigned_to").references(() => users.id), // admin assigned to handle this claim
  reviewDeadline: timestamp("review_deadline"),
  resolutionDate: timestamp("resolution_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  isCustomer: boolean("is_customer").default(true),
  message: text("message").notNull(),
  attachmentUrls: text("attachment_urls").array(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Account transactions table for credit/debit functionality
export const accountTransactions = pgTable("account_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'credit' or 'debit'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  performedBy: varchar("performed_by").notNull().references(() => users.id), // admin who performed the action
  createdAt: timestamp("created_at").defaultNow(),
});

// Gold holdings table for managing customer gold assets
export const goldHoldings = pgTable("gold_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'credit' or 'debit' 
  weight: decimal("weight", { precision: 10, scale: 4 }).notNull(), // in ounces
  purity: decimal("purity", { precision: 5, scale: 3 }).notNull(), // percentage (99.9 = 99.9%)
  description: text("description").notNull(),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }), // price at time of acquisition
  performedBy: varchar("performed_by").notNull().references(() => users.id), // admin who performed the action
  createdAt: timestamp("created_at").defaultNow(),
});

// Storage plans table
export const storagePlans = pgTable("storage_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  annualRate: decimal("annual_rate", { precision: 5, scale: 4 }).notNull(), // as decimal (0.005 = 0.5%)
  insuranceRate: decimal("insurance_rate", { precision: 5, scale: 4 }).notNull(),
  setupFee: decimal("setup_fee", { precision: 8, scale: 2 }).notNull(),
  features: text("features").array(),
  active: boolean("active").default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  consignments: many(consignments),
  digitalWills: many(digitalWills),
}));

export const consignmentsRelations = relations(consignments, ({ one, many }) => ({
  user: one(users, {
    fields: [consignments.userId],
    references: [users.id],
  }),
  events: many(consignmentEvents),
}));

export const consignmentEventsRelations = relations(consignmentEvents, ({ one }) => ({
  consignment: one(consignments, {
    fields: [consignmentEvents.consignmentId],
    references: [consignments.id],
  }),
}));

export const digitalWillsRelations = relations(digitalWills, ({ one, many }) => ({
  user: one(users, {
    fields: [digitalWills.userId],
    references: [users.id],
  }),
  beneficiaries: many(beneficiaries),
  claims: many(inheritanceClaims),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one, many }) => ({
  will: one(digitalWills, {
    fields: [beneficiaries.willId],
    references: [digitalWills.id],
  }),
  claims: many(inheritanceClaims),
}));

export const inheritanceClaimsRelations = relations(inheritanceClaims, ({ one }) => ({
  will: one(digitalWills, {
    fields: [inheritanceClaims.willId],
    references: [digitalWills.id],
  }),
  beneficiary: one(beneficiaries, {
    fields: [inheritanceClaims.beneficiaryId],
    references: [beneficiaries.id],
  }),
}));

// Zod schemas
export const insertConsignmentSchema = createInsertSchema(consignments).omit({
  id: true,
  consignmentNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDigitalWillSchema = createInsertSchema(digitalWills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBeneficiarySchema = createInsertSchema(beneficiaries).omit({
  id: true,
  createdAt: true,
});

export const insertClaimSchema = createInsertSchema(inheritanceClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolutionDate: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountTransactionSchema = createInsertSchema(accountTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertConsignment = z.infer<typeof insertConsignmentSchema>;
export type Consignment = typeof consignments.$inferSelect;

export type ConsignmentEvent = typeof consignmentEvents.$inferSelect;

export type InsertDigitalWill = z.infer<typeof insertDigitalWillSchema>;
export type DigitalWill = typeof digitalWills.$inferSelect;

export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type Beneficiary = typeof beneficiaries.$inferSelect;

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type InheritanceClaim = typeof inheritanceClaims.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertAccountTransaction = z.infer<typeof insertAccountTransactionSchema>;
export type AccountTransaction = typeof accountTransactions.$inferSelect;

export const insertGoldHoldingSchema = createInsertSchema(goldHoldings).omit({
  id: true,
  createdAt: true,
});

export type InsertGoldHolding = z.infer<typeof insertGoldHoldingSchema>;
export type GoldHolding = typeof goldHoldings.$inferSelect;

export type StoragePlan = typeof storagePlans.$inferSelect;
