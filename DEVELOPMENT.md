# Kliiq Development Setup Guide

## Quick Start

### Prerequisites
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+** - Download from [postgresql.org](https://www.postgresql.org/download)
- **Docker & Docker Compose** (optional, for containerized development)

### Local Development (Without Docker)

#### 1. Clone the Repository
```bash
git clone https://github.com/pill2x/Kliiq.git
cd Kliiq
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kliiq"
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

#### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Docker Development

#### 1. Build and Start Containers
```bash
docker-compose up --build
```

This will:
- Start PostgreSQL database on `localhost:5432`
- Start Next.js app on `localhost:3000`
- Automatically run migrations

#### 2. Access Application
- **App**: http://localhost:3000
- **Database**: postgresql://kliiq_user:kliiq_password@localhost:5432/kliiq

#### 3. Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

Visit `http://localhost:5555`

## Project Structure

```
kliiq/
├── app/
│   ├── api/                    # API routes
│   │   ├── applications/       # Application endpoints
│   │   ├── installations/      # Installation management
│   │   ├── updates/           # Update endpoints
│   │   └── recommendations/   # AI recommendations
│   ├── auth/
│   │   ├── login/             # Login page
│   │   └── signup/            # Sign up page
│   ├── dashboard/             # Dashboard page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── Navbar.tsx             # Navigation component
│   ├── HeroSection.tsx        # Hero section
│   ├── FeaturesSection.tsx    # Features grid
│   ├── PacksSection.tsx       # Software packs
│   └── Footer.tsx             # Footer component
├── lib/
│   ├── api-client.ts          # Axios client
│   └── utils.ts               # Utility functions
├── store/
│   └── appStore.ts            # Zustand store
├── types/
│   └── index.ts               # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                     # Static assets
```

## Database Schema Overview

### Core Tables

**users** - User accounts and profiles
- id, email, password, name, timestamps

**applications** - Software catalog
- id, name, description, category, developer, website, downloadUrl, etc.

**versions** - Application versions
- id, applicationId, versionNumber, releaseDate, downloadUrl, size, changelog

**installations** - User's installed apps
- id, userId, applicationId, versionId, status, installPath

**updates** - Update history
- id, userId, fromVersionId, toVersionId, status, timestamps

**packs** - Pre-configured software bundles
- id, name, description, category

**pack_applications** - Junction table for pack contents
- id, packId, applicationId

**recommendations** - AI-powered recommendations
- id, userId, applicationId, score, reason

**system_repairs** - Repair history
- id, userId, issueType, description, resolved

## Available Scripts

```bash
# Development
npm run dev                # Start dev server with hot reload

# Production
npm run build              # Build for production
npm start                  # Start production server

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI

# Linting
npm run lint               # Run ESLint
```

## API Endpoints

### Applications
```
GET    /api/applications              # List all applications
GET    /api/applications/:id          # Get application details
POST   /api/applications              # Create new application
```

### Installations
```
GET    /api/installations             # List user installations
POST   /api/installations             # Install application
DELETE /api/installations/:id         # Uninstall application
```

### Updates
```
GET    /api/updates                   # Check for updates
POST   /api/updates/:id               # Install update
```

### Recommendations
```
POST   /api/recommendations           # Get AI recommendations
```

## Development Workflow

### Creating a New Feature

1. **Create API endpoint** (if needed)
   ```bash
   # Create file: app/api/feature/route.ts
   ```

2. **Create React component** (if needed)
   ```bash
   # Create file: components/Feature.tsx
   ```

3. **Update database schema** (if needed)
   ```prisma
   # Modify prisma/schema.prisma
   npm run prisma:migrate
   ```

4. **Update Zustand store** (if state needed)
   ```bash
   # Modify store/appStore.ts
   ```

5. **Test changes**
   ```bash
   npm run dev
   ```

### Database Migrations

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npm run prisma:migrate

# Or, for production
npx prisma migrate deploy
```

## Environment Variables

Create `.env.local` with these variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kliiq"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# API (public, accessible from frontend)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U user -d kliiq -c "SELECT 1"

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Dependencies Issue
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t kliiq .

# Run container
docker run -p 3000:3000 kliiq
```

### Manual VPS
```bash
# Build
npm run build

# Start
npm start
```

## Next Steps

1. ✅ Set up local development environment
2. ⏭ Implement authentication with NextAuth.js
3. ⏭ Create installer service integration
4. ⏭ Build AI recommendation engine
5. ⏭ Implement offline pack download feature
6. ⏭ Deploy to production

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- 📧 Email: support@kliiq.com
- 📚 Docs: https://docs.kliiq.com
- 💬 Discord: [Join our community]

## License

MIT License - see [LICENSE](LICENSE) for details.
