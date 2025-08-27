import {
  users,
  consignments,
  consignmentEvents,
  digitalWills,
  beneficiaries,
  inheritanceClaims,
  chatMessages,
  accountTransactions,
  goldHoldings,
  storagePlans,
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
  type ChatMessage,
  type InsertChatMessage,
  type AccountTransaction,
  type InsertAccountTransaction,
  type GoldHolding,
  type InsertGoldHolding,
  type StoragePlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  updateConsignmentStatus(id: string, status: string): Promise<void>;
  
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
  
  // Inheritance claims
  createClaim(claim: InsertClaim): Promise<InheritanceClaim>;
  getClaim(id: string): Promise<InheritanceClaim | undefined>;
  getPendingClaims(): Promise<InheritanceClaim[]>;
  updateClaimStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  
  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  
  // Account transaction operations
  createAccountTransaction(transaction: InsertAccountTransaction): Promise<AccountTransaction>;
  getUserAccountTransactions(userId: string): Promise<AccountTransaction[]>;
  getUserAccountBalance(userId: string): Promise<number>;
  
  // Gold holding operations
  createGoldHolding(holding: InsertGoldHolding): Promise<GoldHolding>;
  getUserGoldHoldings(userId: string): Promise<GoldHolding[]>;
  getUserGoldBalance(userId: string): Promise<{totalWeight: number; totalValue: number; avgPurity: number; activeItems: number}>;
  
  // Storage plans
  getStoragePlans(): Promise<StoragePlan[]>;
  getStoragePlan(id: string): Promise<StoragePlan | undefined>;
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

  // Chat operations
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [saved] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return saved;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp));
  }

  // Storage plans
  async getStoragePlans(): Promise<StoragePlan[]> {
    return db
      .select()
      .from(storagePlans)
      .where(eq(storagePlans.active, true));
  }

  async getStoragePlan(id: string): Promise<StoragePlan | undefined> {
    const [plan] = await db
      .select()
      .from(storagePlans)
      .where(and(eq(storagePlans.id, id), eq(storagePlans.active, true)));
    return plan;
  }
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
}

export const storage = new DatabaseStorage();
