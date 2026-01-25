# AudiScope Development Environment Setup

Quick-start guide for setting up your development environment with real AWS resources.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and **bun** installed
- **Python 3** (for LocalStack, optional)
- **AWS CLI** (optional, for testing LocalStack)
- Access to AudiScope AWS resources (Keycloak, API Gateway, etc.)
- Backend API deployed or running locally

## Quick Setup (Automated)

The fastest way to get started is using the setup script:

```bash
# Run the automated setup script
./setup-env.sh

# Follow the prompts to create your environment files
# Press Enter to accept default values or provide your own
```

This creates two environment files locally:
- `.env.dev-cloud` - Cloud development (recommended)
- `.env.development` - Local development with LocalStack

**Note:** These files are gitignored and will NOT be committed for security.

## Setup Options

Choose the setup that matches your development needs:

### Option 1: Development with All Cloud Resources (Recommended)

Best for: Team collaboration, daily development, real AWS testing, integration work

### Option 2: Local Development with LocalStack

Best for: Offline development, feature work, testing without AWS costs

---

## Option 1: Development with All Cloud Resources

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
bun install
```

### Step 2: Verify Backend is Accessible (Optional)

```bash
# Test Core API connectivity
curl http://core-api-dev-alb-766481977.eu-west-1.elb.amazonaws.com/api/health

# You should get a successful response (200 OK)
```

If the backend is not accessible:
- Check VPN connection (if required)
- Verify security groups allow your IP
- Contact DevOps if ALB is down

### Step 3: Start Frontend

```bash
# Start Next.js development server (automatically uses .env.dev-cloud)
bun prod
```

This command automatically loads `.env.dev-cloud` with:
- ✅ Real AWS Cognito (user authentication)
- ✅ Real AWS API Gateway (audio assessment pipeline)
- ✅ Real Core API on AWS ALB (product management)
- ✅ Real AWS S3 (file storage via presigned URLs)
- ✅ Real AWS Bedrock Knowledge Base
- ✅ No LocalStack - all cloud resources

The application will be available at: **http://localhost:3000**

### Step 4: Verify Setup

1. **Open browser:** Navigate to http://localhost:3000
2. **Check console:** Look for startup logs showing cloud endpoints:
   - Core API: `http://core-api-dev-alb-766481977.eu-west-1.elb.amazonaws.com`
   - No LocalStack URL transformation messages
   - AWS API Gateway endpoint

3. **Test authentication:**
   - Go to `/login` or `/signup`
   - Create account or sign in with existing credentials
   - Verify redirect to dashboard works

4. **Test file upload:**
   - Navigate to Products section
   - Upload a test file
   - Check browser Network tab: PUT request should go to real AWS S3 (amazonaws.com domain)
   - Verify file appears in product files list

5. **Test knowledge base:**
   - Go to a product chat/knowledge base section
   - Try asking a question
   - Verify responses come back from Bedrock

---

## Option 2: Local Development with LocalStack

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
bun install

# Install LocalStack (for local S3 emulation)
pip install localstack

# Optional: Install LocalStack AWS CLI wrapper
pip install awscli-local
```

### Step 2: Start LocalStack

```bash
# Start LocalStack in a separate terminal
localstack start

# In another terminal, verify LocalStack is running
localstack status

# Optional: Test S3 access
aws --endpoint-url=http://localhost:4566 s3 ls
```

**Keep LocalStack running** in the background while you develop.

### Step 3: Start Backend Services

```bash
# Start your Core API backend service
# It should run on http://localhost:5002
# (Use your backend's specific start command)

# Example (adjust based on your backend):
cd ../audiscope-backend
go run main.go
# or
npm start
# or
docker-compose up
```

### Step 4: Start Frontend

```bash
# Start Next.js development server (automatically uses .env.development)
bun local
```

This command automatically loads `.env.development` with:
- ✅ Real AWS Cognito credentials (for authentication)
- ✅ Real AWS API Gateway URL (for audio assessments)
- ✅ Local Core API URL (http://localhost:5002)
- ✅ LocalStack S3 override (http://localhost:4566)

The application will be available at: **http://localhost:3000**

### Step 5: Verify Setup

1. **Open browser:** Navigate to http://localhost:3000
2. **Check console:** Look for startup logs showing:
   - ✅ API endpoints being used
   - ✅ LocalStack URL transformation active
   - ✅ No environment variable errors

3. **Test authentication:**
   - Go to `/login`
   - Sign in or create a new account
   - Verify you're redirected to dashboard

4. **Test file upload:**
   - Navigate to Products section
   - Try uploading a file
   - Check browser Network tab for successful S3 PUT request to LocalStack

---

## Environment Variables Reference

### Core Variables (Required)

| Variable | Description | Dev-Cloud | LocalStack Dev |
|----------|-------------|-----------|----------------|
| `KEYCLOAK_ISSUER` | Keycloak issuer URL | `http://localhost:8080/realms/audiscope` | Same |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `audiscope-web` | Same |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | From Keycloak | Same |
| `NEXTAUTH_URL` | NextAuth base URL | `http://audiscope.localhost:3000` | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret | Generated secret | Same |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Public Keycloak URL | `http://localhost:8080` | Same |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Public Keycloak realm | `audiscope` | Same |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Public Keycloak client | `audiscope-web` | Same |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Audio pipeline API | AWS Gateway URL | AWS Gateway URL |
| `CORE_API_URL` | Core API for rewrites (server-side) | Dev ALB URL + `/api` | `http://localhost:5002/api` |
| `NEXT_PUBLIC_KNOWLEDGE_BASE_ID` | Bedrock KB ID | `5WDOTFQ8QC` | `5WDOTFQ8QC` |
| `DEV_TENANT` | Default tenant for localhost | `audiscope` | `audiscope` |

