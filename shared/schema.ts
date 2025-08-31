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
  trackingId: varchar("tracking_id").unique().notNull(), // Public tracking ID for customers
  description: text("description").notNull(),
  weight: decimal("weight", { precision: 10, scale: 4 }).notNull(),
  purity: decimal("purity", { precision: 5, scale: 3 }).notNull(),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, verified, stored, claimed
  trackingStatus: varchar("tracking_status").notNull().default("received"), // received, in_vault, under_review, in_transit, delivered, rejected
  storagePlan: varchar("storage_plan").notNull(), // standard, premium
  insuranceEnabled: boolean("insurance_enabled").default(true),
  vaultLocation: varchar("vault_location"),
  currentLocation: varchar("current_location"), // Current physical location for tracking
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

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull().default("general"), // general, technical, account, billing, consignment
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status").notNull().default("open"), // open, pending, escalated, resolved, closed
  assignedTo: varchar("assigned_to").references(() => users.id), // admin assigned
  escalatedBy: varchar("escalated_by").references(() => users.id), // admin who escalated
  escalatedAt: timestamp("escalated_at"),
  escalationReason: text("escalation_reason"),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  firstResponseTime: timestamp("first_response_time"),
  lastActivity: timestamp("last_activity").defaultNow(),
  chatSessionId: varchar("chat_session_id"), // link to chat session
  attachmentUrls: text("attachment_urls").array(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table (enhanced for support context)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  ticketId: varchar("ticket_id").references(() => supportTickets.id), // link to support ticket
  userId: varchar("user_id").references(() => users.id),
  isCustomer: boolean("is_customer").default(true),
  message: text("message").notNull(),
  messageType: varchar("message_type").notNull().default("text"), // text, system, escalation, resolution
  attachmentUrls: text("attachment_urls").array(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Admin notifications table
export const adminNotifications = pgTable("admin_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // new_ticket, escalation, urgent, customer_response
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  ticketId: varchar("ticket_id").references(() => supportTickets.id),
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  actionRequired: boolean("action_required").default(false),
  metadata: jsonb("metadata"), // additional data specific to notification type
  createdAt: timestamp("created_at").defaultNow(),
});

// Tracking status updates table
export const trackingUpdates = pgTable("tracking_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignments.id),
  status: varchar("status").notNull(), // received, in_vault, under_review, in_transit, delivered, rejected
  location: varchar("location"), // Current location (warehouse name, geolocation, etc.)
  description: text("description").notNull(),
  adminId: varchar("admin_id").notNull().references(() => users.id), // Admin who made the update
  customerNotified: boolean("customer_notified").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  isPublic: boolean("is_public").default(true), // Whether this update is visible on public tracking
  metadata: jsonb("metadata"), // Additional tracking data like coordinates, carrier info
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled tracking updates table
export const scheduledUpdates = pgTable("scheduled_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignments.id),
  scheduledStatus: varchar("scheduled_status").notNull(),
  scheduledLocation: varchar("scheduled_location"),
  description: text("description").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  executed: boolean("executed").default(false),
  executedAt: timestamp("executed_at"),
  notifyCustomer: boolean("notify_customer").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer notifications table for tracking updates
export const customerNotifications = pgTable("customer_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: varchar("customer_email"), // For users without accounts
  consignmentId: varchar("consignment_id").notNull().references(() => consignments.id),
  trackingUpdateId: varchar("tracking_update_id").references(() => trackingUpdates.id),
  type: varchar("type").notNull(), // status_update, delivery_notification, schedule_change
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  notificationMethod: varchar("notification_method").notNull().default("email"), // email, push, sms
  delivered: boolean("delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Knowledge base articles table
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: varchar("category").notNull(), // general, billing, technical, consignment, inheritance
  tags: text("tags").array(),
  isPublished: boolean("is_published").default(true),
  viewCount: integer("view_count").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  notHelpfulVotes: integer("not_helpful_votes").default(0),
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge base article votes table
export const knowledgeBaseVotes = pgTable("knowledge_base_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For anonymous users
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer support sessions table
export const supportSessions = pgTable("support_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id),
  customerEmail: varchar("customer_email"),
  customerName: varchar("customer_name"),
  status: varchar("status").notNull().default("active"), // active, ended, transferred
  assignedTo: varchar("assigned_to").references(() => users.id), // admin assigned
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  ticketId: varchar("ticket_id").references(() => supportTickets.id), // if escalated to ticket
  metadata: jsonb("metadata"), // browser info, page context, etc.
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
  trackingUpdates: many(trackingUpdates),
  scheduledUpdates: many(scheduledUpdates),
  customerNotifications: many(customerNotifications),
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

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  customer: one(users, {
    fields: [supportTickets.customerId],
    references: [users.id],
  }),
  assignedAdmin: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  chatMessages: many(chatMessages),
  notifications: many(adminNotifications),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  ticket: one(supportTickets, {
    fields: [chatMessages.ticketId],
    references: [supportTickets.id],
  }),
}));

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  admin: one(users, {
    fields: [adminNotifications.adminId],
    references: [users.id],
  }),
  ticket: one(supportTickets, {
    fields: [adminNotifications.ticketId],
    references: [supportTickets.id],
  }),
}));

export const trackingUpdatesRelations = relations(trackingUpdates, ({ one }) => ({
  consignment: one(consignments, {
    fields: [trackingUpdates.consignmentId],
    references: [consignments.id],
  }),
  admin: one(users, {
    fields: [trackingUpdates.adminId],
    references: [users.id],
  }),
}));

export const scheduledUpdatesRelations = relations(scheduledUpdates, ({ one }) => ({
  consignment: one(consignments, {
    fields: [scheduledUpdates.consignmentId],
    references: [consignments.id],
  }),
  admin: one(users, {
    fields: [scheduledUpdates.adminId],
    references: [users.id],
  }),
}));

export const customerNotificationsRelations = relations(customerNotifications, ({ one }) => ({
  user: one(users, {
    fields: [customerNotifications.userId],
    references: [users.id],
  }),
  consignment: one(consignments, {
    fields: [customerNotifications.consignmentId],
    references: [consignments.id],
  }),
  trackingUpdate: one(trackingUpdates, {
    fields: [customerNotifications.trackingUpdateId],
    references: [trackingUpdates.id],
  }),
}));

export const knowledgeBaseArticlesRelations = relations(knowledgeBaseArticles, ({ one, many }) => ({
  author: one(users, {
    fields: [knowledgeBaseArticles.authorId],
    references: [users.id],
  }),
  votes: many(knowledgeBaseVotes),
}));

export const knowledgeBaseVotesRelations = relations(knowledgeBaseVotes, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseVotes.articleId],
    references: [knowledgeBaseArticles.id],
  }),
  user: one(users, {
    fields: [knowledgeBaseVotes.userId],
    references: [users.id],
  }),
}));

