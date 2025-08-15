#!/bin/bash

# Rivor Local Development Setup Script
# This script helps set up local development environment

set -e

echo "🚀 Setting up Rivor for local development..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    USE_DOCKER=true
else
    echo "⚠️  Docker not found - will guide you through manual setup"
    USE_DOCKER=false
fi

# Create .env.local if it doesn't exist
ENV_FILE="apps/web/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo "📁 Creating $ENV_FILE..."
    
    # Generate a random NextAuth secret
    if command -v openssl &> /dev/null; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
    else
        NEXTAUTH_SECRET="your-nextauth-secret-$(date +%s)"
    fi
    
    cat > "$ENV_FILE" << EOF
# =============================================================================
# CORE AUTHENTICATION  
# =============================================================================
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=true

# =============================================================================
# GOOGLE OAUTH - FILL THESE IN FROM GOOGLE CLOUD CONSOLE
# =============================================================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly

# =============================================================================
# DATABASE & REDIS
# =============================================================================
DATABASE_URL=postgresql://postgres:rivor123@localhost:5432/rivor_dev
REDIS_URL=redis://localhost:6379

# =============================================================================
# AI INTEGRATION - FILL THIS IN FROM OPENAI
# =============================================================================
OPENAI_API_KEY=sk-your-openai-api-key-here

# =============================================================================
# ENCRYPTION (local development)
# =============================================================================
KMS_PROVIDER=local
KMS_KEY_ID=local-dev-key
RETENTION_DAYS=365
EOF

    echo "✅ Created $ENV_FILE with basic configuration"
    echo "⚠️  You still need to fill in:"
    echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    echo "   - OPENAI_API_KEY"
else
    echo "✅ $ENV_FILE already exists"
fi

# Setup database and Redis
if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Setting up PostgreSQL and Redis with Docker..."
    
    # Check if containers already exist
    if ! docker ps -a | grep -q rivor-postgres; then
        echo "🗄️  Starting PostgreSQL container..."
        docker run --name rivor-postgres \
            -e POSTGRES_PASSWORD=rivor123 \
            -e POSTGRES_DB=rivor_dev \
            -p 5432:5432 \
            -d postgres:16
    else
        echo "🗄️  PostgreSQL container already exists, starting it..."
        docker start rivor-postgres
    fi
    
    if ! docker ps -a | grep -q rivor-redis; then
        echo "🔄 Starting Redis container..."
        docker run --name rivor-redis \
            -p 6379:6379 \
            -d redis:7-alpine
    else
        echo "🔄 Redis container already exists, starting it..."
        docker start rivor-redis
    fi
    
    echo "⏳ Waiting for services to start..."
    sleep 5
    
else
    echo "📋 Manual setup required:"
    echo "   1. Install PostgreSQL and create database 'rivor_dev'"
    echo "   2. Install Redis and start it"
    echo "   3. Update DATABASE_URL and REDIS_URL in $ENV_FILE if needed"
fi

# Setup Prisma
echo "🔧 Setting up database schema..."
cd packages/db
npm install
npx prisma generate
npx prisma db push
cd ../..

# Install dependencies
echo "📦 Installing dependencies..."
cd apps/web
npm install --legacy-peer-deps
cd ../..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit $ENV_FILE and add your Google OAuth credentials"
echo "   2. Add your OpenAI API key"
echo "   3. Run: cd apps/web && npm run dev"
echo "   4. Visit: http://localhost:3000"
echo ""
echo "📖 For detailed setup instructions, see ENV_SETUP.md"
