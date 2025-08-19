# Local Development Environment Setup

This guide will help you set up all environment variables needed to test Rivor locally.

## 📁 Create Environment File

Create `apps/web/.env.local` with the following content:

```bash
# =============================================================================
# CORE AUTHENTICATION
# =============================================================================

# Generate a random string: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-here

# Your local development URL
NEXTAUTH_URL=http://localhost:3000

# Enable debug logging for auth issues
NEXTAUTH_DEBUG=true

# =============================================================================
# GOOGLE OAUTH & API
# =============================================================================

# Get these from Google Cloud Console:
# 1. Go to https://console.cloud.google.com/
# 2. Create a project or select existing
# 3. Enable Gmail API and Google Calendar API
# 4. Create OAuth 2.0 credentials
# 5. Add http://localhost:3000/api/auth/callback/google to redirect URIs

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly

# Optional: For Gmail push notifications (requires Google Cloud project)
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_PUBSUB_VERIFICATION_TOKEN=optional-verification-token

# =============================================================================
# DATABASE
# =============================================================================

# Option 1: Local PostgreSQL
# Install: brew install postgresql (Mac) or use Docker
# Create database: createdb rivor_dev
DATABASE_URL=postgresql://username:password@localhost:5432/rivor_dev

# Option 2: Docker PostgreSQL (easier setup)
# Run: docker run --name rivor-postgres -e POSTGRES_PASSWORD=rivor123 -e POSTGRES_DB=rivor_dev -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:rivor123@localhost:5432/rivor_dev

# =============================================================================
# REDIS (for background jobs)
# =============================================================================

# Option 1: Local Redis
# Install: brew install redis (Mac), then run: redis-server
REDIS_URL=redis://localhost:6379

# Option 2: Docker Redis (easier setup)
# Run: docker run --name rivor-redis -p 6379:6379 -d redis:7-alpine
# REDIS_URL=redis://localhost:6379

# =============================================================================
# AI INTEGRATION
# =============================================================================

# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
# Generic AI key for hosted LLM
AI_API_KEY=your-ai-api-key

# =============================================================================
# ENCRYPTION & SECURITY (simplified for local dev)
# =============================================================================

KMS_PROVIDER=local
KMS_KEY_ID=local-dev-key
RETENTION_DAYS=365

# =============================================================================
# OPTIONAL: Microsoft OAuth
# =============================================================================

# MICROSOFT_CLIENT_ID=your-microsoft-client-id
# MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
# MICROSOFT_TENANT_ID=common
# MICROSOFT_OAUTH_SCOPES=openid email profile https://graph.microsoft.com/mail.read

# =============================================================================
# OPTIONAL: Stripe (for billing features)
# =============================================================================

# STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
# STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## 🚀 Quick Setup Options

### Option A: Docker Services (Recommended for easiest setup)

```bash
# Start PostgreSQL and Redis with Docker
docker run --name rivor-postgres -e POSTGRES_PASSWORD=rivor123 -e POSTGRES_DB=rivor_dev -p 5432:5432 -d postgres:16
docker run --name rivor-redis -p 6379:6379 -d redis:7-alpine

# Use these in your .env.local:
DATABASE_URL=postgresql://postgres:rivor123@localhost:5432/rivor_dev
REDIS_URL=redis://localhost:6379
```

### Option B: Local Services

```bash
# Install and start PostgreSQL (Mac)
brew install postgresql
brew services start postgresql
createdb rivor_dev

# Install and start Redis (Mac)  
brew install redis
brew services start redis
```

## 🔑 Google OAuth Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**
3. **Enable APIs**:
   - Gmail API
   - Google Calendar API
4. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. **Copy Client ID and Secret** to your `.env.local`

## 🗄️ Database Setup

```bash
# Navigate to database package
cd packages/db

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: View database
npx prisma studio
```

## 🔧 Test the Setup

```bash
# Start development server
cd apps/web
npm run dev

# Visit http://localhost:3000
# Try signing in with Google
# Click "Sync Gmail" in the inbox
```

## 🔍 Troubleshooting

### Database Connection Issues
- Check if PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l`
- Check connection string format

### Redis Connection Issues  
- Check if Redis is running: `redis-cli ping`
- Should return "PONG"

### Google OAuth Issues
- Verify redirect URI matches exactly
- Check that APIs are enabled
- Look at browser console for auth errors

### Environment Variables Not Loading
- File must be named exactly `.env.local`
- File must be in `apps/web/` directory
- Restart development server after changes

## 📊 Monitoring Development

With local setup, you can:
- ✅ Sign in with Google OAuth
- ✅ Sync real Gmail data locally  
- ✅ Test AI features with OpenAI
- ✅ Debug authentication flow
- ✅ Test database operations
- ✅ View encrypted data storage
