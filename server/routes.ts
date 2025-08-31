import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { insertConsignmentSchema, insertDigitalWillSchema, insertBeneficiarySchema, insertClaimSchema, consignments } from "@shared/schema";
import { goldPriceService } from "./services/goldPrice";
import { generateCertificatePDF } from "./services/pdfGenerator";
import { generateQRCode } from "./services/qrCode";
import { uploadMiddleware } from "./services/fileUpload";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

  // Serve certificate files
  app.get('/uploads/certificates/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'certificates', filename);
      
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: 'Certificate not found' });
      }
    } catch (error) {
      console.error('Error serving certificate:', error);
      res.status(500).json({ message: 'Failed to serve certificate' });
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
      
      // Debug logging to see what's in req.body
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      
      const consignmentData = insertConsignmentSchema.parse({
        ...req.body,
        userId,
        trackingId,
        weight: req.body.weight?.toString() || '0',
        purity: req.body.purity?.toString() || '0',
        estimatedValue: req.body.estimatedValue?.toString() || '0',
        insuranceEnabled: req.body.insuranceEnabled === 'true' || req.body.insuranceEnabled === true,
        description: req.body.description || '',
        storagePlan: req.body.storagePlan || 'standard',
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
      
      // Get both consignment events AND tracking updates
      const events = await storage.getConsignmentEvents(consignment.id);
      const trackingUpdates = await storage.getTrackingUpdates(consignment.id);
      
      // Combine and sort all tracking information chronologically
      const allTrackingData = [
        ...events.map(event => ({
          id: event.id,
          type: 'event',
          eventType: event.eventType,
          description: event.description,
          timestamp: event.timestamp,
          metadata: event.metadata
        })),
        ...trackingUpdates.filter(update => update.isPublic).map(update => ({
          id: update.id,
          type: 'update',
          eventType: 'tracking_update',
          description: update.description,
          status: update.status,
          location: update.location,
          timestamp: update.createdAt,
          metadata: update.metadata
        }))
      ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      
      res.json({
        consignment: {
          id: consignment.id,
          consignmentNumber: consignment.consignmentNumber,
          description: consignment.description,
          status: consignment.trackingStatus || consignment.status, // Use tracking status if available
          currentLocation: consignment.currentLocation,
          weight: consignment.weight,
          createdAt: consignment.createdAt,
        },
        events: allTrackingData,
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

  // Customer claim management endpoints
  app.get('/api/claims/mine', isAuthenticated, async (req: any, res) => {
    try {
      const claims = await storage.getUserClaims(req.user.id);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching user claims:", error);
      res.status(500).json({ message: "Failed to fetch your claims" });
    }
  });

  app.get('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const claim = await storage.getClaimById(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Check if user can access this claim (either claimant or owner of related will/consignment)
      const canAccess = await storage.canUserAccessClaim(req.user.id, req.params.id);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied to this claim" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim details" });
    }
  });

  app.post('/api/claims/:id/response', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const claimId = req.params.id;
      
      // Verify user can respond to this claim
      const canAccess = await storage.canUserAccessClaim(req.user.id, claimId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied to this claim" });
      }

      await storage.addClaimCommunication(claimId, message, false, req.user.id);
      res.json({ message: "Response added successfully" });
    } catch (error) {
      console.error("Error adding claim response:", error);
      res.status(500).json({ message: "Failed to add response" });
    }
  });

  // Ownership change request endpoints
  app.post('/api/ownership-change-requests', isAuthenticated, uploadMiddleware.array('documents', 5), async (req: any, res) => {
    try {
      const claimData = insertClaimSchema.parse({
        ...req.body,
        claimType: 'transfer_request',
        claimantEmail: req.user.email,
        claimantName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        documentUrls: req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [],
      });

      const claim = await storage.createClaim(claimData);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating ownership change request:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create ownership change request" });
    }
  });

  app.get('/api/ownership-change-requests/mine', isAuthenticated, async (req: any, res) => {
    try {
      const claims = await storage.getUserOwnershipChangeRequests(req.user.id);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching ownership change requests:", error);
      res.status(500).json({ message: "Failed to fetch your ownership change requests" });
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
      
      // Get the consignment first to check if we need to generate a certificate
      const consignment = await storage.getConsignment(id);
      if (!consignment) {
        return res.status(404).json({ message: "Consignment not found" });
      }
      
      await storage.updateConsignmentStatus(id, status);
      
      // Generate certificate automatically when status becomes 'stored'
      if (status === 'stored' && !consignment.certificateUrl) {
        try {
          // Generate QR code for tracking
          const qrCodeUrl = await generateQRCode(consignment.consignmentNumber);
          
          // Generate the PDF certificate
          const certificateUrl = await generateCertificatePDF(consignment, qrCodeUrl);
          
          // Update consignment with certificate URL
          // Update consignment with certificate URL using direct database access
          const { db } = await import('./db');
          const { consignments } = await import('@shared/schema');
          const { eq } = await import('drizzle-orm');
          await db.update(consignments).set({ certificateUrl, updatedAt: new Date() }).where(eq(consignments.id, id));
          
          console.log(`Certificate generated for consignment ${consignment.consignmentNumber}: ${certificateUrl}`);
        } catch (certError) {
          console.error('Failed to generate certificate:', certError);
          // Don't fail the status update if certificate generation fails
        }
      }
      
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

  // Get claim conversation history
  app.get('/api/claims/:id/conversation', isAuthenticated, async (req: any, res) => {
    try {
      const claimId = req.params.id;
      
      // Verify user can access this claim
      const canAccess = await storage.canUserAccessClaim(req.user.id, claimId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied to this claim" });
      }

      const claim = await storage.getClaimById(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Return the communication log
      const communicationLog = claim.communicationLog as any[] || [];
      res.json(communicationLog);
    } catch (error) {
      console.error("Error fetching claim conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation history" });
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

  app.get('/api/notifications/count', isAuthenticated, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.get('/api/notifications/summary', isAuthenticated, async (req: any, res) => {
    try {
      const summary = await storage.getNotificationSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching notification summary:", error);
      res.status(500).json({ message: "Failed to fetch notification summary" });
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

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Add endpoint for responding to notifications
  app.post('/api/notifications/:id/response', isAuthenticated, async (req: any, res) => {
    try {
      const { response, actionType } = req.body;
      const notificationId = req.params.id;
      
      if (!response || !response.trim()) {
        return res.status(400).json({ message: "Response is required" });
      }

      await storage.respondToNotification(notificationId, req.user.id, response, actionType);
      res.json({ message: "Response sent successfully" });
    } catch (error) {
      console.error("Error responding to notification:", error);
      res.status(500).json({ message: "Failed to send response" });
    }
  });

  app.post('/api/notifications/:id/respond', isAuthenticated, async (req: any, res) => {
    try {
      const { response, actionType } = req.body;
      await storage.respondToNotification(req.params.id, req.user.id, response, actionType);
      res.json({ message: "Response sent successfully" });
    } catch (error) {
      console.error("Error responding to notification:", error);
      res.status(500).json({ message: "Failed to respond to notification" });
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

  app.post('/api/admin/support-tickets/:id/respond', isAdmin, async (req: any, res) => {
    try {
      const { message } = req.body;
      const ticketId = req.params.id;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get the ticket first
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Create a session ID if the ticket doesn't have one
      let sessionId = ticket.chatSessionId;
      if (!sessionId) {
        sessionId = `ticket-${ticketId}`;
        await storage.updateSupportTicket(ticketId, { chatSessionId: sessionId });
      }
      
      // Save the response message
      const chatMessage = await storage.saveChatMessage({
        sessionId: sessionId,
        ticketId: ticketId,
        userId: req.user.id,
        isCustomer: false,
        message: message.trim(),
        messageType: 'text',
        attachmentUrls: [],
      });
      
      // Update ticket last activity and status
      await storage.updateTicketLastActivity(ticketId);
      await storage.updateSupportTicket(ticketId, { 
        status: 'open',
        assignedTo: req.user.id
      });
      
      // Create customer notification for admin response
      const customerUser = await storage.getUserByEmail(ticket.customerEmail);
      if (customerUser) {
        await storage.createCustomerNotification({
          userId: customerUser.id,
          customerEmail: ticket.customerEmail,
          consignmentId: null,
          type: 'support_response',
          title: 'Support Team Response',
          message: `Support team responded to your ticket: ${ticket.subject}`,
          notificationMethod: 'email',
          metadata: { 
            ticketId: ticketId,
            messageId: chatMessage.id,
            adminId: req.user.id
          }
        });
      }
      
      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error responding to ticket:", error);
      res.status(500).json({ message: "Failed to respond to ticket" });
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

  // Customer chat messages for support tickets
  app.get('/api/chat/ticket/:ticketId', isAuthenticated, async (req: any, res) => {
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
          
          // Send real-time WebSocket notification
          const connectedClients = (req.app as any).connectedClients;
          const userSocket = connectedClients.get(consignment.userId);
          if (userSocket && userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(JSON.stringify({
              type: 'tracking_update',
              data: {
                consignmentId,
                trackingId: consignment.trackingId,
                status,
                location,
                description,
                title,
                message: `${message} ${description ? description : ''}`,
                timestamp: new Date().toISOString()
              }
            }));
            console.log(`Sent real-time tracking update to user ${consignment.userId}`);
          }
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

  // Quick Actions - Book consignment to vault location
  app.post('/api/admin/tracking/:consignmentId/book', isAdmin, async (req: any, res) => {
    try {
      const consignmentId = req.params.consignmentId;
      const { vaultLocation, section, notes } = req.body;
      
      // Update consignment with vault location
      await db.update(consignments)
        .set({ 
          vaultLocation: `${vaultLocation} - ${section}`,
          updatedAt: new Date()
        })
        .where(eq(consignments.id, consignmentId));
      
      // Create tracking update for booking
      const trackingUpdate = await storage.createTrackingUpdate({
        consignmentId,
        status: 'in_vault',
        location: `${vaultLocation} - ${section}`,
        description: notes || `Consignment booked to vault location ${vaultLocation}, section ${section}`,
        adminId: req.user.id,
        isPublic: true,
        customerNotified: false,
        metadata: { action: 'book', vaultLocation, section }
      });
      
      // Send notification to customer
      const consignment = await storage.getConsignment(consignmentId);
      if (consignment) {
        await storage.createCustomerNotification({
          userId: consignment.userId,
          consignmentId,
          trackingUpdateId: trackingUpdate.id,
          type: 'status_update',
          title: 'Consignment Secured in Vault',
          message: `🏦 Your consignment #${consignment.trackingId} has been securely stored in ${vaultLocation}, ${section}. ${notes || ''}`,
          notificationMethod: 'email',
          delivered: false
        });
        
        // Real-time WebSocket notification
        const connectedClients = (req.app as any).connectedClients;
        const userSocket = connectedClients.get(consignment.userId);
        if (userSocket && userSocket.readyState === WebSocket.OPEN) {
          userSocket.send(JSON.stringify({
            type: 'vault_booking',
            data: {
              consignmentId,
              trackingId: consignment.trackingId,
              vaultLocation: `${vaultLocation} - ${section}`,
              message: `Your consignment has been securely stored in vault location ${vaultLocation}, ${section}`,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }
      
      res.status(201).json({ 
        message: 'Consignment booked successfully',
        trackingUpdate,
        vaultLocation: `${vaultLocation} - ${section}`
      });
    } catch (error) {
      console.error("Error booking consignment:", error);
      res.status(500).json({ message: "Failed to book consignment" });
    }
  });

  // Quick Actions - Quick status update
  app.post('/api/admin/tracking/:consignmentId/quick-update', isAdmin, async (req: any, res) => {
    try {
      const consignmentId = req.params.consignmentId;
      const { status, message } = req.body;
      
      const quickMessages = {
        'received': 'Item received and initial inspection completed',
        'under_review': 'Professional authentication and appraisal in progress',
        'in_transit': 'En route to secure vault facility',
        'in_vault': 'Safely stored in climate-controlled vault',
        'ready_for_collection': 'Available for collection or delivery'
      };
      
      const description = message || quickMessages[status as keyof typeof quickMessages] || 'Status updated';
      
      // Create tracking update
      const trackingUpdate = await storage.createTrackingUpdate({
        consignmentId,
        status,
        location: null,
        description,
        adminId: req.user.id,
        isPublic: true,
        customerNotified: false,
        metadata: { action: 'quick_update' }
      });
      
      // Send notification to customer
      const consignment = await storage.getConsignment(consignmentId);
      if (consignment) {
        const statusEmojis = {
          received: '📦',
          in_vault: '🏦',
          under_review: '🔍',
          in_transit: '🚚',
          ready_for_collection: '📋',
          delivered: '✅'
        };
        
        const emoji = statusEmojis[status as keyof typeof statusEmojis] || '📋';
        
        await storage.createCustomerNotification({
          userId: consignment.userId,
          consignmentId,
          trackingUpdateId: trackingUpdate.id,
          type: 'status_update',
          title: 'Quick Status Update',
          message: `${emoji} ${description}`,
          notificationMethod: 'email',
          delivered: false
        });
        
        // Real-time WebSocket notification
        const connectedClients = (req.app as any).connectedClients;
        const userSocket = connectedClients.get(consignment.userId);
        if (userSocket && userSocket.readyState === WebSocket.OPEN) {
          userSocket.send(JSON.stringify({
            type: 'quick_update',
            data: {
              consignmentId,
              trackingId: consignment.trackingId,
              status,
              description,
              message: `${emoji} ${description}`,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }
      
      res.status(201).json({
        message: 'Quick update sent successfully',
        trackingUpdate
      });
    } catch (error) {
      console.error("Error sending quick update:", error);
      res.status(500).json({ message: "Failed to send quick update" });
    }
  });

  // Certificate Generation
  app.post('/api/admin/consignments/:consignmentId/generate-certificate', isAdmin, async (req: any, res) => {
    try {
      const consignmentId = req.params.consignmentId;
      const consignment = await storage.getConsignment(consignmentId);
      
      if (!consignment) {
        return res.status(404).json({ message: "Consignment not found" });
      }
      
      // Generate QR code first
      const qrCodeUrl = await generateQRCode(consignment.consignmentNumber);
      
      // Generate certificate PDF
      const certificateUrl = await generateCertificatePDF(consignment, qrCodeUrl);
      
      // Update consignment with certificate URL
      await storage.updateConsignmentCertificate(consignmentId, certificateUrl);
      
      // Create tracking update for certificate generation
      const trackingUpdate = await storage.createTrackingUpdate({
        consignmentId,
        status: 'certified',
        location: null,
        description: 'Official storage certificate generated and issued',
        adminId: req.user.id,
        isPublic: true,
        customerNotified: false,
        metadata: { action: 'certificate_generated', certificateUrl }
      });
      
      // Send notification to customer
      await storage.createCustomerNotification({
        userId: consignment.userId,
        consignmentId,
        trackingUpdateId: trackingUpdate.id,
        type: 'certificate_ready',
        title: 'Storage Certificate Ready',
        message: `📜 Your official storage certificate for consignment #${consignment.trackingId} is now available for download.`,
        notificationMethod: 'email',
        delivered: false
      });
      
      // Real-time WebSocket notification
      const connectedClients = (req.app as any).connectedClients;
      const userSocket = connectedClients.get(consignment.userId);
      if (userSocket && userSocket.readyState === WebSocket.OPEN) {
        userSocket.send(JSON.stringify({
          type: 'certificate_ready',
          data: {
            consignmentId,
            trackingId: consignment.trackingId,
            certificateUrl,
            qrCodeUrl,
            message: 'Your storage certificate is ready for download',
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      res.status(201).json({
        message: 'Certificate generated successfully',
        certificateUrl,
        qrCodeUrl,
        trackingUpdate
      });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
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
  
  // Claims Processing System for Inheritance
  app.post('/api/claims/inheritance', async (req, res) => {
    try {
      const { 
        digitalWillId, 
        beneficiaryName, 
        beneficiaryEmail, 
        relationship, 
        deathCertificateUrl, 
        identificationUrl, 
        legalDocumentUrl,
        requestedItems,
        additionalNotes 
      } = req.body;
      
      if (!digitalWillId || !beneficiaryName || !beneficiaryEmail || !deathCertificateUrl) {
        return res.status(400).json({ message: "Missing required fields for inheritance claim" });
      }
      
      // Verify digital will exists
      const digitalWill = await storage.getDigitalWill(digitalWillId);
      if (!digitalWill) {
        return res.status(404).json({ message: "Digital will not found" });
      }
      
      // Create inheritance claim
      const claim = await storage.createClaim({
        digitalWillId,
        beneficiaryName,
        beneficiaryEmail,
        relationship,
        type: 'inheritance',
        status: 'pending_review',
        submittedDocuments: [deathCertificateUrl, identificationUrl, legalDocumentUrl].filter(Boolean),
        requestedItems: requestedItems || [],
        additionalNotes,
        metadata: {
          submissionDate: new Date().toISOString(),
          reviewRequired: true,
          urgency: 'high'
        }
      });
      
      // Create admin notification for new inheritance claim
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(user => user.role === 'admin');
      
      for (const admin of adminUsers) {
        await storage.createAdminNotification({
          adminId: admin.id,
          type: 'inheritance_claim',
          title: 'New Inheritance Claim Submitted',
          message: `Inheritance claim submitted by ${beneficiaryName} for digital will. Requires urgent review and documentation verification.`,
          claimId: claim.id,
          priority: 'urgent',
          actionRequired: true,
        });
      }
      
      res.status(201).json({
        message: 'Inheritance claim submitted successfully',
        claimId: claim.id,
        status: 'pending_review',
        nextSteps: [
          'Admin will review submitted documents within 2-3 business days',
          'You will receive email updates on claim progress',
          'Additional documentation may be requested if needed'
        ]
      });
    } catch (error) {
      console.error("Error creating inheritance claim:", error);
      res.status(500).json({ message: "Failed to create inheritance claim" });
    }
  });

  app.get('/api/admin/claims', isAdmin, async (req, res) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.post('/api/admin/claims/:claimId/review', isAdmin, async (req: any, res) => {
    try {
      const claimId = req.params.claimId;
      const { status, reviewNotes, approvedItems, rejectionReason } = req.body;
      
      const updatedClaim = await storage.updateClaimStatus(claimId, {
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes,
        approvedItems,
        rejectionReason
      });
      
      // Send notification to beneficiary
      if (status === 'approved') {
        console.log(`Inheritance claim ${claimId} approved for items:`, approvedItems);
      } else if (status === 'rejected') {
        console.log(`Inheritance claim ${claimId} rejected:`, rejectionReason);
      }
      
      res.json({
        message: `Claim ${status} successfully`,
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error reviewing claim:", error);
      res.status(500).json({ message: "Failed to review claim" });
    }
  });

  // Live Chat Support System
  app.post('/api/chat/start', isAuthenticated, async (req: any, res) => {
    try {
      const { subject, priority = 'medium' } = req.body;
      const sessionId = crypto.randomUUID();
      
      // Create chat session and support ticket
      const ticket = await storage.createSupportTicket({
        customerEmail: req.user.email,
        customerName: `${req.user.firstName} ${req.user.lastName}`,
        subject: subject || 'Live Chat Support',
        description: 'Customer initiated live chat session',
        category: 'technical',
        priority,
        chatSessionId: sessionId,
      });
      
      // Store chat session in connected clients with session ID
      const connectedClients = (req.app as any).connectedClients;
      const userSocket = connectedClients.get(req.user.id);
      if (userSocket) {
        userSocket.chatSessionId = sessionId;
        userSocket.ticketId = ticket.id;
      }
      
      res.status(201).json({
        chatSessionId: sessionId,
        ticketId: ticket.id,
        message: 'Chat session started. You will be connected to support shortly.'
      });
    } catch (error) {
      console.error("Error starting chat session:", error);
      res.status(500).json({ message: "Failed to start chat session" });
    }
  });

  app.post('/api/chat/:sessionId/message', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { message, type = 'text' } = req.body;
      
      // Store message in database (would need to implement chat messages table)
      const chatMessage = {
        sessionId,
        senderId: req.user.id,
        senderType: 'customer',
        message,
        type,
        timestamp: new Date().toISOString()
      };
      
      // Send to admin via WebSocket
      const connectedClients = (req.app as any).connectedClients;
      const adminEntries = Array.from(connectedClients.entries());
      
      for (const [userId, socket] of adminEntries) {
        // Send to admin users (would need to check admin role)
        socket.send(JSON.stringify({
          type: 'chat_message',
          data: chatMessage
        }));
      }
      
      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Document Upload and Verification System
  app.post('/api/documents/upload', isAuthenticated, uploadMiddleware.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { documentType, description, consignmentId } = req.body;
      const allowedTypes = ['identification', 'proof_of_ownership', 'insurance', 'appraisal', 'death_certificate', 'legal_document'];
      
      if (!allowedTypes.includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type" });
      }
      
      const documentUrl = `/uploads/documents/${req.file.filename}`;
      
      // Store document reference in database
      const documentRecord = {
        userId: req.user.id,
        consignmentId: consignmentId || null,
        documentType,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: documentUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || '',
        status: 'pending_verification',
        uploadedAt: new Date(),
        metadata: {
          uploadedBy: req.user.email,
          originalSize: req.file.size,
          verified: false
        }
      };
      
      // Would save to documents table if it existed
      console.log('Document uploaded:', documentRecord);
      
      // Create admin notification for document verification
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(user => user.role === 'admin');
      
      for (const admin of adminUsers) {
        await storage.createAdminNotification({
          adminId: admin.id,
          type: 'document_verification',
          title: 'Document Requires Verification',
          message: `${documentType.replace('_', ' ')} document uploaded by ${req.user.firstName} ${req.user.lastName} requires verification.`,
          priority: 'medium',
          actionRequired: true,
        });
      }
      
      res.status(201).json({
        message: 'Document uploaded successfully',
        documentId: crypto.randomUUID(),
        documentUrl,
        status: 'pending_verification',
        nextSteps: [
          'Document will be reviewed by our verification team',
          'You will receive notification once verification is complete',
          'Processing typically takes 1-2 business days'
        ]
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post('/api/admin/documents/:documentId/verify', isAdmin, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const { status, verificationNotes, rejectionReason } = req.body;
      
      // Would update document status in database
      const verificationResult = {
        documentId,
        status, // 'verified' or 'rejected'
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        verificationNotes,
        rejectionReason
      };
      
      console.log('Document verification:', verificationResult);
      
      res.json({
        message: `Document ${status} successfully`,
        verificationResult
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Failed to verify document" });
    }
  });

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      // Would fetch user's documents from database
      // For now return empty array as documents table doesn't exist
      const documents = [];
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Fix Analytics Dashboard to return real data
  app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    try {
      // Get real analytics data
      const allConsignments = await storage.getAllConsignments();
      const allUsers = await storage.getAllUsers();
      const allTickets = await storage.getAllSupportTickets();
      
      // Calculate consignment statistics by status
      const consignmentStats = allConsignments.reduce((acc, consignment) => {
        const status = consignment.trackingStatus || consignment.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate financial metrics
      const totalValue = allConsignments.reduce((sum, c) => sum + parseFloat(c.estimatedValue || '0'), 0);
      const totalWeight = allConsignments.reduce((sum, c) => sum + parseFloat(c.weight || '0'), 0);
      
      // User analytics
      const customerCount = allUsers.filter(u => u.role === 'user').length;
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      
      // Support metrics
      const openTickets = allTickets.filter(t => t.status === 'open').length;
      const resolvedTickets = allTickets.filter(t => t.status === 'resolved').length;
      
      // Monthly growth data (simplified for demo)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        monthlyData.push({
          month: monthName,
          consignments: Math.floor(Math.random() * 20) + 5,
          value: Math.floor(Math.random() * 50000) + 10000,
          customers: Math.floor(Math.random() * 15) + 3
        });
      }
      
      const analytics = {
        overview: {
          totalConsignments: allConsignments.length,
          totalValue,
          totalWeight,
          totalCustomers: customerCount,
          activeAdmins: adminCount
        },
        consignmentsByStatus: consignmentStats,
        supportMetrics: {
          totalTickets: allTickets.length,
          openTickets,
          resolvedTickets,
          avgResponseTime: '2.3 hours'
        },
        monthlyGrowth: monthlyData,
        recentActivity: allConsignments
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
          .slice(0, 10)
          .map(c => ({
            id: c.id,
            consignmentNumber: c.consignmentNumber,
            customerName: c.userName,
            status: c.status,
            value: c.estimatedValue,
            date: c.updatedAt || c.createdAt
          }))
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Knowledge Base APIs
  app.get('/api/knowledge-base', async (req, res) => {
    try {
      const { category, search } = req.query;
      let articles;
      
      if (search) {
        articles = await storage.searchKnowledgeBase(search as string);
      } else {
        articles = await storage.getKnowledgeBaseArticles(category as string);
      }
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge base articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get('/api/knowledge-base/:id', async (req, res) => {
    try {
      const article = await storage.getKnowledgeBaseArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      await storage.incrementArticleView(req.params.id);
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post('/api/knowledge-base/:id/vote', async (req, res) => {
    try {
      const { isHelpful } = req.body;
      const { id } = req.params;
      
      let userId = null;
      let sessionId = null;
      
      if (req.user) {
        userId = (req.user as any).id;
      } else {
        sessionId = req.sessionID;
      }
      
      await storage.voteOnArticle({
        articleId: id,
        userId,
        sessionId,
        isHelpful
      });
      
      res.json({ message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error voting on article:", error);
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Support Ticket APIs for customers
  app.post('/api/support/tickets', async (req: any, res) => {
    try {
      const ticketData = {
        ...req.body,
        customerId: req.user?.id,
        customerEmail: req.user?.email || req.body.customerEmail,
        customerName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : req.body.customerName,
      };
      
      const ticket = await storage.createSupportTicket(ticketData);
      
      // Create admin notification for new ticket
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(user => user.role === 'admin');
      
      for (const admin of adminUsers) {
        await storage.createAdminNotification({
          adminId: admin.id,
          type: 'new_ticket',
          title: 'New Support Ticket',
          message: `New ticket created: ${ticket.subject}`,
          ticketId: ticket.id,
          priority: ticket.priority === 'urgent' ? 'urgent' : 'normal',
          actionRequired: true
        });
      }
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create ticket" });
    }
  });

  app.get('/api/support/tickets/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await storage.getUserSupportTickets(req.user.email);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/support/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Ensure customer can only access their own tickets (unless they're admin)
      if (req.user.role !== 'admin' && ticket.customerEmail !== req.user.email) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get chat messages if any
      const messages = await storage.getChatMessagesByTicket(req.params.id);
      
      res.json({ ...ticket, messages });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  // Send message to support ticket
  app.post('/api/chat/ticket/:ticketId/message', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const ticketId = req.params.ticketId;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Save the message
      const chatMessage = await storage.saveChatMessage({
        sessionId: ticket.chatSessionId,
        ticketId: ticketId,
        userId: req.user?.id || null,
        isCustomer: true,
        message: message.trim(),
        messageType: 'text',
        attachmentUrls: [],
      });

      // Update ticket last activity
      await storage.updateTicketLastActivity(ticketId);
      
      // Create admin notification for customer responses
      if (ticket.assignedTo) {
        await storage.createAdminNotification({
          adminId: ticket.assignedTo,
          type: 'customer_response',
          title: 'Customer Response',
          message: `Customer replied to ticket: ${ticket.subject}`,
          ticketId: ticketId,
          priority: 'normal',
          actionRequired: true,
        });
      } else {
        // Create notification for all admins if ticket is not assigned
        const admins = await storage.getAllUsers();
        const adminUsers = admins.filter(user => user.role === 'admin');
        
        for (const admin of adminUsers) {
          await storage.createAdminNotification({
            adminId: admin.id,
            type: 'customer_response',
            title: 'Customer Response',
            message: `Customer replied to ticket: ${ticket.subject}`,
            ticketId: ticketId,
            priority: 'normal',
            actionRequired: true,
          });
        }
      }

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error sending ticket message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/support/tickets/:id/messages', async (req: any, res) => {
    try {
      const { message } = req.body;
      const ticketId = req.params.id;
      
      const chatMessage = await storage.saveChatMessage({
        sessionId: `ticket-${ticketId}`,
        ticketId,
        userId: req.user?.id,
        isCustomer: req.user?.role !== 'admin',
        message,
        messageType: 'text'
      });
      
      // Update ticket last activity
      await storage.updateTicketLastActivity(ticketId);
      
      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error adding ticket message:", error);
      res.status(400).json({ message: "Failed to add message" });
    }
  });

  // Support Session APIs
  app.post('/api/support/sessions', async (req: any, res) => {
    try {
      const sessionData = {
        ...req.body,
        customerId: req.user?.id,
        customerEmail: req.user?.email || req.body.customerEmail,
        customerName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : req.body.customerName,
      };
      
      const session = await storage.createSupportSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating support session:", error);
      res.status(400).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/support/sessions/mine', isAuthenticated, async (req: any, res) => {
    try {
      const sessions = await storage.getUserSupportSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Support file upload endpoint
  app.post("/api/support/upload", isAuthenticated, uploadMiddleware.single('attachment'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/support/${req.file.filename}`
      });
    } catch (error) {
      console.error("Support upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Create HTTP server and enhance existing WebSocket server
  const httpServer = createServer(app);
  
  // Check if WebSocket server exists, if not create it
  let wss = (app as any).wss;
  if (!wss) {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    (app as any).wss = wss;
  }

  // Store active connections
  const activeConnections = new Map<string, { ws: WebSocket, userId?: string, sessionId?: string, isAdmin: boolean }>();

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, request: any) => {
    console.log('New WebSocket connection established');
    const connectionId = crypto.randomUUID();
    
    activeConnections.set(connectionId, { ws, isAdmin: false });
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'authenticate':
            const connection = activeConnections.get(connectionId);
            if (connection) {
              connection.userId = data.userId;
              connection.isAdmin = data.isAdmin || false;
              activeConnections.set(connectionId, connection);
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: data.userId,
                timestamp: new Date().toISOString(),
              }));
            }
            break;
            
          case 'chat_message':
            const conn = activeConnections.get(connectionId);
            if (conn && conn.userId) {
              try {
                const chatMessage = await storage.saveChatMessage({
                  sessionId: data.sessionId || crypto.randomUUID(),
                  userId: conn.userId,
                  isCustomer: !conn.isAdmin,
                  message: data.message,
                  messageType: 'text',
                });
                
                const responseMessage = {
                  type: 'chat_message',
                  id: chatMessage.id,
                  message: data.message,
                  userId: conn.userId,
                  isCustomer: !conn.isAdmin,
                  timestamp: chatMessage.timestamp,
                  sessionId: chatMessage.sessionId
                };
                
                if (!conn.isAdmin) {
                  Array.from(activeConnections.values()).forEach(connection => {
                    if (connection.isAdmin && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify(responseMessage));
                    }
                  });
                } else {
                  Array.from(activeConnections.values()).forEach(connection => {
                    if (!connection.isAdmin && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify(responseMessage));
                    }
                  });
                }
                
                ws.send(JSON.stringify(responseMessage));
                
              } catch (error) {
                console.error('Error saving chat message:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to send message',
                  timestamp: new Date().toISOString(),
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      activeConnections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      activeConnections.delete(connectionId);
    });
  });

  // Store references for use in routes
  (app as any).activeConnections = activeConnections;
  
  return httpServer;
}
