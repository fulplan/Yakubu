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
import crypto from "crypto";

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
      // Generate tracking ID
      const trackingId = crypto.randomUUID();
      
      const consignmentData = insertConsignmentSchema.parse({
        ...req.body,
        userId,
        trackingId,
        weight: req.body.weight.toString(),
        purity: req.body.purity.toString(),
        estimatedValue: req.body.estimatedValue.toString(),
        insuranceEnabled: req.body.insuranceEnabled === 'true' || req.body.insuranceEnabled === true,
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

  // Admin Consignment Management Routes
  app.get('/api/admin/consignments', isAdmin, async (req, res) => {
    try {
      const consignments = await storage.getAllConsignments();
      res.json(consignments);
    } catch (error) {
      console.error("Error fetching all consignments:", error);
      res.status(500).json({ message: "Failed to fetch consignments" });
    }
  });

  app.patch('/api/admin/consignments/:id/status', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      await storage.updateConsignmentStatus(id, status);
      
      // Add status change event
      await storage.addConsignmentEvent({
        consignmentId: id,
        eventType: 'status_changed',
        description: `Status updated to ${status} by admin`,
        actor: req.user.id,
        metadata: { newStatus: status, adminNotes },
      });

      res.json({ message: "Consignment status updated successfully" });
    } catch (error) {
      console.error("Error updating consignment status:", error);
      res.status(500).json({ message: "Failed to update consignment status" });
    }
  });

  app.post('/api/admin/consignments/:id/verify', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { verifiedWeight, verifiedPurity, adminNotes, addToAccount } = req.body;
      
      await storage.verifyConsignment(id, verifiedWeight, verifiedPurity, adminNotes, req.user.id);
      
      // If requested, add gold to customer account
      if (addToAccount) {
        const consignment = await storage.getConsignment(id);
        if (consignment) {
          await storage.createGoldHolding({
            userId: consignment.userId,
            type: 'credit',
            weight: verifiedWeight.toString(),
            purity: verifiedPurity.toString(),
            description: `Gold added from verified consignment ${consignment.consignmentNumber}`,
            performedBy: req.user.id,
          });
        }
      }

      res.json({ message: "Consignment verified successfully" });
    } catch (error) {
      console.error("Error verifying consignment:", error);
      res.status(500).json({ message: "Failed to verify consignment" });
    }
  });

  // Enhanced Admin Claims Management Routes
  app.get('/api/admin/claims', isAdmin, async (req, res) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching all claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.patch('/api/admin/claims/:id/assign', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      
      await storage.assignClaimToAdmin(id, adminId || req.user.id);
      res.json({ message: "Claim assigned successfully" });
    } catch (error) {
      console.error("Error assigning claim:", error);
      res.status(500).json({ message: "Failed to assign claim" });
    }
  });

  app.post('/api/admin/claims/:id/communication', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      await storage.addClaimCommunication(id, message, true, req.user.id);
      res.json({ message: "Communication added successfully" });
    } catch (error) {
      console.error("Error adding communication:", error);
      res.status(500).json({ message: "Failed to add communication" });
    }
  });

  app.patch('/api/admin/claims/:id/priority', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      
      await storage.updateClaimPriority(id, priority);
      res.json({ message: "Claim priority updated successfully" });
    } catch (error) {
      console.error("Error updating claim priority:", error);
      res.status(500).json({ message: "Failed to update claim priority" });
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
  app.post('/api/admin/users/:id/credit', isAdmin, async (req: any, res) => {
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

  app.post('/api/admin/users/:id/debit', isAdmin, async (req: any, res) => {
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
  app.post('/api/admin/users/:id/credit-gold', isAdmin, async (req: any, res) => {
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

  app.post('/api/admin/users/:id/debit-gold', isAdmin, async (req: any, res) => {
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

  // Enhanced user management features
  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      await storage.updateUserRole(id, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/admin/users/:id/deactivate', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deactivateUser(id);
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  app.patch('/api/admin/users/:id/reactivate', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.reactivateUser(id);
      res.json({ message: "User reactivated successfully" });
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ message: "Failed to reactivate user" });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      await storage.resetUserPassword(id, newPassword);
      res.json({ message: "User password reset successfully" });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  app.get('/api/admin/users/:id/activity', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const activityLog = await storage.getUserActivityLog(id);
      res.json(activityLog);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
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

  // Customer-facing APIs for notifications and support
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const notifications = await storage.getCustomerNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching customer notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markCustomerNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.get('/api/support-tickets/mine', isAuthenticated, async (req: any, res) => {
    try {
      const tickets = await storage.getUserSupportTickets(req.user.email);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

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
      const { message, ticketId, userId, isCustomer = true, messageType = 'text' } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      const chatMessage = await storage.saveChatMessage({
        sessionId: req.params.sessionId,
        ticketId: ticketId || null,
        userId: userId || null,
        isCustomer,
        message,
        messageType,
        attachmentUrls: [],
      });

      // Update ticket last activity if this is for a ticket
      if (ticketId) {
        await storage.updateTicketLastActivity(ticketId);
        
        // Create admin notification for customer responses
        if (isCustomer) {
          const ticket = await storage.getSupportTicket(ticketId);
          if (ticket && ticket.assignedTo) {
            await storage.createAdminNotification({
              adminId: ticket.assignedTo,
              type: 'customer_response',
              title: 'Customer Response',
              message: `Customer replied to ticket: ${ticket.subject}`,
              ticketId: ticketId,
              priority: 'normal',
              actionRequired: true,
            });
          }
        }
      }

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Chat APIs
  // Support ticket routes
  app.get('/api/admin/support-tickets', isAdmin, async (req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get('/api/admin/support-tickets/status/:status', isAdmin, async (req, res) => {
    try {
      const tickets = await storage.getTicketsByStatus(req.params.status);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets by status:", error);
      res.status(500).json({ message: "Failed to fetch tickets by status" });
    }
  });

  app.get('/api/admin/support-tickets/assigned/:adminId', isAdmin, async (req, res) => {
    try {
      const tickets = await storage.getTicketsByAdmin(req.params.adminId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching assigned tickets:", error);
      res.status(500).json({ message: "Failed to fetch assigned tickets" });
    }
  });

  app.post('/api/support-tickets', async (req, res) => {
    try {
      const { customerEmail, customerName, subject, description, category, priority = 'medium' } = req.body;
      
      if (!customerEmail || !customerName || !subject || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const ticket = await storage.createSupportTicket({
        customerEmail,
        customerName,
        subject,
        description,
        category: category || 'general',
        priority,
        chatSessionId: crypto.randomUUID(),
      });

      // Create notification for all admins
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(user => user.role === 'admin');
      
      for (const admin of adminUsers) {
        await storage.createAdminNotification({
          adminId: admin.id,
          type: 'new_ticket',
          title: 'New Support Ticket',
          message: `New ${priority} priority ticket: ${subject}`,
          ticketId: ticket.id,
          priority: priority === 'urgent' ? 'urgent' : 'normal',
          actionRequired: true,
        });
      }

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.patch('/api/admin/support-tickets/:id/status', isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      await storage.updateTicketStatus(req.params.id, status, req.user.id);
      
      // Create notification if ticket is resolved
      if (status === 'resolved') {
        const ticket = await storage.getSupportTicket(req.params.id);
        if (ticket && ticket.customerId) {
          await storage.createAdminNotification({
            adminId: req.user.id,
            type: 'resolution',
            title: 'Ticket Resolved',
            message: `Ticket "${ticket.subject}" has been resolved`,
            ticketId: ticket.id,
            priority: 'normal',
            actionRequired: false,
          });
        }
      }
      
      res.json({ message: "Ticket status updated successfully" });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  app.patch('/api/admin/support-tickets/:id/priority', isAdmin, async (req, res) => {
    try {
      const { priority } = req.body;
      await storage.updateTicketPriority(req.params.id, priority);
      res.json({ message: "Ticket priority updated successfully" });
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      res.status(500).json({ message: "Failed to update ticket priority" });
    }
  });

  app.patch('/api/admin/support-tickets/:id/assign', isAdmin, async (req: any, res) => {
    try {
      const { adminId } = req.body;
      await storage.assignTicketToAdmin(req.params.id, adminId || req.user.id);
      
      // Create notification for assigned admin
      if (adminId && adminId !== req.user.id) {
        const ticket = await storage.getSupportTicket(req.params.id);
        if (ticket) {
          await storage.createAdminNotification({
            adminId,
            type: 'assignment',
            title: 'Ticket Assigned',
            message: `You have been assigned ticket: ${ticket.subject}`,
            ticketId: ticket.id,
            priority: ticket.priority === 'urgent' ? 'urgent' : 'normal',
            actionRequired: true,
          });
        }
      }
      
      res.json({ message: "Ticket assigned successfully" });
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });

  app.post('/api/admin/support-tickets/:id/escalate', isAdmin, async (req: any, res) => {
    try {
      const { reason } = req.body;
      await storage.escalateTicket(req.params.id, req.user.id, reason);
      
      // Create escalation notifications for all admins
      const ticket = await storage.getSupportTicket(req.params.id);
      if (ticket) {
        const admins = await storage.getAllUsers();
        const adminUsers = admins.filter(user => user.role === 'admin' && user.id !== req.user.id);
        
        for (const admin of adminUsers) {
          await storage.createAdminNotification({
            adminId: admin.id,
            type: 'escalation',
            title: 'Ticket Escalated',
            message: `Ticket "${ticket.subject}" has been escalated: ${reason}`,
            ticketId: ticket.id,
            priority: 'urgent',
            actionRequired: true,
          });
        }
      }
      
      res.json({ message: "Ticket escalated successfully" });
    } catch (error) {
      console.error("Error escalating ticket:", error);
      res.status(500).json({ message: "Failed to escalate ticket" });
    }
  });

  app.post('/api/admin/support-tickets/:id/resolve', isAdmin, async (req: any, res) => {
    try {
      const { resolutionNotes } = req.body;
      await storage.resolveTicket(req.params.id, req.user.id, resolutionNotes);
      res.json({ message: "Ticket resolved successfully" });
    } catch (error) {
      console.error("Error resolving ticket:", error);
      res.status(500).json({ message: "Failed to resolve ticket" });
    }
  });

  // Admin notification routes
  app.get('/api/admin/notifications', isAdmin, async (req: any, res) => {
    try {
      const notifications = await storage.getAdminNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/admin/notifications/unread', isAdmin, async (req: any, res) => {
    try {
      const notifications = await storage.getUnreadNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.patch('/api/admin/notifications/:id/read', isAdmin, async (req, res) => {
    try {
      await storage.markAdminNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/admin/notifications/read-all', isAdmin, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

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
        ticketId: req.body.ticketId,
        userId: req.body.userId,
        isCustomer: req.body.isCustomer,
        message: req.body.message,
        messageType: req.body.messageType || 'text',
        attachmentUrls: req.body.attachmentUrls,
      });
      
      // Create notification for admins when customer sends message
      if (req.body.isCustomer && req.body.ticketId) {
        const ticket = await storage.getSupportTicket(req.body.ticketId);
        if (ticket) {
          const targetAdminId = ticket.assignedTo;
          if (targetAdminId) {
            await storage.createAdminNotification({
              adminId: targetAdminId,
              type: 'customer_response',
              title: 'Customer Response',
              message: `New message from ${ticket.customerName}`,
              ticketId: ticket.id,
              priority: 'normal',
              actionRequired: true,
            });
          }
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error saving chat message:", error);
      res.status(500).json({ message: "Failed to save chat message" });
    }
  });

  app.get('/api/admin/chat/ticket/:ticketId', isAdmin, async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByTicket(req.params.ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket chat messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket chat messages" });
    }
  });

  // Tracking API Routes

  // Public tracking (no auth required)
  app.get('/api/tracking/:trackingId', async (req, res) => {
    try {
      const trackingId = req.params.trackingId;
      const updates = await storage.getPublicTrackingUpdates(trackingId);
      const consignment = await storage.getConsignmentByTrackingId(trackingId);
      
      if (!consignment) {
        return res.status(404).json({ message: "Tracking ID not found" });
      }

      res.json({
        trackingId: consignment.trackingId,
        status: consignment.trackingStatus,
        location: consignment.currentLocation,
        updates: updates.map(update => ({
          status: update.status,
          description: update.description,
          location: update.location,
          timestamp: update.createdAt
        }))
      });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      res.status(500).json({ message: "Failed to fetch tracking info" });
    }
  });

  // Admin tracking management
  app.get('/api/admin/tracking/consignments', isAdmin, async (req, res) => {
    try {
      const consignments = await storage.getAllConsignments();
      res.json(consignments);
    } catch (error) {
      console.error("Error fetching tracking consignments:", error);
      res.status(500).json({ message: "Failed to fetch consignments for tracking" });
    }
  });

  app.post('/api/admin/tracking/:consignmentId/update', isAdmin, async (req: any, res) => {
    try {
      const consignmentId = req.params.consignmentId;
      const { status, location, description, isPublic = true, notifyCustomer = true } = req.body;
      
      const trackingUpdate = await storage.createTrackingUpdate({
        consignmentId,
        status,
        location,
        description,
        adminId: req.user.id,
        isPublic,
        customerNotified: false,
        metadata: {}
      });

      // Send customer notification if requested
      if (notifyCustomer) {
        const consignment = await storage.getConsignment(consignmentId);
        if (consignment) {
          const statusEmojis = {
            received: '📦',
            in_vault: '🏦',
            under_review: '🔍',
            in_transit: '🚚',
            delivered: '✅',
            rejected: '❌'
          };
          
          const emoji = statusEmojis[status as keyof typeof statusEmojis] || '📋';
          const title = `Consignment Status Update`;
          const message = `${emoji} Your consignment #${consignment.trackingId} is now ${status.replace('_', ' ')}.`;
          
          await storage.createCustomerNotification({
            userId: consignment.userId,
            consignmentId,
            trackingUpdateId: trackingUpdate.id,
            type: 'status_update',
            title,
            message: `${message} ${description ? description : ''}`,
            notificationMethod: 'email',
            delivered: false
          });
        }
      }

      res.status(201).json(trackingUpdate);
    } catch (error) {
      console.error("Error creating tracking update:", error);
      res.status(500).json({ message: "Failed to create tracking update" });
    }
  });

  app.get('/api/admin/tracking/:consignmentId/updates', isAdmin, async (req, res) => {
    try {
      const updates = await storage.getTrackingUpdates(req.params.consignmentId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching tracking updates:", error);
      res.status(500).json({ message: "Failed to fetch tracking updates" });
    }
  });

  // Scheduled updates
  app.post('/api/admin/tracking/:consignmentId/schedule', isAdmin, async (req: any, res) => {
    try {
      const consignmentId = req.params.consignmentId;
      const { scheduledStatus, scheduledLocation, description, scheduledFor, notifyCustomer = true } = req.body;
      
      const scheduledUpdate = await storage.createScheduledUpdate({
        consignmentId,
        scheduledStatus,
        scheduledLocation,
        description,
        scheduledFor: new Date(scheduledFor),
        adminId: req.user.id,
        notifyCustomer,
        executed: false
      });

      res.status(201).json(scheduledUpdate);
    } catch (error) {
      console.error("Error creating scheduled update:", error);
      res.status(500).json({ message: "Failed to create scheduled update" });
    }
  });

  app.get('/api/admin/tracking/:consignmentId/scheduled', isAdmin, async (req, res) => {
    try {
      const updates = await storage.getScheduledUpdates(req.params.consignmentId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching scheduled updates:", error);
      res.status(500).json({ message: "Failed to fetch scheduled updates" });
    }
  });

  // Customer notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const notifications = await storage.getCustomerNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching customer notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markCustomerNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
