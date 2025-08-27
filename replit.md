# Gold Consignment & Storage Platform

## Overview

This is a comprehensive gold consignment and digital inheritance platform built with React, TypeScript, Express.js, and PostgreSQL. The system provides secure gold storage services, consignment management, digital will creation, inheritance claims processing, and admin management capabilities. The platform features real-time chat support, live gold price tracking, public consignment tracking, and multi-currency payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for build tooling
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and color scheme
- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: TanStack Query for server state management and API caching
- **Forms**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC)
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **File Handling**: Multer for document uploads with organized storage structure
- **API Design**: RESTful endpoints with consistent error handling and logging

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Key Entities**: Users, Consignments, Digital Wills, Beneficiaries, Claims, Chat Messages, Storage Plans
- **Audit Trail**: Immutable consignment events tracking for compliance
- **Session Storage**: Dedicated sessions table for authentication state

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC integration
- **Session Strategy**: Server-side sessions with HTTP-only cookies
- **Route Protection**: Middleware-based authentication checks
- **User Management**: Automatic user creation/updates from auth provider
- **Security**: CSRF protection, secure cookie settings, and proper session invalidation

### File Management System
- **Upload Strategy**: Local file storage with organized directory structure
- **File Types**: Document uploads (PDFs, images), certificates, QR codes, invoices
- **Security**: File type validation, size limits, and secure file paths
- **Organization**: Categorized storage (documents, certificates, qr-codes, invoices, reports)

### Service Layer Architecture
- **Gold Price Service**: External API integration with caching for live market data
- **PDF Generation**: Certificate creation with QR code integration
- **QR Code Service**: Dynamic QR generation for tracking and verification
- **Storage Interface**: Abstract storage layer for database operations

### Real-time Features
- **Chat System**: WebSocket-based customer support (architecture defined, implementation pending)
- **Live Updates**: Real-time gold price feeds with automatic refresh
- **Notifications**: Toast-based user feedback system

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth OIDC provider
- **Build & Deploy**: Vite for frontend builds, esbuild for backend compilation

### UI & Styling
- **Component Library**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React icon library
- **Fonts**: Google Fonts integration (Inter, Playfair Display)
- **Styling**: Tailwind CSS with PostCSS processing

### Payment Processing
- **Gateways**: Stripe for card payments, PayPal for alternative payments
- **Multi-currency**: Support for USD, GBP, EUR with live exchange rates
- **Compliance**: PCI-compliant payment handling (architecture defined)

### External APIs
- **Gold Prices**: Third-party gold price APIs (MetalsAPI, LBMA compatible)
- **KYC Integration**: Placeholder for Onfido/Trulioo integration
- **Document Processing**: File upload and verification services

### Development & Monitoring
- **Development**: Replit development environment with hot reloading
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Logging**: Request/response logging with performance metrics
- **Type Safety**: Full TypeScript coverage across frontend and backend