# Kliiq - Intelligent Software Management Platform

One-click software installation, updates, and management for your entire PC. From installation to repair, Kliiq is the unified control center for every PC user.

## Features

- **One-Click Multi-App Install**: Install multiple applications simultaneously
- **Auto-Update All Apps**: Keep all software up-to-date automatically
- **One-Click Uninstall & Cleanup**: Remove applications completely
- **Repair Broken Installs**: Fix corrupted installations automatically
- **AI-Driven Recommendations**: Get intelligent software suggestions
- **Offline-First Installer Packs**: Download complete installer packs for offline installation

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **Zustand** - Client state management
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Backend endpoints
- **Prisma ORM** - Database access
- **PostgreSQL** - Relational database
- **NextAuth.js** - Authentication

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/pill2x/Kliiq.git
cd Kliiq
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Set up the database
```bash
npx prisma migrate dev
```

5. Run the development server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
├── types/                 # TypeScript types
├── store/                 # Zustand store
├── hooks/                 # Custom React hooks
├── prisma/                # Database schema
└── public/                # Static assets
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/kliiq
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## API Documentation

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/:id` - Get application details
- `POST /api/applications` - Create new application

### Installations
- `GET /api/installations` - List user installations
- `POST /api/installations` - Install application
- `DELETE /api/installations/:id` - Uninstall application

### Updates
- `GET /api/updates` - Check for updates
- `POST /api/updates/:id` - Install update

## Contributing

Contributions are welcome! Please follow our [contributing guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@kliiq.com or visit our [documentation](https://docs.kliiq.com).
