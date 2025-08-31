import {
  users,
  consignments,
  consignmentEvents,
  digitalWills,
  beneficiaries,
  inheritanceClaims,
  supportTickets,
  chatMessages,
  adminNotifications,
  trackingUpdates,
  scheduledUpdates,
  customerNotifications,
  accountTransactions,
  goldHoldings,
  storagePlans,
  knowledgeBaseArticles,
  knowledgeBaseVotes,
  supportSessions,
  type User,
  type UpsertUser,
  type Consignment,
  type InsertConsignment,
  type ConsignmentEvent,
  type DigitalWill,
  type InsertDigitalWill,
  type Beneficiary,
  type InsertBeneficiary,
  type InheritanceClaim,
  type InsertClaim,
  type SupportTicket,
  type InsertSupportTicket,
  type ChatMessage,
  type InsertChatMessage,
  type AdminNotification,
  type InsertAdminNotification,
  type TrackingUpdate,
  type InsertTrackingUpdate,
  type ScheduledUpdate,
  type InsertScheduledUpdate,
  type CustomerNotification,
  type InsertCustomerNotification,
  type AccountTransaction,
  type InsertAccountTransaction,
  type GoldHolding,
  type InsertGoldHolding,
  type StoragePlan,
  type KnowledgeBaseArticle,
  type InsertKnowledgeBaseArticle,
  type KnowledgeBaseVote,
  type InsertKnowledgeBaseVote,
  type SupportSession,
  type InsertSupportSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, isNull, inArray } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Consignment operations
  createConsignment(consignment: InsertConsignment): Promise<Consignment>;
  getConsignment(id: string): Promise<Consignment | undefined>;
  getConsignmentByNumber(number: string): Promise<Consignment | undefined>;
  getUserConsignments(userId: string): Promise<Consignment[]>;
  getAllConsignments(): Promise<(Consignment & { userEmail: string; userName: string })[]>;
  updateConsignmentStatus(id: string, status: string): Promise<void>;
  updateConsignmentCertificate(id: string, certificateUrl: string): Promise<void>;
  verifyConsignment(id: string, verifiedWeight: number, verifiedPurity: number, adminNotes: string, adminId: string): Promise<void>;
  
  // Consignment events
  addConsignmentEvent(event: Omit<ConsignmentEvent, 'id' | 'timestamp'>): Promise<void>;
  getConsignmentEvents(consignmentId: string): Promise<ConsignmentEvent[]>;
  
  // Digital will operations
  createDigitalWill(will: InsertDigitalWill): Promise<DigitalWill>;
  getUserDigitalWill(userId: string): Promise<DigitalWill | undefined>;
  updateDigitalWillStatus(id: string, status: string): Promise<void>;
  
  // Beneficiary operations
  addBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary>;
  getWillBeneficiaries(willId: string): Promise<Beneficiary[]>;
  deleteBeneficiary(id: string): Promise<void>;
  
  // Enhanced claims
  createClaim(claim: InsertClaim): Promise<InheritanceClaim>;
  getClaim(id: string): Promise<InheritanceClaim | undefined>;
  getClaimById(id: string): Promise<InheritanceClaim | undefined>;
  getPendingClaims(): Promise<InheritanceClaim[]>;
  getAllClaims(): Promise<InheritanceClaim[]>;
  getUserClaims(userId: string): Promise<InheritanceClaim[]>;
  getUserOwnershipChangeRequests(userId: string): Promise<InheritanceClaim[]>;
  canUserAccessClaim(userId: string, claimId: string): Promise<boolean>;
  updateClaimStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  assignClaimToAdmin(claimId: string, adminId: string): Promise<void>;
  addClaimCommunication(claimId: string, message: string, fromAdmin: boolean, adminId?: string): Promise<void>;
  updateClaimPriority(claimId: string, priority: string): Promise<void>;
  
  // Support ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getTicketsByStatus(status: string): Promise<SupportTicket[]>;
  getTicketsByAdmin(adminId: string): Promise<SupportTicket[]>;
  updateTicketStatus(id: string, status: string, adminId?: string): Promise<void>;
  updateTicketPriority(id: string, priority: string): Promise<void>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<void>;
  assignTicketToAdmin(ticketId: string, adminId: string): Promise<void>;
  escalateTicket(ticketId: string, escalatedBy: string, reason: string): Promise<void>;
  resolveTicket(ticketId: string, resolvedBy: string, resolutionNotes: string): Promise<void>;
  updateTicketActivity(ticketId: string): Promise<void>;

  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  getChatMessagesByTicket(ticketId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(sessionId: string, userId: string): Promise<void>;
  
  // Admin notification operations
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(adminId: string): Promise<AdminNotification[]>;
  getUnreadNotifications(adminId: string): Promise<AdminNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  
  // Account transaction operations
  createAccountTransaction(transaction: InsertAccountTransaction): Promise<AccountTransaction>;
  getUserAccountTransactions(userId: string): Promise<AccountTransaction[]>;
  getUserAccountBalance(userId: string): Promise<number>;
  
  // Gold holding operations
  createGoldHolding(holding: InsertGoldHolding): Promise<GoldHolding>;
  getUserGoldHoldings(userId: string): Promise<GoldHolding[]>;
  getUserGoldBalance(userId: string): Promise<{totalWeight: number; totalValue: number; avgPurity: number; activeItems: number}>;
  
  // Enhanced user management operations
  updateUserRole(userId: string, role: string): Promise<void>;
  deactivateUser(userId: string): Promise<void>;
  reactivateUser(userId: string): Promise<void>;
  resetUserPassword(userId: string, newPassword: string): Promise<void>;
  getUserActivityLog(userId: string): Promise<any[]>;
  
  // Storage plans
  getStoragePlans(): Promise<StoragePlan[]>;
  getStoragePlan(id: string): Promise<StoragePlan | undefined>;
  
  // Tracking operations
  createTrackingUpdate(update: InsertTrackingUpdate): Promise<TrackingUpdate>;
  getTrackingUpdates(consignmentId: string): Promise<TrackingUpdate[]>;
  getPublicTrackingUpdates(trackingId: string): Promise<TrackingUpdate[]>;
  updateConsignmentTrackingStatus(consignmentId: string, status: string, location?: string): Promise<void>;
  getConsignmentByTrackingId(trackingId: string): Promise<Consignment | undefined>;
  
  // Scheduled updates
  createScheduledUpdate(update: InsertScheduledUpdate): Promise<ScheduledUpdate>;
  getScheduledUpdates(consignmentId: string): Promise<ScheduledUpdate[]>;
  getPendingScheduledUpdates(): Promise<ScheduledUpdate[]>;
  executeScheduledUpdate(updateId: string): Promise<void>;
  
  // Customer notifications
  createCustomerNotification(notification: InsertCustomerNotification): Promise<CustomerNotification>;
  getCustomerNotifications(userId: string): Promise<CustomerNotification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  getNotificationSummary(userId: string): Promise<{total: number; unread: number; urgent: number; byType: Record<string, number>}>;
  markNotificationAsDelivered(notificationId: string): Promise<void>;
  markCustomerNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  respondToNotification(notificationId: string, userId: string, response: string, actionType?: string): Promise<void>;
  
  // Knowledge base operations
  createKnowledgeBaseArticle(article: InsertKnowledgeBaseArticle): Promise<KnowledgeBaseArticle>;
  getKnowledgeBaseArticles(category?: string): Promise<KnowledgeBaseArticle[]>;
  getKnowledgeBaseArticle(id: string): Promise<KnowledgeBaseArticle | undefined>;
  searchKnowledgeBase(searchTerm: string): Promise<KnowledgeBaseArticle[]>;
  voteOnArticle(vote: InsertKnowledgeBaseVote): Promise<void>;
  incrementArticleView(articleId: string): Promise<void>;
  updateKnowledgeBaseArticle(id: string, updates: Partial<KnowledgeBaseArticle>): Promise<void>;
  
  // Support session operations
  createSupportSession(session: InsertSupportSession): Promise<SupportSession>;
  getSupportSession(id: string): Promise<SupportSession | undefined>;
  getActiveSupportSessions(): Promise<SupportSession[]>;
  getUserSupportSessions(userId: string): Promise<SupportSession[]>;
  endSupportSession(sessionId: string): Promise<void>;
  assignSessionToAdmin(sessionId: string, adminId: string): Promise<void>;
  escalateSessionToTicket(sessionId: string, ticketData: InsertSupportTicket): Promise<SupportTicket>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Consignment operations
  async createConsignment(consignment: InsertConsignment): Promise<Consignment> {
    const consignmentNumber = await this.generateConsignmentNumber();
    const [created] = await db
      .insert(consignments)
      .values({
        ...consignment,
        consignmentNumber,
      })
      .returning();
    
    // Add creation event
    await this.addConsignmentEvent({
      consignmentId: created.id,
      eventType: 'created',
      description: 'Consignment created and submitted for verification',
      actor: consignment.userId,
      metadata: { weight: consignment.weight, estimatedValue: consignment.estimatedValue },
    });
    
    return created;
  }

  async getConsignment(id: string): Promise<Consignment | undefined> {
    const [consignment] = await db.select().from(consignments).where(eq(consignments.id, id));
    return consignment;
  }

  async getConsignmentByNumber(number: string): Promise<Consignment | undefined> {
    const [consignment] = await db
      .select()
      .from(consignments)
      .where(eq(consignments.consignmentNumber, number));
    return consignment;
  }

  async getUserConsignments(userId: string): Promise<Consignment[]> {
    return db
      .select()
      .from(consignments)
      .where(eq(consignments.userId, userId))
      .orderBy(desc(consignments.createdAt));
  }

  async updateConsignmentStatus(id: string, status: string): Promise<void> {
    await db
      .update(consignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(consignments.id, id));
  }

  async updateConsignmentCertificate(id: string, certificateUrl: string): Promise<void> {
    await db
      .update(consignments)
      .set({ certificateUrl, updatedAt: new Date() })
      .where(eq(consignments.id, id));
  }

  async getAllConsignments(): Promise<(Consignment & { userEmail: string; userName: string })[]> {
    const result = await db
      .select({
        id: consignments.id,
        userId: consignments.userId,
        consignmentNumber: consignments.consignmentNumber,
        description: consignments.description,
        weight: consignments.weight,
        purity: consignments.purity,
        estimatedValue: consignments.estimatedValue,
        status: consignments.status,
        storagePlan: consignments.storagePlan,
        insuranceEnabled: consignments.insuranceEnabled,
        vaultLocation: consignments.vaultLocation,
        certificateUrl: consignments.certificateUrl,
        qrCode: consignments.qrCode,
        createdAt: consignments.createdAt,
        updatedAt: consignments.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(consignments)
      .leftJoin(users, eq(consignments.userId, users.id))
      .orderBy(desc(consignments.createdAt));

    return result.map(row => ({
      ...row,
      userName: `${row.userFirstName || ''} ${row.userLastName || ''}`.trim() || row.userEmail?.split('@')[0] || 'Unknown'
    })) as (Consignment & { userEmail: string; userName: string })[];
  }

  async verifyConsignment(id: string, verifiedWeight: number, verifiedPurity: number, adminNotes: string, adminId: string): Promise<void> {
    // Update consignment status to verified
    await db
      .update(consignments)
      .set({ 
        status: 'verified',
        weight: verifiedWeight.toString(),
        purity: verifiedPurity.toString(),
        updatedAt: new Date() 
      })
      .where(eq(consignments.id, id));
    
    // Add verification event
    await this.addConsignmentEvent({
      consignmentId: id,
      eventType: 'verified',
      description: `Consignment verified by admin. Weight: ${verifiedWeight}oz, Purity: ${verifiedPurity}%`,
      actor: adminId,
      metadata: { 
        verifiedWeight, 
        verifiedPurity, 
        adminNotes,
        originalVerification: true 
      },
    });
  }

  private async generateConsignmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `GV-${year}-${timestamp}`;
  }

  // Consignment events
  async addConsignmentEvent(event: Omit<ConsignmentEvent, 'id' | 'timestamp'>): Promise<void> {
    await db.insert(consignmentEvents).values(event);
  }

  async getConsignmentEvents(consignmentId: string): Promise<ConsignmentEvent[]> {
    return db
      .select()
      .from(consignmentEvents)
      .where(eq(consignmentEvents.consignmentId, consignmentId))
      .orderBy(desc(consignmentEvents.timestamp));
  }

  // Digital will operations
  async createDigitalWill(will: InsertDigitalWill): Promise<DigitalWill> {
    const [created] = await db
      .insert(digitalWills)
      .values(will)
      .returning();
    return created;
  }

  async getUserDigitalWill(userId: string): Promise<DigitalWill | undefined> {
    const [will] = await db
      .select()
      .from(digitalWills)
      .where(eq(digitalWills.userId, userId));
    return will;
  }

  async updateDigitalWillStatus(id: string, status: string): Promise<void> {
    await db
      .update(digitalWills)
      .set({ status, updatedAt: new Date() })
      .where(eq(digitalWills.id, id));
  }

  // Beneficiary operations
  async addBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const [created] = await db
      .insert(beneficiaries)
      .values(beneficiary)
      .returning();
    return created;
  }

  async getWillBeneficiaries(willId: string): Promise<Beneficiary[]> {
    return db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.willId, willId));
  }

  async deleteBeneficiary(id: string): Promise<void> {
    await db.delete(beneficiaries).where(eq(beneficiaries.id, id));
  }

  // Inheritance claims
  async createClaim(claim: InsertClaim): Promise<InheritanceClaim> {
    const [created] = await db
      .insert(inheritanceClaims)
      .values(claim)
      .returning();
    return created;
  }

  async getClaim(id: string): Promise<InheritanceClaim | undefined> {
    const [claim] = await db
      .select()
      .from(inheritanceClaims)
      .where(eq(inheritanceClaims.id, id));
    return claim;
  }

  async getPendingClaims(): Promise<InheritanceClaim[]> {
    return db
      .select()
      .from(inheritanceClaims)
      .where(eq(inheritanceClaims.status, 'pending'))
      .orderBy(desc(inheritanceClaims.createdAt));
  }

  async updateClaimStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    await db
      .update(inheritanceClaims)
      .set(updateData)
      .where(eq(inheritanceClaims.id, id));
  }

  async getAllClaims(): Promise<InheritanceClaim[]> {
    return db
      .select()
      .from(inheritanceClaims)
      .orderBy(desc(inheritanceClaims.createdAt));
  }

  async assignClaimToAdmin(claimId: string, adminId: string): Promise<void> {
    await db
      .update(inheritanceClaims)
      .set({ assignedTo: adminId, updatedAt: new Date() })
      .where(eq(inheritanceClaims.id, claimId));
  }

  async addClaimCommunication(claimId: string, message: string, fromAdmin: boolean, adminId?: string): Promise<void> {
    // Get current communication log and full claim details
    const [claim] = await db
      .select()
      .from(inheritanceClaims)
      .where(eq(inheritanceClaims.id, claimId));

    if (!claim) {
      throw new Error("Claim not found");
    }

    const currentLog = claim.communicationLog as any[] || [];
    
    const newCommunication = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message,
      fromAdmin,
      adminId: fromAdmin ? adminId : null,
    };

    const updatedLog = [...currentLog, newCommunication];

    await db
      .update(inheritanceClaims)
      .set({ 
        communicationLog: updatedLog,
        updatedAt: new Date() 
      })
      .where(eq(inheritanceClaims.id, claimId));

    // If this is an admin message, create customer notification
    if (fromAdmin && adminId) {
      // Find the customer user by email
      const [customerUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, claim.claimantEmail));

      // Create customer notification
      await this.createCustomerNotification({
        userId: customerUser?.id || null,
        customerEmail: claim.claimantEmail,
        consignmentId: claim.consignmentId || null,
        type: 'claim_response',
        title: `Admin Response to Your ${claim.claimType} Claim`,
        message: message, // Use the actual admin message instead of generic text
        notificationMethod: 'email',
        metadata: { 
          claimId,
          communicationId: newCommunication.id,
          claimType: claim.claimType
        }
      });

      // Also create admin notification for other admins about the communication
      if (claim.assignedTo && claim.assignedTo !== adminId) {
        await this.createAdminNotification({
          adminId: claim.assignedTo,
          type: 'claim_update',
          title: 'Claim Communication Added',
          message: `Communication added to claim by admin`,
          priority: 'normal',
          actionRequired: false,
          metadata: { claimId, communicationId: newCommunication.id }
        });
      }
    }

    // If this is a customer message, create admin notifications
    if (!fromAdmin) {
      const allAdmins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));

      for (const admin of allAdmins) {
        await this.createAdminNotification({
          adminId: admin.id,
          type: 'customer_response',
          title: 'Customer Response to Claim',
          message: `Customer responded to ${claim.claimType} claim: ${claim.claimReason?.substring(0, 50)}...`,
          priority: 'normal',
          actionRequired: true,
          metadata: { 
            claimId,
            customerEmail: claim.claimantEmail,
            communicationId: newCommunication.id
          }
        });
      }
    }
  }

  async updateClaimPriority(claimId: string, priority: string): Promise<void> {
    await db
      .update(inheritanceClaims)
      .set({ priority, updatedAt: new Date() })
      .where(eq(inheritanceClaims.id, claimId));
  }

  async getClaimById(id: string): Promise<InheritanceClaim | undefined> {
    return this.getClaim(id); // Alias for getClaim
  }

  async getUserClaims(userId: string): Promise<InheritanceClaim[]> {
    // Get claims where user is the claimant (by email) or related to their will/consignment
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Build conditions using proper drizzle syntax
    const conditions = [eq(inheritanceClaims.claimantEmail, user.email)];
    
    // Add will-related claims
    const userWills = await db
      .select({ willId: digitalWills.id })
      .from(digitalWills)
      .where(eq(digitalWills.userId, userId));
    
    if (userWills.length > 0) {
      conditions.push(inArray(inheritanceClaims.willId, userWills.map(w => w.willId)));
    }
    
    // Add consignment-related claims
    const userConsignments = await db
      .select({ consignmentId: consignments.id })
      .from(consignments)
      .where(eq(consignments.userId, userId));
    
    if (userConsignments.length > 0) {
      conditions.push(inArray(inheritanceClaims.consignmentId, userConsignments.map(c => c.consignmentId)));
    }
    
    return db
      .select()
      .from(inheritanceClaims)
      .where(or(...conditions))
      .orderBy(desc(inheritanceClaims.createdAt));
  }

  async getUserOwnershipChangeRequests(userId: string): Promise<InheritanceClaim[]> {
    const user = await this.getUser(userId);
    
    return db
      .select()
      .from(inheritanceClaims)
      .where(
        and(
          eq(inheritanceClaims.claimType, 'transfer_request'),
          eq(inheritanceClaims.claimantEmail, user?.email || '')
        )
      )
      .orderBy(desc(inheritanceClaims.createdAt));
  }

  async canUserAccessClaim(userId: string, claimId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const [claim] = await db
      .select()
      .from(inheritanceClaims)
      .where(eq(inheritanceClaims.id, claimId));

    if (!claim) return false;

    // User can access if they are the claimant
    if (claim.claimantEmail === user.email) return true;

    // User can access if it's related to their will
    if (claim.willId) {
      const [will] = await db
        .select()
        .from(digitalWills)
        .where(and(
          eq(digitalWills.id, claim.willId),
          eq(digitalWills.userId, userId)
        ));
      if (will) return true;
    }

    // User can access if it's related to their consignment
    if (claim.consignmentId) {
      const [consignment] = await db
        .select()
        .from(consignments)
        .where(and(
          eq(consignments.id, claim.consignmentId),
          eq(consignments.userId, userId)
        ));
      if (consignment) return true;
    }

    return false;
  }

  // Support ticket operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [created] = await db
      .insert(supportTickets)
      .values(ticket)
      .returning();
    return created;
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getTicketsByStatus(status: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.status, status))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getTicketsByAdmin(adminId: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.assignedTo, adminId))
      .orderBy(desc(supportTickets.lastActivity));
  }

  async updateTicketStatus(id: string, status: string, adminId?: string): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date(),
      lastActivity: new Date()
    };
    
    if (status === 'resolved' && adminId) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = adminId;
    }
    
    await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, id));
  }

  async updateTicketPriority(id: string, priority: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ 
        priority, 
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .where(eq(supportTickets.id, id));
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<void> {
    await db
      .update(supportTickets)
      .set({ 
        ...updates,
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .where(eq(supportTickets.id, id));
  }

  async assignTicketToAdmin(ticketId: string, adminId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ 
        assignedTo: adminId, 
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .where(eq(supportTickets.id, ticketId));
  }

  async escalateTicket(ticketId: string, escalatedBy: string, reason: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ 
        status: 'escalated',
        escalatedBy,
        escalatedAt: new Date(),
        escalationReason: reason,
        priority: 'high',
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .where(eq(supportTickets.id, ticketId));
  }


  async updateTicketActivity(ticketId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ 
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportTickets.id, ticketId));
  }

  // Chat operations
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [saved] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    
    // Update ticket activity if this message is linked to a ticket
    if (message.ticketId) {
      await this.updateTicketActivity(message.ticketId);
      
      // Set first response time if this is an admin response and it's not set yet
      if (!message.isCustomer) {
        const [ticket] = await db
          .select({ firstResponseTime: supportTickets.firstResponseTime })
          .from(supportTickets)
          .where(eq(supportTickets.id, message.ticketId));
        
        if (ticket && !ticket.firstResponseTime) {
          await db
            .update(supportTickets)
            .set({ firstResponseTime: new Date() })
            .where(eq(supportTickets.id, message.ticketId));
        }
      }
    }
    
    return saved;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp));
  }

  async getChatMessagesByTicket(ticketId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.ticketId, ticketId))
      .orderBy(chatMessages.timestamp);
  }

  async markMessagesAsRead(sessionId: string, userId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.sessionId, sessionId),
          eq(chatMessages.userId, userId)
        )
      );
  }

  // Admin notification operations
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [created] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();
    return created;
  }

  async getAdminNotifications(adminId: string): Promise<AdminNotification[]> {
    return db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.adminId, adminId))
      .orderBy(desc(adminNotifications.createdAt));
  }

  async getUnreadNotifications(adminId: string): Promise<AdminNotification[]> {
    return db
      .select()
      .from(adminNotifications)
      .where(
        and(
          eq(adminNotifications.adminId, adminId),
          eq(adminNotifications.isRead, false)
        )
      )
      .orderBy(desc(adminNotifications.createdAt));
  }


  async markAdminNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, notificationId));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, notificationId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db
      .delete(adminNotifications)
      .where(eq(adminNotifications.id, notificationId));
  }

  // Storage plans
  // Account transaction operations
  async createAccountTransaction(transaction: InsertAccountTransaction): Promise<AccountTransaction> {
    const [accountTransaction] = await db
      .insert(accountTransactions)
      .values(transaction)
      .returning();
    return accountTransaction;
  }

  async getUserAccountTransactions(userId: string): Promise<AccountTransaction[]> {
    return db
      .select()
      .from(accountTransactions)
      .where(eq(accountTransactions.userId, userId))
      .orderBy(desc(accountTransactions.createdAt));
  }

  async getUserAccountBalance(userId: string): Promise<number> {
    const transactions = await this.getUserAccountTransactions(userId);
    const balance = transactions.reduce((sum, transaction) => {
      if (transaction.type === 'credit') {
        return sum + parseFloat(transaction.amount);
      } else {
        return sum - parseFloat(transaction.amount);
      }
    }, 0);
    return balance;
  }

  // Gold holding operations
  async createGoldHolding(holding: InsertGoldHolding): Promise<GoldHolding> {
    const [goldHolding] = await db
      .insert(goldHoldings)
      .values(holding)
      .returning();
    return goldHolding;
  }

  async getUserGoldHoldings(userId: string): Promise<GoldHolding[]> {
    return db
      .select()
      .from(goldHoldings)
      .where(eq(goldHoldings.userId, userId))
      .orderBy(desc(goldHoldings.createdAt));
  }

  async getUserGoldBalance(userId: string): Promise<{totalWeight: number; totalValue: number; avgPurity: number; activeItems: number}> {
    const holdings = await this.getUserGoldHoldings(userId);
    
    let totalWeight = 0;
    let totalValue = 0;
    let totalPurityWeight = 0; // for weighted average purity calculation
    let activeItems = 0;

    holdings.forEach(holding => {
      const weight = parseFloat(holding.weight);
      const purity = parseFloat(holding.purity);
      const purchasePrice = parseFloat(holding.purchasePrice || '0');
      
      if (holding.type === 'credit') {
        totalWeight += weight;
        totalValue += purchasePrice;
        totalPurityWeight += (weight * purity);
        activeItems++;
      } else {
        totalWeight -= weight;
        totalValue -= purchasePrice;
        totalPurityWeight -= (weight * purity);
        activeItems = Math.max(0, activeItems - 1);
      }
    });

    const avgPurity = totalWeight > 0 ? totalPurityWeight / totalWeight : 0;

    return {
      totalWeight: Math.max(0, totalWeight),
      totalValue: Math.max(0, totalValue),
      avgPurity: Math.max(0, avgPurity),
      activeItems: Math.max(0, activeItems)
    };
  }

  // Enhanced user management operations
  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async deactivateUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async reactivateUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserActivityLog(userId: string): Promise<any[]> {
    // Combine activity from multiple sources
    const transactions = await db
      .select({
        type: sql`'transaction'`.as('type'),
        action: accountTransactions.type,
        description: accountTransactions.description,
        amount: accountTransactions.amount,
        timestamp: accountTransactions.createdAt,
      })
      .from(accountTransactions)
      .where(eq(accountTransactions.userId, userId))
      .orderBy(desc(accountTransactions.createdAt))
      .limit(50);

    const goldTransactions = await db
      .select({
        type: sql`'gold_transaction'`.as('type'),
        action: goldHoldings.type,
        description: goldHoldings.description,
        weight: goldHoldings.weight,
        purity: goldHoldings.purity,
        timestamp: goldHoldings.createdAt,
      })
      .from(goldHoldings)
      .where(eq(goldHoldings.userId, userId))
      .orderBy(desc(goldHoldings.createdAt))
      .limit(50);

    const consignmentActivity = await db
      .select({
        type: sql`'consignment'`.as('type'),
        action: consignments.status,
        description: consignments.description,
        consignmentNumber: consignments.consignmentNumber,
        timestamp: consignments.createdAt,
      })
      .from(consignments)
      .where(eq(consignments.userId, userId))
      .orderBy(desc(consignments.createdAt))
      .limit(50);

    // Combine and sort all activities
    const allActivities = [...transactions, ...goldTransactions, ...consignmentActivity]
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 100);

    return allActivities;
  }

  // Storage plans implementation
  async getStoragePlans(): Promise<StoragePlan[]> {
    return await db.select().from(storagePlans).where(eq(storagePlans.active, true));
  }

  async getStoragePlan(id: string): Promise<StoragePlan | undefined> {
    const [plan] = await db.select().from(storagePlans).where(eq(storagePlans.id, id));
    return plan;
  }

  // Tracking operations implementation
  async createTrackingUpdate(update: InsertTrackingUpdate): Promise<TrackingUpdate> {
    const [trackingUpdate] = await db
      .insert(trackingUpdates)
      .values(update)
      .returning();
    
    // Update the consignment's current tracking status and location
    await this.updateConsignmentTrackingStatus(
      update.consignmentId,
      update.status,
      update.location || undefined
    );
    
    return trackingUpdate;
  }

  async getTrackingUpdates(consignmentId: string): Promise<TrackingUpdate[]> {
    return await db
      .select()
      .from(trackingUpdates)
      .where(eq(trackingUpdates.consignmentId, consignmentId))
      .orderBy(desc(trackingUpdates.createdAt));
  }

  async getPublicTrackingUpdates(trackingId: string): Promise<TrackingUpdate[]> {
    // First get the consignment by tracking ID
    const consignment = await this.getConsignmentByTrackingId(trackingId);
    if (!consignment) {
      return [];
    }

    // Get only public tracking updates for this consignment
    return await db
      .select()
      .from(trackingUpdates)
      .where(and(
        eq(trackingUpdates.consignmentId, consignment.id),
        eq(trackingUpdates.isPublic, true)
      ))
      .orderBy(desc(trackingUpdates.createdAt));
  }

  async updateConsignmentTrackingStatus(consignmentId: string, status: string, location?: string): Promise<void> {
    const updateData: any = {
      trackingStatus: status,
      updatedAt: new Date()
    };
    
    if (location) {
      updateData.currentLocation = location;
    }
    
    await db
      .update(consignments)
      .set(updateData)
      .where(eq(consignments.id, consignmentId));
  }

  async getConsignmentByTrackingId(trackingId: string): Promise<Consignment | undefined> {
    const [consignment] = await db
      .select()
      .from(consignments)
      .where(eq(consignments.trackingId, trackingId));
    return consignment;
  }

  // Scheduled updates implementation
  async createScheduledUpdate(update: InsertScheduledUpdate): Promise<ScheduledUpdate> {
    const [scheduledUpdate] = await db
      .insert(scheduledUpdates)
      .values(update)
      .returning();
    return scheduledUpdate;
  }

  async getScheduledUpdates(consignmentId: string): Promise<ScheduledUpdate[]> {
    return await db
      .select()
      .from(scheduledUpdates)
      .where(eq(scheduledUpdates.consignmentId, consignmentId))
      .orderBy(desc(scheduledUpdates.scheduledFor));
  }

  async getPendingScheduledUpdates(): Promise<ScheduledUpdate[]> {
    return await db
      .select()
      .from(scheduledUpdates)
      .where(and(
        eq(scheduledUpdates.executed, false),
        sql`${scheduledUpdates.scheduledFor} <= NOW()`
      ))
      .orderBy(scheduledUpdates.scheduledFor);
  }

  async executeScheduledUpdate(updateId: string): Promise<void> {
    await db
      .update(scheduledUpdates)
      .set({
        executed: true,
        executedAt: new Date()
      })
      .where(eq(scheduledUpdates.id, updateId));
  }

  // Customer notifications implementation
  async createCustomerNotification(notification: InsertCustomerNotification): Promise<CustomerNotification> {
    const [customerNotification] = await db
      .insert(customerNotifications)
      .values(notification)
      .returning();
    return customerNotification;
  }

  async getCustomerNotifications(userId: string): Promise<CustomerNotification[]> {
    return await db
      .select()
      .from(customerNotifications)
      .where(eq(customerNotifications.userId, userId))
      .orderBy(desc(customerNotifications.createdAt));
  }

  async markNotificationAsDelivered(notificationId: string): Promise<void> {
    await db
      .update(customerNotifications)
      .set({
        delivered: true,
        deliveredAt: new Date()
      })
      .where(eq(customerNotifications.id, notificationId));
  }

  async markCustomerNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(customerNotifications)
      .set({
        readAt: new Date()
      })
      .where(eq(customerNotifications.id, notificationId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerNotifications)
      .where(and(
        eq(customerNotifications.userId, userId),
        isNull(customerNotifications.readAt)
      ));
    return result[0]?.count || 0;
  }

  async getNotificationSummary(userId: string): Promise<{total: number; unread: number; urgent: number; byType: Record<string, number>}> {
    const notifications = await this.getCustomerNotifications(userId);
    
    const summary = {
      total: notifications.length,
      unread: notifications.filter(n => !n.readAt).length,
      urgent: notifications.filter(n => n.type === 'urgent_notification' || n.title.toLowerCase().includes('urgent')).length,
      byType: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      summary.byType[notification.type] = (summary.byType[notification.type] || 0) + 1;
    });

    return summary;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(customerNotifications)
      .set({
        readAt: new Date()
      })
      .where(and(
        eq(customerNotifications.userId, userId),
        isNull(customerNotifications.readAt)
      ));
  }

  async respondToNotification(notificationId: string, userId: string, response: string, actionType?: string): Promise<void> {
    // Get the notification to understand its context
    const [notification] = await db
      .select()
      .from(customerNotifications)
      .where(eq(customerNotifications.id, notificationId));

    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or access denied");
    }

    // Mark notification as read
    await this.markCustomerNotificationAsRead(notificationId);

    // If it's a claim response, add the customer response to the claim communication log
    if (notification.type === 'claim_response' && notification.metadata?.claimId) {
      await this.addClaimCommunication(notification.metadata.claimId, response, false);
    }

    // If it's related to a consignment, add to consignment events
    if (notification.consignmentId && actionType) {
      await this.addConsignmentEvent({
        consignmentId: notification.consignmentId,
        eventType: 'customer_response',
        description: `Customer responded to notification: ${response}`,
        actor: userId,
        metadata: { 
          notificationId, 
          actionType, 
          originalNotificationTitle: notification.title 
        }
      });
    }

    // Create admin notification about customer response
    const allAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of allAdmins) {
      await this.createAdminNotification({
        adminId: admin.id,
        type: 'customer_response',
        title: 'Customer Response to Notification',
        message: `Customer responded to "${notification.title}": ${response}`,
        priority: 'normal',
        actionRequired: true,
        metadata: { 
          originalNotificationId: notificationId,
          customerResponse: response,
          actionType: actionType || 'general_response',
          consignmentId: notification.consignmentId,
          claimId: notification.metadata?.claimId
        }
      });
    }
  }

  // Additional support ticket functions
  async getUserSupportTickets(customerEmail: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.customerEmail, customerEmail))
      .orderBy(desc(supportTickets.createdAt));
  }

  async updateTicketLastActivity(ticketId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ lastActivity: new Date() })
      .where(eq(supportTickets.id, ticketId));
  }

  async resolveTicket(ticketId: string, adminId: string, resolutionNotes: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: adminId,
        resolutionNotes,
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .where(eq(supportTickets.id, ticketId));
  }

  // Knowledge base operations
  async createKnowledgeBaseArticle(article: InsertKnowledgeBaseArticle): Promise<KnowledgeBaseArticle> {
    try {
      const [newArticle] = await db.insert(knowledgeBaseArticles).values(article).returning();
      return newArticle;
    } catch (error) {
      console.error('Failed to create knowledge base article:', error);
      throw error;
    }
  }

  async getKnowledgeBaseArticles(category?: string): Promise<KnowledgeBaseArticle[]> {
    try {
      const query = db.select().from(knowledgeBaseArticles).where(eq(knowledgeBaseArticles.isPublished, true));
      if (category) {
        return await query.where(eq(knowledgeBaseArticles.category, category)).orderBy(desc(knowledgeBaseArticles.createdAt));
      }
      return await query.orderBy(desc(knowledgeBaseArticles.createdAt));
    } catch (error) {
      console.error('Failed to get knowledge base articles:', error);
      throw error;
    }
  }

  async getKnowledgeBaseArticle(id: string): Promise<KnowledgeBaseArticle | undefined> {
    try {
      const [article] = await db.select().from(knowledgeBaseArticles).where(eq(knowledgeBaseArticles.id, id));
      return article;
    } catch (error) {
      console.error('Failed to get knowledge base article:', error);
      throw error;
    }
  }

  async searchKnowledgeBase(searchTerm: string): Promise<KnowledgeBaseArticle[]> {
    try {
      return await db.select().from(knowledgeBaseArticles)
        .where(and(
          eq(knowledgeBaseArticles.isPublished, true),
          or(
            sql`${knowledgeBaseArticles.title} ILIKE ${`%${searchTerm}%`}`,
            sql`${knowledgeBaseArticles.content} ILIKE ${`%${searchTerm}%`}`,
            sql`${knowledgeBaseArticles.excerpt} ILIKE ${`%${searchTerm}%`}`
          )
        ))
        .orderBy(desc(knowledgeBaseArticles.createdAt));
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      throw error;
    }
  }

  async voteOnArticle(vote: InsertKnowledgeBaseVote): Promise<void> {
    try {
      await db.insert(knowledgeBaseVotes).values(vote);
      
      const votes = await db.select().from(knowledgeBaseVotes).where(eq(knowledgeBaseVotes.articleId, vote.articleId));
      const helpfulCount = votes.filter(v => v.isHelpful).length;
      const notHelpfulCount = votes.filter(v => !v.isHelpful).length;

      await db.update(knowledgeBaseArticles)
        .set({ 
          helpfulVotes: helpfulCount,
          notHelpfulVotes: notHelpfulCount
        })
        .where(eq(knowledgeBaseArticles.id, vote.articleId));
    } catch (error) {
      console.error('Failed to vote on article:', error);
      throw error;
    }
  }

  async incrementArticleView(articleId: string): Promise<void> {
    try {
      await db.update(knowledgeBaseArticles)
        .set({ viewCount: sql`${knowledgeBaseArticles.viewCount} + 1` })
        .where(eq(knowledgeBaseArticles.id, articleId));
    } catch (error) {
      console.error('Failed to increment article view:', error);
      throw error;
    }
  }

  async updateKnowledgeBaseArticle(id: string, updates: Partial<KnowledgeBaseArticle>): Promise<void> {
    try {
      await db.update(knowledgeBaseArticles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(knowledgeBaseArticles.id, id));
    } catch (error) {
      console.error('Failed to update knowledge base article:', error);
      throw error;
    }
  }

  async createSupportSession(session: InsertSupportSession): Promise<SupportSession> {
    try {
      const [newSession] = await db.insert(supportSessions).values(session).returning();
      return newSession;
    } catch (error) {
      console.error('Failed to create support session:', error);
      throw error;
    }
  }

  async getSupportSession(id: string): Promise<SupportSession | undefined> {
    try {
      const [session] = await db.select().from(supportSessions).where(eq(supportSessions.id, id));
      return session;
    } catch (error) {
      console.error('Failed to get support session:', error);
      throw error;
    }
  }

  async getActiveSupportSessions(): Promise<SupportSession[]> {
    try {
      return await db.select().from(supportSessions)
        .where(eq(supportSessions.status, 'active'))
        .orderBy(desc(supportSessions.startedAt));
    } catch (error) {
      console.error('Failed to get active support sessions:', error);
      throw error;
    }
  }

  async getUserSupportSessions(userId: string): Promise<SupportSession[]> {
    try {
      return await db.select().from(supportSessions)
        .where(eq(supportSessions.customerId, userId))
        .orderBy(desc(supportSessions.startedAt));
    } catch (error) {
      console.error('Failed to get user support sessions:', error);
      throw error;
    }
  }

  async endSupportSession(sessionId: string): Promise<void> {
    try {
      await db.update(supportSessions)
        .set({ 
          status: 'ended', 
          endedAt: new Date() 
        })
        .where(eq(supportSessions.id, sessionId));
    } catch (error) {
      console.error('Failed to end support session:', error);
      throw error;
    }
  }

  async assignSessionToAdmin(sessionId: string, adminId: string): Promise<void> {
    try {
      await db.update(supportSessions)
        .set({ assignedTo: adminId })
        .where(eq(supportSessions.id, sessionId));
    } catch (error) {
      console.error('Failed to assign session to admin:', error);
      throw error;
    }
  }

  async escalateSessionToTicket(sessionId: string, ticketData: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const [ticket] = await db.insert(supportTickets).values({
        ...ticketData,
        chatSessionId: sessionId
      }).returning();

      await db.update(supportSessions)
        .set({ 
          ticketId: ticket.id,
          status: 'transferred'
        })
        .where(eq(supportSessions.id, sessionId));

      return ticket;
    } catch (error) {
      console.error('Failed to escalate session to ticket:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
