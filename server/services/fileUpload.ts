import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const subDirs = ['documents', 'certificates', 'qr-codes', 'invoices', 'reports', 'support'];
subDirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine upload directory based on file type or route
    let uploadPath = path.join(uploadDir, 'documents');
    
    if (req.path.includes('certificates')) {
      uploadPath = path.join(uploadDir, 'certificates');
    } else if (req.path.includes('claims')) {
      uploadPath = path.join(uploadDir, 'documents');
    } else if (req.path.includes('support')) {
      uploadPath = path.join(uploadDir, 'support');
    }
    
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '-');
    
    const filename = `${baseName}-${timestamp}-${randomString}${extension}`;
    cb(null, filename);
  }
});

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types for gold consignment documentation
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
  }
};

// Configure multer with size limits and validation
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files per upload
  },
});

// File validation service
class FileUploadService {
  
  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): boolean {
    if (!file) return false;
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.');
    }
    
    return true;
  }
  
  /**
   * Get secure file URL
   */
  getFileUrl(filename: string, category: string = 'documents'): string {
    return `/api/files/${category}/${filename}`;
  }
  
  /**
   * Delete file from storage
   */
  async deleteFile(filepath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('File deletion failed');
    }
  }
  
  /**
   * Move file to different category
   */
  async moveFile(currentPath: string, newCategory: string, filename: string): Promise<string> {
    try {
      const oldPath = path.join(process.cwd(), currentPath);
      const newPath = path.join(process.cwd(), 'uploads', newCategory, filename);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        return `/uploads/${newCategory}/${filename}`;
      }
      
      throw new Error('Source file not found');
    } catch (error) {
      console.error('Failed to move file:', error);
      throw new Error('File move operation failed');
    }
  }
  
  /**
   * Scan file for viruses (placeholder for future implementation)
   */
  async scanFile(filepath: string): Promise<boolean> {
    // In production, this would integrate with antivirus scanning
    // For now, return true (file is clean)
    // Could integrate with services like ClamAV, VirusTotal API, etc.
    
    try {
      // Basic file validation
      const stats = fs.statSync(filepath);
      
      // Check if file is not empty
      if (stats.size === 0) {
        throw new Error('Empty file detected');
      }
      
      // Additional security checks could be added here
      // - File signature validation
      // - Malware scanning
      // - Content analysis
      
      return true;
    } catch (error) {
      console.error('File scan failed:', error);
      return false;
    }
  }
  
  /**
   * Get file metadata
   */
  getFileMetadata(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      path: file.path,
    };
  }
  
  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      
      if (!fs.existsSync(tempDir)) return;
      
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export const fileUploadService = new FileUploadService();

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB per file.',
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 10 files per upload.',
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.',
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: error.message,
    });
  }
  
  return res.status(500).json({
    message: 'File upload failed. Please try again.',
  });
};

// Utility function to create safe filenames
export function createSafeFilename(originalName: string): string {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  // Remove special characters and replace with hyphens
  const safeName = baseName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${safeName}${extension}`;
}

// Export configured multer instance
export default uploadMiddleware;
