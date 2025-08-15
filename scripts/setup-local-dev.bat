@echo off
REM Rivor Local Development Setup Script for Windows
REM This script helps set up local development environment

echo 🚀 Setting up Rivor for local development...

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Docker found
    set USE_DOCKER=true
) else (
    echo ⚠️  Docker not found - will guide you through manual setup
    set USE_DOCKER=false
)

REM Create .env.local if it doesn't exist
set ENV_FILE=apps\web\.env.local
if not exist "%ENV_FILE%" (
    echo 📁 Creating %ENV_FILE%...
    
    REM Generate a simple NextAuth secret (Windows doesn't have openssl by default)
    set NEXTAUTH_SECRET=your-nextauth-secret-%RANDOM%-%RANDOM%
    
    (
        echo # =============================================================================
        echo # CORE AUTHENTICATION  
        echo # =============================================================================
        echo NEXTAUTH_SECRET=%NEXTAUTH_SECRET%
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_DEBUG=true
        echo.
        echo # =============================================================================
        echo # GOOGLE OAUTH - FILL THESE IN FROM GOOGLE CLOUD CONSOLE
        echo # =============================================================================
        echo GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
        echo GOOGLE_CLIENT_SECRET=your-google-client-secret
        echo GOOGLE_OAUTH_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly
        echo.
        echo # =============================================================================
        echo # DATABASE ^& REDIS
        echo # =============================================================================
        echo DATABASE_URL=postgresql://postgres:rivor123@localhost:5432/rivor_dev
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # =============================================================================
        echo # AI INTEGRATION - FILL THIS IN FROM OPENAI
        echo # =============================================================================
        echo OPENAI_API_KEY=sk-your-openai-api-key-here
        echo.
        echo # =============================================================================
        echo # ENCRYPTION ^(local development^)
        echo # =============================================================================
        echo KMS_PROVIDER=local
        echo KMS_KEY_ID=local-dev-key
        echo RETENTION_DAYS=365
    ) > "%ENV_FILE%"

    echo ✅ Created %ENV_FILE% with basic configuration
    echo ⚠️  You still need to fill in:
    echo    - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    echo    - OPENAI_API_KEY
) else (
    echo ✅ %ENV_FILE% already exists
)

REM Setup database and Redis
if "%USE_DOCKER%" == "true" (
    echo 🐳 Setting up PostgreSQL and Redis with Docker...
    
    REM Check if containers already exist
    docker ps -a | findstr rivor-postgres >nul
    if %errorlevel% neq 0 (
        echo 🗄️  Starting PostgreSQL container...
        docker run --name rivor-postgres -e POSTGRES_PASSWORD=rivor123 -e POSTGRES_DB=rivor_dev -p 5432:5432 -d postgres:16
    ) else (
        echo 🗄️  PostgreSQL container already exists, starting it...
        docker start rivor-postgres
    )
    
    docker ps -a | findstr rivor-redis >nul
    if %errorlevel% neq 0 (
        echo 🔄 Starting Redis container...
        docker run --name rivor-redis -p 6379:6379 -d redis:7-alpine
    ) else (
        echo 🔄 Redis container already exists, starting it...
        docker start rivor-redis
    )
    
    echo ⏳ Waiting for services to start...
    timeout /t 5 /nobreak >nul
    
) else (
    echo 📋 Manual setup required:
    echo    1. Install PostgreSQL and create database 'rivor_dev'
    echo    2. Install Redis and start it
    echo    3. Update DATABASE_URL and REDIS_URL in %ENV_FILE% if needed
)

REM Setup Prisma
echo 🔧 Setting up database schema...
cd packages\db
call npm install
call npx prisma generate
call npx prisma db push
cd ..\..

REM Install dependencies
echo 📦 Installing dependencies...
cd apps\web
call npm install --legacy-peer-deps
cd ..\..

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo    1. Edit %ENV_FILE% and add your Google OAuth credentials
echo    2. Add your OpenAI API key
echo    3. Run: cd apps\web ^&^& npm run dev
echo    4. Visit: http://localhost:3000
echo.
echo 📖 For detailed setup instructions, see ENV_SETUP.md

pause
