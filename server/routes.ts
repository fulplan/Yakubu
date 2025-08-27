import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { insertConsignmentSchema, insertDigitalWillSchema, insertBeneficiarySchema, insertClaimSchema } from "@shared/schema";
import { goldPriceService } from "./services/goldPrice";
import { generateCertificatePDF } from "./services/pdfGenerator";
import { generateQRCode } from "./services/qrCode";
import { uploadMiddleware } from "./services/fileUpload";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in setupAuth

  // Gold price API
  app.get('/api/gold-prices', async (req, res) => {
    try {
      const prices = await goldPriceService.getCurrentPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching gold prices:", error);
      res.status(500).json({ message: "Failed to fetch gold prices" });
    }
  });

  // Storage plans API
  app.get('/api/storage-plans', async (req, res) => {
    try {
      const plans = await storage.getStoragePlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching storage plans:", error);
      res.status(500).json({ message: "Failed to fetch storage plans" });
    }
  });

  // Consignment APIs
  app.post('/api/consignments', isAuthenticated, uploadMiddleware.array('documents', 10), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const consignmentData = insertConsignmentSchema.parse({
        ...req.body,
        userId,
        weight: parseFloat(req.body.weight),
        purity: parseFloat(req.body.purity),
        estimatedValue: parseFloat(req.body.estimatedValue),
      });

      const consignment = await storage.createConsignment(consignmentData);
      
      // Generate QR code for tracking
      const qrCodeUrl = await generateQRCode(consignment.consignmentNumber);
      
      // Generate certificate PDF
      const certificateUrl = await generateCertificatePDF(consignment, qrCodeUrl);
      
      res.status(201).json({ ...consignment, certificateUrl });
    } catch (error) {
      console.error("Error creating consignment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create consignment" });
    }
  });

  app.get('/api/consignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const consignments = await storage.getUserConsignments(userId);
      res.json(consignments);
    } catch (error) {
      console.error("Error fetching consignments:", error);
      res.status(500).json({ message: "Failed to fetch consignments" });
    }
  });

  app.get('/api/consignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const consignment = await storage.getConsignment(req.params.id);
      
      if (!consignment || consignment.userId !== userId) {
        return res.status(404).json({ message: "Consignment not found" });
      }
      
      res.json(consignment);
    } catch (error) {
      console.error("Error fetching consignment:", error);
      res.status(500).json({ message: "Failed to fetch consignment" });
    }
  });

  // Public tracking API
  app.get('/api/tracking/:consignmentNumber', async (req, res) => {
    try {
      const consignment = await storage.getConsignmentByNumber(req.params.consignmentNumber);
      
      if (!consignment) {
        return res.status(404).json({ message: "Consignment not found" });
      }
      
      const events = await storage.getConsignmentEvents(consignment.id);
      
      res.json({
        consignment: {
          id: consignment.id,
          consignmentNumber: consignment.consignmentNumber,
          description: consignment.description,
          status: consignment.status,
          weight: consignment.weight,
          createdAt: consignment.createdAt,
        },
        events,
      });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      res.status(500).json({ message: "Failed to fetch tracking information" });
    }
  });

  // Digital will APIs
  app.post('/api/digital-wills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const willData = insertDigitalWillSchema.parse({
        ...req.body,
        userId,
      });

      const digitalWill = await storage.createDigitalWill(willData);
      res.status(201).json(digitalWill);
    } catch (error) {
      console.error("Error creating digital will:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create digital will" });
    }
  });

  app.get('/api/digital-wills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const digitalWill = await storage.getUserDigitalWill(userId);
      
      if (!digitalWill) {
        return res.status(404).json({ message: "Digital will not found" });
      }
      
      const beneficiaries = await storage.getWillBeneficiaries(digitalWill.id);
      res.json({ ...digitalWill, beneficiaries });
    } catch (error) {
      console.error("Error fetching digital will:", error);
      res.status(500).json({ message: "Failed to fetch digital will" });
    }
  });

  // Beneficiary APIs
  app.post('/api/beneficiaries', isAuthenticated, async (req: any, res) => {
    try {
      const beneficiaryData = insertBeneficiarySchema.parse(req.body);
      const beneficiary = await storage.addBeneficiary(beneficiaryData);
      res.status(201).json(beneficiary);
    } catch (error) {
      console.error("Error adding beneficiary:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add beneficiary" });
    }
  });

  app.delete('/api/beneficiaries/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBeneficiary(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      res.status(500).json({ message: "Failed to delete beneficiary" });
    }
  });

  // Inheritance claims APIs
  app.post('/api/claims', uploadMiddleware.array('documents', 5), async (req, res) => {
    try {
      const claimData = insertClaimSchema.parse({
        ...req.body,
        documentUrls: req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [],
      });

      const claim = await storage.createClaim(claimData);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create claim" });
    }
  });

  // Admin APIs
  app.get('/api/admin/pending-claims', isAdmin, async (req, res) => {
    try {
      const claims = await storage.getPendingClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching pending claims:", error);
      res.status(500).json({ message: "Failed to fetch pending claims" });
    }
  });

  app.patch('/api/admin/claims/:id/status', isAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      await storage.updateClaimStatus(req.params.id, status, adminNotes);
      res.json({ message: "Claim status updated successfully" });
    } catch (error) {
      console.error("Error updating claim status:", error);
      res.status(500).json({ message: "Failed to update claim status" });
    }
  });

  // Admin User Management Routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = 'user' } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      const salt = crypto.randomBytes(16).toString('hex');
      const buf = await scryptAsync(password, salt, 64) as Buffer;
      const hashedPassword = `${buf.toString('hex')}.${salt}`;

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      // Don't send password back
      const { password: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      // If password is being updated, hash it
      if (updates.password) {
        const crypto = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(crypto.scrypt);
        const salt = crypto.randomBytes(16).toString('hex');
        const buf = await scryptAsync(updates.password, salt, 64) as Buffer;
        updates.password = `${buf.toString('hex')}.${salt}`;
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password back
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Account transaction routes for credit/debit
  app.post('/api/admin/users/:id/credit', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const transaction = await storage.createAccountTransaction({
        userId,
        type: 'credit',
        amount: amount.toString(),
        description: description || 'Account credit by admin',
        performedBy: req.user.id,
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error crediting account:", error);
      res.status(500).json({ message: "Failed to credit account" });
    }
  });

  app.post('/api/admin/users/:id/debit', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const transaction = await storage.createAccountTransaction({
        userId,
        type: 'debit',
        amount: amount.toString(),
        description: description || 'Account debit by admin',
        performedBy: req.user.id,
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error debiting account:", error);
      res.status(500).json({ message: "Failed to debit account" });
    }
  });

  app.get('/api/account/balance', isAuthenticated, async (req: any, res) => {
    try {
      const balance = await storage.getUserAccountBalance(req.user.id);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching account balance:", error);
      res.status(500).json({ message: "Failed to fetch account balance" });
    }
  });

  app.get('/api/account/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const transactions = await storage.getUserAccountTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching account transactions:", error);
      res.status(500).json({ message: "Failed to fetch account transactions" });
    }
  });

  // Gold holding routes for admin gold management
  app.post('/api/admin/users/:id/credit-gold', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { weight, purity, description, purchasePrice } = req.body;
      
      if (!weight || weight <= 0) {
        return res.status(400).json({ message: "Valid weight is required" });
      }
      
      if (!purity || purity <= 0 || purity > 100) {
        return res.status(400).json({ message: "Valid purity (0-100%) is required" });
      }

      const goldHolding = await storage.createGoldHolding({
        userId,
        type: 'credit',
        weight: weight.toString(),
        purity: purity.toString(),
        description: description || 'Gold credit by admin',
        purchasePrice: purchasePrice ? purchasePrice.toString() : null,
        performedBy: req.user.id,
      });

      res.status(201).json(goldHolding);
    } catch (error) {
      console.error("Error crediting gold:", error);
      res.status(500).json({ message: "Failed to credit gold" });
    }
  });

  app.post('/api/admin/users/:id/debit-gold', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { weight, purity, description } = req.body;
      
      if (!weight || weight <= 0) {
        return res.status(400).json({ message: "Valid weight is required" });
      }
      
      if (!purity || purity <= 0 || purity > 100) {
        return res.status(400).json({ message: "Valid purity (0-100%) is required" });
      }

      const goldHolding = await storage.createGoldHolding({
        userId,
        type: 'debit',
        weight: weight.toString(),
        purity: purity.toString(),
        description: description || 'Gold debit by admin',
        purchasePrice: null,
        performedBy: req.user.id,
      });

      res.status(201).json(goldHolding);
    } catch (error) {
      console.error("Error debiting gold:", error);
      res.status(500).json({ message: "Failed to debit gold" });
    }
  });

  app.get('/api/gold/balance', isAuthenticated, async (req: any, res) => {
    try {
      const goldBalance = await storage.getUserGoldBalance(req.user.id);
      res.json(goldBalance);
    } catch (error) {
      console.error("Error fetching gold balance:", error);
      res.status(500).json({ message: "Failed to fetch gold balance" });
    }
  });

  app.get('/api/gold/holdings', isAuthenticated, async (req: any, res) => {
    try {
      const holdings = await storage.getUserGoldHoldings(req.user.id);
      res.json(holdings);
    } catch (error) {
      console.error("Error fetching gold holdings:", error);
      res.status(500).json({ message: "Failed to fetch gold holdings" });
    }
  });

  // Chat APIs
  app.get('/api/chat/:sessionId', async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/:sessionId', async (req, res) => {
    try {
      const message = await storage.saveChatMessage({
        sessionId: req.params.sessionId,
        userId: req.body.userId,
        isCustomer: req.body.isCustomer,
        message: req.body.message,
        attachmentUrls: req.body.attachmentUrls,
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Error saving chat message:", error);
      res.status(500).json({ message: "Failed to save chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
