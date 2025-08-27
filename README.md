# GoldVault Pro - Gold Consignment & Digital Inheritance Platform

A comprehensive gold consignment and digital inheritance platform built with React, TypeScript, Express.js, and PostgreSQL. The system provides secure gold storage services, consignment management, digital will creation, inheritance claims processing, and admin management capabilities.

## 🌟 Features

### Core Services
- **Secure Gold Storage**: Professional-grade vault storage with 24/7 monitoring
- **Gold Consignment**: Complete consignment process with professional valuation
- **Digital Certificates**: Blockchain-verified certificates with QR code tracking
- **Real-time Tracking**: Public consignment tracking system
- **Live Gold Prices**: Real-time gold price feeds with multi-currency support

### Authentication & Security
- **User Authentication**: Secure email/password authentication system
- **Role-Based Access**: User and Admin role management
- **Session Management**: PostgreSQL-backed secure sessions
- **Protected Routes**: Route-level authentication and authorization

### Digital Inheritance (Authenticated Users Only)
- **Digital Will Creation**: Comprehensive will builder with beneficiary management
- **Inheritance Claims**: Streamlined claims processing system
- **Document Upload**: Secure document storage for legal verification
- **Beneficiary Management**: Add, edit, and remove beneficiaries

### Admin Management (Admin Users Only)
- **Claims Management**: Review and process inheritance claims
- **Consignment Oversight**: Monitor and manage all consignments
- **User Management**: Comprehensive user administration
- **Analytics Dashboard**: Business insights and reporting

### Additional Features
- **Live Chat Support**: Real-time customer support system
- **Pricing Calculator**: Dynamic storage cost calculation
- **Multi-currency Support**: USD, GBP, EUR pricing
- **Responsive Design**: Mobile-first responsive design
- **File Upload**: Secure document and certificate management

## 🏗️ System Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication
- **PostgreSQL** with Neon serverless hosting
- **Multer** for file uploads
- **bcrypt** for password hashing

### Database Design
- **Users**: Authentication and profile management
- **Consignments**: Gold storage tracking
- **Digital Wills**: Inheritance planning
- **Beneficiaries**: Will beneficiary management
- **Claims**: Inheritance claims processing
- **Chat Messages**: Customer support history
- **Audit Events**: Immutable tracking logs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goldvault-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   PORT=5000
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Database Schema Setup

The application uses Drizzle ORM for database management. To set up or update the database schema:

```bash
# Push schema changes to database
npm run db:push

# Force push if there are conflicts
npm run db:push --force
```

## 🔐 Authentication System

### User Registration
Users can register with:
- Email address
- Password (minimum 6 characters)
- First and Last name
- Default role: "user"

### User Roles
- **User**: Access to personal dashboard, consignments, and digital inheritance
- **Admin**: Full system access including claims management and analytics

### Login Process
1. Navigate to `/auth`
2. Enter email and password
3. Upon successful login, users are redirected to their dashboard
4. Admin users have access to additional management features

## 📱 User Interface

### Public Pages (No Authentication Required)
- **Homepage**: Company information and services overview
- **Tracking**: Public consignment tracking system
- **Authentication**: Login and registration forms

### Protected Pages (Authentication Required)
- **Dashboard**: Personal portfolio overview
- **Consignments**: Manage gold consignments
- **Digital Will**: Create and manage inheritance plans
- **Portfolio**: View certificates and holdings

### Admin Pages (Admin Role Required)
- **Admin Dashboard**: System overview and analytics
- **Claims Management**: Review inheritance claims
- **User Management**: Comprehensive user administration

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Consignments
- `POST /api/consignments` - Create new consignment
- `GET /api/consignments` - Get user's consignments
- `GET /api/consignments/:id` - Get specific consignment
- `GET /api/tracking/:number` - Public tracking (no auth)

### Digital Wills
- `POST /api/digital-wills` - Create digital will
- `GET /api/digital-wills` - Get user's digital will
- `POST /api/beneficiaries` - Add beneficiary
- `DELETE /api/beneficiaries/:id` - Remove beneficiary

### Admin (Admin Role Required)
- `GET /api/admin/pending-claims` - Get pending claims
- `PATCH /api/admin/claims/:id/status` - Update claim status

### Other Services
- `GET /api/gold-prices` - Get current gold prices
- `GET /api/storage-plans` - Get available storage plans

## 🛡️ Security Features

### Authentication Security
- Password hashing using bcrypt with salt
- Session-based authentication with secure cookies
- Session data stored in PostgreSQL
- CSRF protection via secure session configuration

### Route Protection
- Middleware-based authentication checks
- Role-based authorization for admin features
- Protected API endpoints with proper error handling

### Data Security
- Input validation using Zod schemas
- SQL injection prevention via Drizzle ORM
- File upload security with type validation
- Secure file storage with organized directory structure

## 📂 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── ...
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── auth.ts             # Authentication setup
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   └── ...
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and types
└── ...
```

## 🔄 Development Workflow

### Running the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Database Operations
```bash
# Update database schema
npm run db:push

# Type checking
npm run check
```

### Adding New Features

1. **Database Changes**
   - Update `shared/schema.ts` with new tables/columns
   - Run `npm run db:push` to apply changes
   - Update storage interface in `server/storage.ts`

2. **API Development**
   - Add new routes in `server/routes.ts`
   - Implement business logic in `server/services/`
   - Add proper authentication/authorization

3. **Frontend Development**
   - Create new components in `client/src/components/`
   - Add new pages in `client/src/pages/`
   - Update routing in `client/src/App.tsx`

## 🌐 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - `DATABASE_URL`: Production PostgreSQL connection
   - `SESSION_SECRET`: Strong production secret
   - `NODE_ENV=production`

3. **Deploy to your hosting platform**
   - The application serves both frontend and backend on a single port
   - Ensure your hosting platform supports Node.js applications
   - Configure health checks for `/api/gold-prices` endpoint

### Environment Configuration

**Development**
- Frontend dev server with hot reloading
- Detailed error messages
- Development database

**Production**
- Optimized build with static asset serving
- Error logging without sensitive information
- Production database with connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Update tests if necessary
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation above
- Review the API endpoints and their usage
- Ensure all environment variables are properly configured
- Verify database connectivity and schema is up to date

## 🔮 Future Enhancements

- Multi-factor authentication
- Advanced analytics and reporting
- Mobile application
- Automated KYC verification
- Blockchain integration for certificates
- International shipping management
- Advanced notification system