# AudiScope Development Environment Setup

Quick-start guide for setting up your development environment with real AWS resources.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and **pnpm** installed
- **Python 3** (for LocalStack, optional)
- **AWS CLI** (optional, for testing LocalStack)
- Access to AudiScope AWS resources (Cognito, API Gateway, etc.)
- Backend API deployed or running locally

## Quick Setup (Automated)

The fastest way to get started is using the setup script:

```bash
# Run the automated setup script
./setup-env.sh

# Follow the prompts to create your environment files
# Press Enter to accept default values or provide your own
```

This creates three environment files locally:
- `.env.dev-cloud` - Cloud development (recommended)
- `.env.development` - Local development with LocalStack
- `.env.staging` - Staging environment

**Note:** These files are gitignored and will NOT be committed for security.

## Setup Options

Choose the setup that matches your development needs:

### Option 1: Development with All Cloud Resources (Recommended)

Best for: Team collaboration, daily development, real AWS testing, integration work

### Option 2: Local Development with LocalStack

Best for: Offline development, feature work, testing without AWS costs

### Option 3: Staging Environment Testing

Best for: Pre-production testing, staging verification, final QA

---

## Option 1: Development with All Cloud Resources

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
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
pnpm dev
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
pnpm install

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
pnpm local
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

## Option 3: Staging Environment Testing

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
```

### Step 2: Update Staging Configuration

Before using staging, ensure `.env.staging` has the correct Core API URL:

```bash
# Edit .env.staging if needed
nano .env.staging

# Update these lines with your staging API URL:
# NEXT_PUBLIC_API_URL=https://api-staging.audiscope.com
# NEXT_PUBLIC_CORE_API_URL=https://api-staging.audiscope.com/api
```

**Important:** Make sure `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE` is NOT set in `.env.staging`.

### Step 3: Verify AWS Resources

Ensure you have access to:
- ✅ AWS Cognito User Pool (for authentication)
- ✅ AWS API Gateway (for audio assessments)
- ✅ Deployed Staging Core API (for products and files)
- ✅ AWS S3 Buckets (via backend presigned URLs)
- ✅ AWS Bedrock Knowledge Base (for AI chat)

### Step 4: Start Frontend

```bash
# Start Next.js development server (automatically uses .env.staging)
pnpm staging
```

The application will be available at: **http://localhost:3000**

### Step 5: Verify Setup

1. **Open browser:** Navigate to http://localhost:3000
2. **Check console:** Look for startup logs showing real AWS endpoints
3. **Test authentication:** Login with your AWS Cognito credentials
4. **Test file upload:** Upload a file to verify S3 presigned URLs work
5. **Check Network tab:** Verify requests are going to real AWS endpoints

---

## Environment Variables Reference

### Core Variables (Required)

| Variable | Description | Dev-Cloud | LocalStack Dev | Staging/Prod |
|----------|-------------|-----------|----------------|--------------|
| `NEXT_PUBLIC_AWS_REGION` | AWS region | `eu-west-1` | `eu-west-1` | `eu-west-1` |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID | `eu-west-1_90PVu1scA` | Same | Same |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito Client ID | `4o01ocufgcskol74rr8cim7afq` | Same | Same |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Audio pipeline API | AWS Gateway URL | AWS Gateway URL | AWS Gateway URL |
| `NEXT_PUBLIC_API_URL` | Core API base URL | Dev ALB URL | `http://localhost:5002` | `https://api.example.com` |
| `NEXT_PUBLIC_CORE_API_URL` | Core API with path | Dev ALB URL + `/api` | `http://localhost:5002/api` | `https://api.example.com/api` |
| `NEXT_PUBLIC_KNOWLEDGE_BASE_ID` | Bedrock KB ID | `5WDOTFQ8QC` | `5WDOTFQ8QC` | `5WDOTFQ8QC` |

### Optional Variables

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE` | LocalStack S3 endpoint | Local dev with LocalStack only |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | Production/staging monitoring |
| `SENTRY_AUTH_TOKEN` | Sentry source maps | Production builds |

---

## Switching Between Environments

Environment switching is now automatic - just use the corresponding npm script:

### Switch to Dev-Cloud (All Cloud Resources)

```bash
pnpm dev
```

Uses `.env.dev-cloud` automatically - all cloud resources, no manual configuration needed.

### Switch to LocalStack Development

```bash
# Make sure LocalStack is running first
localstack start

# In another terminal:
pnpm local
```

Uses `.env.development` automatically with LocalStack S3 and local backend.

### Switch to Staging Environment

```bash
pnpm staging
```

Uses `.env.staging` automatically for staging/production AWS resources.

**No more manual copying of `.env` files!** Each command automatically uses its corresponding environment configuration.

---

## Common Issues and Solutions

### Issue: "API endpoint not configured"

**Cause:** Missing `NEXT_PUBLIC_API_GATEWAY_URL` in `.env.local`

**Solution:**
```bash
# Check if variable is set
grep NEXT_PUBLIC_API_GATEWAY_URL .env.local

# If missing, add it:
echo "NEXT_PUBLIC_API_GATEWAY_URL=https://your-gateway-url" >> .env.local

# Restart dev server
pnpm dev
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
1. Verify Cognito credentials in `.env.local`
2. Clear browser localStorage: `localStorage.clear()`
3. Clear browser cookies for localhost
4. Try logging in again
5. Check browser console for specific auth errors

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

# Check if URL in .env.local is correct
grep NEXT_PUBLIC_CORE_API_URL .env.local
```

### Issue: LocalStack S3 upload fails

**Solution:**
```bash
# Restart LocalStack with verbose logs
localstack start --debug

# Check LocalStack S3 service status
aws --endpoint-url=http://localhost:4566 s3 ls

# Verify environment variable is set
grep S3_ENDPOINT_OVERRIDE .env.local

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
- **Endpoint:** `NEXT_PUBLIC_CORE_API_URL`
- **Service files:** `lib/product.service.ts`, `lib/product-files.service.ts`

**Both backends:**
- Use JWT authentication from AWS Cognito
- Automatically include `Authorization: Bearer <token>` headers
- Support automatic token refresh on expiration

---

## Development Workflow Tips

### Daily Development Routine

**Using Dev-Cloud (Recommended):**

```bash
# Just start and go!
pnpm dev
```

That's it! All backend services are already running in the cloud. Develop and test at http://localhost:3000

**Using LocalStack:**

```bash
# Terminal 1: Start LocalStack
localstack start

# Terminal 2: Start Backend (if running locally)
cd ../backend && go run main.go

# Terminal 3: Start Frontend
pnpm local
```

Develop and test at http://localhost:3000

### Before Committing Code

```bash
# Run linter
pnpm lint

# Run type checking
pnpm typecheck

# Test production build
pnpm build
```

### Testing Against Staging

```bash
# Use staging environment
pnpm staging

# Test your changes...

# Switch back to dev-cloud
pnpm dev
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
pnpm install

# Development servers (automatically load correct env file)
pnpm dev        # Dev-cloud: All AWS resources (recommended)
pnpm local      # Local: LocalStack + local backend
pnpm staging    # Staging: Staging AWS environment

# Build and quality checks
pnpm build      # Build for production
pnpm lint       # Run linter
pnpm typecheck  # Type checking

# LocalStack commands (for pnpm local)
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