**Note:** Core API calls use Next.js proxy routes (`/api/core/*`) that rewrite to `CORE_API_URL` server-side. Backend URL is never exposed to browser.

### Optional Variables

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE` | LocalStack S3 endpoint | Local dev with LocalStack only |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | Production monitoring |
| `SENTRY_AUTH_TOKEN` | Sentry source maps | Production builds |

---

## Switching Between Environments

Environment switching is now automatic - just use the corresponding npm script:

### Switch to Dev-Cloud (All Cloud Resources)

```bash
bun prod
```

Uses `.env.dev-cloud` automatically - all cloud resources, no manual configuration needed.

### Switch to LocalStack Development

```bash
# Make sure LocalStack is running first
localstack start

# In another terminal:
bun local
```

Uses `.env.development` automatically with LocalStack S3 and local backend.

**Note:** Each command automatically uses its corresponding environment configuration via `dotenv-cli`.

---

## Common Issues and Solutions

### Issue: "API endpoint not configured"

**Cause:** Missing `NEXT_PUBLIC_API_GATEWAY_URL` in your environment file

**Solution:**
```bash
# Check if variable is set in .env.dev-cloud
grep NEXT_PUBLIC_API_GATEWAY_URL .env.dev-cloud

# If missing, add it:
echo "NEXT_PUBLIC_API_GATEWAY_URL=https://your-gateway-url" >> .env.dev-cloud

# Restart dev server
bun prod
```

### Issue: File upload fails with CORS error

**LocalStack:**
- Verify LocalStack is running: `localstack status`
- Check LocalStack logs for errors
- Verify `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566` is set

**Real AWS S3:**
- Check S3 bucket CORS configuration
- Verify presigned URLs are being generated correctly
- Check browser console for specific error messages

### Issue: Authentication fails (401/403)

**Solution:**
1. Verify Keycloak credentials in your environment file
2. Ensure Keycloak is running on `localhost:8080`
3. Clear browser localStorage: `localStorage.clear()`
4. Clear browser cookies for localhost
5. Try logging in again
6. Check browser console for specific auth errors

### Issue: Backend connection refused

**Local Backend:**
```bash
# Check if backend is running
curl http://localhost:5002/api/health

# If not running, start your backend service
cd ../audiscope-backend
# Use your backend's start command
```

**Deployed Backend:**
```bash
# Test backend connectivity
curl https://api-dev.audiscope.com/api/health

# Check if URL in .env.dev-cloud is correct
grep CORE_API_URL .env.dev-cloud
```

### Issue: LocalStack S3 upload fails

**Solution:**
```bash
# Restart LocalStack with verbose logs
localstack start --debug

# Check LocalStack S3 service status
aws --endpoint-url=http://localhost:4566 s3 ls

# Verify environment variable is set in .env.development
grep S3_ENDPOINT_OVERRIDE .env.development

# Should output:
# NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566
```

---

## Architecture Quick Reference

AudiScope uses a **dual backend architecture**:

### Backend 1: AWS API Gateway
- **Purpose:** Audio assessment pipeline
- **Tech:** AWS Lambda, API Gateway
- **Used for:** Audio uploads, transcription, AI analysis
- **Endpoint:** `NEXT_PUBLIC_API_GATEWAY_URL`
- **Service file:** `lib/audio-pipeline-api.service.ts`

### Backend 2: Core API
- **Purpose:** Product and file management
- **Tech:** Go backend (or your backend stack)
- **Used for:** Products, files, knowledge base, chat
- **Endpoint:** `/api/core/*` (proxied to `CORE_API_URL`)
- **Service files:** `lib/service/product.service.ts`, `lib/service/product-files.service.ts`

**Both backends:**
- Use JWT authentication from Keycloak via NextAuth
- Automatically include `Authorization: Bearer <token>` headers
- Support automatic token refresh on expiration

---

## Development Workflow Tips

### Daily Development Routine

**Using Dev-Cloud (Recommended):**

```bash
# Just start and go!
bun prod
```

That's it! All backend services are already running in the cloud. Develop and test at http://localhost:3000

**Using LocalStack:**

```bash
# Terminal 1: Start LocalStack
localstack start

# Terminal 2: Start Backend (if running locally)
cd ../backend && go run main.go

# Terminal 3: Start Frontend
bun local
```

Develop and test at http://localhost:3000

### Before Committing Code

```bash
# Run linter
bun lint

# Run type checking
bun typecheck

# Test production build
bun run build
```

---

## Additional Resources

- **Full Documentation:** See [CLAUDE.md](./CLAUDE.md) for complete project documentation
- **Environment Variables:** See [.env.example](./.env.example) for all available variables
- **API Documentation:** See files in `docs/` directory
- **Architecture Details:** See [GEMINI.md](./GEMINI.md) for AI agent context

---

## Quick Commands Reference

```bash
# Install dependencies
bun install

# Development servers (automatically load correct env file)
bun prod       # Dev-cloud: All AWS resources (recommended)
bun local      # Local: LocalStack + local backend

# Build and quality checks
bun run build  # Build for production
bun lint       # Run linter
bun typecheck  # Type checking

# LocalStack commands (for bun local)
localstack start   # Start LocalStack
localstack status  # Check LocalStack status
localstack stop    # Stop LocalStack
```

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check browser console** for detailed error messages
2. **Check Network tab** in DevTools for failed requests
3. **Review CLAUDE.md** for detailed architecture documentation
4. **Check backend logs** if backend-related issues
5. **Ask the team** in your development Slack/chat channel

---

**Happy coding! 🚀**