export const supportSessionsRelations = relations(supportSessions, ({ one, many }) => ({
  customer: one(users, {
    fields: [supportSessions.customerId],
    references: [users.id],
  }),
  assignedAdmin: one(users, {
    fields: [supportSessions.assignedTo],
    references: [users.id],
  }),
  ticket: one(supportTickets, {
    fields: [supportSessions.ticketId],
    references: [supportTickets.id],
  }),
  chatMessages: many(chatMessages),
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

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  escalatedAt: true,
  firstResponseTime: true,
  lastActivity: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingUpdateSchema = createInsertSchema(trackingUpdates).omit({
  id: true,
  createdAt: true,
  notificationSentAt: true,
});

export const insertScheduledUpdateSchema = createInsertSchema(scheduledUpdates).omit({
  id: true,
  createdAt: true,
  executedAt: true,
});

export const insertCustomerNotificationSchema = createInsertSchema(customerNotifications).omit({
  id: true,
  createdAt: true,
  deliveredAt: true,
  readAt: true,
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

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

export type InsertAccountTransaction = z.infer<typeof insertAccountTransactionSchema>;
export type AccountTransaction = typeof accountTransactions.$inferSelect;

export const insertGoldHoldingSchema = createInsertSchema(goldHoldings).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseArticleSchema = createInsertSchema(knowledgeBaseArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  helpfulVotes: true,
  notHelpfulVotes: true,
});

export const insertKnowledgeBaseVoteSchema = createInsertSchema(knowledgeBaseVotes).omit({
  id: true,
  createdAt: true,
});

export const insertSupportSessionSchema = createInsertSchema(supportSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export type InsertGoldHolding = z.infer<typeof insertGoldHoldingSchema>;
export type GoldHolding = typeof goldHoldings.$inferSelect;

export type StoragePlan = typeof storagePlans.$inferSelect;

export type InsertTrackingUpdate = z.infer<typeof insertTrackingUpdateSchema>;
export type TrackingUpdate = typeof trackingUpdates.$inferSelect;

export type InsertScheduledUpdate = z.infer<typeof insertScheduledUpdateSchema>;
export type ScheduledUpdate = typeof scheduledUpdates.$inferSelect;

export type InsertCustomerNotification = z.infer<typeof insertCustomerNotificationSchema>;
export type CustomerNotification = typeof customerNotifications.$inferSelect;

export type InsertKnowledgeBaseArticle = z.infer<typeof insertKnowledgeBaseArticleSchema>;
export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;

export type InsertKnowledgeBaseVote = z.infer<typeof insertKnowledgeBaseVoteSchema>;
export type KnowledgeBaseVote = typeof knowledgeBaseVotes.$inferSelect;

export type InsertSupportSession = z.infer<typeof insertSupportSessionSchema>;
export type SupportSession = typeof supportSessions.$inferSelect;
