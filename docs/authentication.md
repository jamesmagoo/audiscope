# Authentication System

AudiScope uses AWS Amplify Authentication for secure user management with email-based signup/signin.

## Authentication Architecture

**Components:**
- `components/auth-provider.tsx` - React Context provider for authentication state
- `components/auth-guard.tsx` - Route protection wrapper component
- `lib/auth-config.ts` - AWS Amplify configuration
- `app/layout.tsx` - Root layout wrapped with AuthProvider
- `app/dashboard/layout.tsx` - Dashboard layout wrapped with AuthGuard

**Authentication Flow:**
1. User visits protected route (dashboard)
2. AuthGuard checks authentication status via AuthProvider
3. Unauthenticated users redirected to `/login`
4. After successful login, users can access protected routes

## Authentication Pages

**Login Page (`app/login/page.tsx`):**
- Email/password authentication
- Form validation with error handling
- Success message display from URL params (post-signup confirmation)
- AudiScope branding

**Signup Page (`app/signup/page.tsx`):**
- Two-step process: registration → email confirmation
- Password strength validation
- Email confirmation with 6-digit code
- Auto-redirect to login after successful confirmation
- Resend confirmation code functionality

**Password Reset:**
- `app/forgot-password/page.tsx` - Password reset initiation
- `app/reset-password/page.tsx` - Password reset confirmation

## AuthProvider Functions

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInUser: (username: string, password: string) => Promise<void>
  signUpUser: (username: string, password: string, email: string) => Promise<void>
  signOutUser: () => Promise<void>
  confirmSignUpUser: (username: string, code: string) => Promise<void>
  resendConfirmationCode: (username: string) => Promise<void>
  forgotPassword: (username: string) => Promise<void>
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>
  // JWT-related functions
  getAuthHeaders: () => Promise<Record<string, string>>
  getUserId: () => Promise<string | null>
}
```

### JWT Authentication Features

The AuthProvider provides JWT functionality by importing from `lib/api-utils.ts`:

- **No Code Duplication**: Imports `getAuthHeaders()` and `getCurrentUserId()` from api-utils
- **Interface Wrapper**: `getUserId()` wraps `getCurrentUserId()` to return `null` on errors (maintains backward compatibility)
- **Clean Architecture**: Focuses on auth state management rather than duplicating JWT logic
- **Single Source of Truth**: All JWT operations centralized in api-utils module

## User Interface Integration

**Landing Page (`app/page.tsx`):**
- Conditional navigation: "Sign In" for unauthenticated, "Dashboard" for authenticated users
- Dynamic CTA buttons based on auth state

**Dashboard Sidebar (`components/dashboard/app-sidebar.tsx`):**
- Real user email and username display
- Smart initial generation from email
- Text truncation for long usernames/emails
- Styled logout button with hover effects
- Professional user avatar with gradient background

## Route Protection

```typescript
// Dashboard protection example
<AuthGuard>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>{children}</SidebarInset>
  </SidebarProvider>
</AuthGuard>
```

## Development Notes

- Authentication state persists across browser sessions
- Loading states handled during auth operations
- Error handling with user-friendly messages
- Automatic redirects maintain smooth user experience
- All authentication pages use consistent AudiScope branding
- **JWT Integration**: All API calls automatically include authentication headers
- **Token Management**: Transparent token refresh on expiration
- **Security**: Real user context from JWT payload instead of hardcoded values
- **Clean Architecture**: JWT utilities centralized in `lib/api-utils.ts` with no code duplication
- **Separation of Concerns**: AuthProvider focuses on state management, api-utils handles JWT operations
