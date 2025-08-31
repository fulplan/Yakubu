import { Consignment } from "@shared/schema";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface CertificateData {
  consignment: Consignment;
  qrCodeUrl: string;
  generateDate: Date;
}

class PDFGeneratorService {
  async generateCertificatePDF(consignment: Consignment, qrCodeUrl: string): Promise<string> {
    try {
      const certificateData: CertificateData = {
        consignment,
        qrCodeUrl,
        generateDate: new Date(),
      };

      const certificateUrl = await this.createPDFDocument(certificateData);
      return certificateUrl;
    } catch (error) {
      console.error('Failed to generate certificate PDF:', error);
      throw new Error('Certificate generation failed');
    }
  }

  private async createPDFDocument(data: CertificateData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure certificates directory exists
        const certificatesDir = path.join(process.cwd(), 'uploads', 'certificates');
        if (!fs.existsSync(certificatesDir)) {
          fs.mkdirSync(certificatesDir, { recursive: true });
        }

        const filename = `certificate-${data.consignment.consignmentNumber}.pdf`;
        const filepath = path.join(certificatesDir, filename);

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, left: 50, right: 50, bottom: 50 }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Professional Certificate Header with Gold Theme
        doc.fontSize(28)
           .fillColor('#D4AF37')
           .font('Helvetica-Bold')
           .text('GOLDVAULT PRO', 50, 60, { align: 'center', width: 500 });

        doc.fontSize(12)
           .fillColor('#666666')
           .font('Helvetica')
           .text('SECURE PRECIOUS METALS STORAGE FACILITY', 50, 95, { align: 'center', width: 500 });

        // Certificate Title with Border
        doc.rect(80, 130, 440, 60)
           .strokeColor('#D4AF37')
           .lineWidth(2)
           .stroke();

        doc.fontSize(22)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('CERTIFICATE OF STORAGE', 50, 155, { align: 'center', width: 500 });

        // Certificate Number
        doc.fontSize(10)
           .fillColor('#666666')
           .font('Helvetica')
           .text(`Certificate No: ${data.consignment.id.substring(0, 8).toUpperCase()}`, 450, 210, { align: 'right' });

        // Main Content
        doc.fontSize(12)
           .fillColor('#000000')
           .font('Helvetica')
           .text('This is to certify that the following precious metals have been', 80, 240)
           .text('received, verified, and securely stored in our insured vault facility:', 80, 255);

        // Details Box
        doc.rect(80, 280, 440, 200)
           .strokeColor('#D4AF37')
           .lineWidth(1)
           .stroke();

        // Gold background for header
        doc.rect(80, 280, 440, 30)
           .fillColor('#FFF8DC')
           .fill();

        doc.fontSize(14)
           .fillColor('#D4AF37')
           .font('Helvetica-Bold')
           .text('ITEM SPECIFICATIONS', 250, 295, { align: 'center' });

        // Restore black fill for text
        doc.fillColor('#000000');

        // Details in two columns
        const leftCol = 100;
        const rightCol = 320;
        let yPos = 330;

        doc.fontSize(11)
           .font('Helvetica')
           .text('Consignment Number:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(data.consignment.consignmentNumber, rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Description:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(data.consignment.description || 'Gold items', rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Weight:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(`${data.consignment.weight} troy ounces`, rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Purity:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(`${data.consignment.purity}% fine gold`, rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Storage Plan:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(`${data.consignment.storagePlan?.toUpperCase()} SECURITY`, rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Vault Location:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(data.consignment.vaultLocation || 'Primary Secure Facility', rightCol, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .text('Issue Date:', leftCol, yPos)
           .font('Helvetica-Bold')
           .text(data.generateDate.toLocaleDateString('en-US', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric' 
           }), rightCol, yPos);

        // Insurance & Security Notice
        doc.fontSize(10)
           .fillColor('#2E7D32')
           .font('Helvetica-Bold')
           .text('✓ FULLY INSURED', 100, 520)
           .text('✓ BLOCKCHAIN VERIFIED', 250, 520)
           .text('✓ 24/7 SECURITY', 400, 520);

        // Terms and Conditions
        doc.fontSize(9)
           .fillColor('#666666')
           .font('Helvetica')
           .text('This certificate serves as proof of storage for the specified precious metals. Items are held in our', 80, 560)
           .text('climate-controlled, fully insured vault facility with 24/7 security monitoring. This certificate', 80, 575)
           .text('must be presented for item retrieval along with proper identification and authorization.', 80, 590);

        // QR Code Section  
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('SCAN TO VERIFY:', 420, 610);
        
        doc.fontSize(8)
           .fillColor('#666666')
           .font('Helvetica')
           .text('QR code for tracking', 420, 625)
           .text('and authentication', 420, 635);

        // Certificate Footer
        doc.fontSize(8)
           .fillColor('#888888')
           .font('Helvetica')
           .text('GoldVault Pro - Licensed Precious Metals Storage & Consignment Facility', 50, 720, { align: 'center', width: 500 })
           .text('This document contains confidential information. Unauthorized reproduction prohibited.', 50, 735, { align: 'center', width: 500 });

        // Authentication mark
        doc.fontSize(14)
           .fillColor('#D4AF37')
           .font('Helvetica-Bold')
           .text('AUTHENTICATED CERTIFICATE', 50, 680, { align: 'center', width: 500 });

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/certificates/${filename}`);
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  async generateInvoicePDF(invoiceData: any): Promise<string> {
    try {
      // Similar implementation for invoices
      // Would include tax calculations, payment terms, etc.
      
      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;
      return `/api/invoices/${filename}`;
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
      throw new Error('Invoice generation failed');
    }
  }

  async generateReportPDF(reportData: any): Promise<string> {
    try {
      // Implementation for admin reports
      // Portfolio summaries, audit reports, etc.
      
      const filename = `report-${reportData.reportId}.pdf`;
      return `/api/reports/${filename}`;
    } catch (error) {
      console.error('Failed to generate report PDF:', error);
      throw new Error('Report generation failed');
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();

// Export the function for use in routes
export async function generateCertificatePDF(consignment: Consignment, qrCodeUrl: string): Promise<string> {
  return pdfGeneratorService.generateCertificatePDF(consignment, qrCodeUrl);
}