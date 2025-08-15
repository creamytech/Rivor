# Rivor Authentication Flow - Complete Specification

## Overview
This document specifies every screen, state, and interaction in the Rivor login experience to ensure zero guesswork during implementation.

## Routes
- `/signin` - Public signin page (redirects to `/auth/signin`)
- `/auth/signin` - Main authentication interface
- `/auth/error` - Public error handling page
- `/app` - Auth-gated main application
- `/auth/callback` - OAuth callback handling (internal)

## Authentication States

### 1. Default State (Signed Out)
**Route**: `/auth/signin`
**Condition**: No valid session exists
**UI Elements**:
- Rivor wordmark (no icon lockup)
- Heading: "Sign in to Rivor"
- Subcopy: "Secure SSO via Google or Microsoft"
- Google OAuth button: "Continue with Google" (Google logo left, solid blue)
- Microsoft OAuth button: "Continue with Microsoft" (Microsoft logo left, solid blue)
- Legal footer: "By continuing you agree to our Terms & Privacy."
- Security badges: "SOC 2 ready", "OAuth 2.0"
- Links: Terms, Privacy, Security

**Actions**:
- Click Google → `/api/auth/signin/google`
- Click Microsoft → `/api/auth/signin/azure-ad`
- Click Terms → `/terms`
- Click Privacy → `/privacy`
- Click Security → `/security`

### 2. Loading State (Auth in Progress)
**Trigger**: User clicks provider button
**Duration**: 200-5000ms (typical OAuth flow)
**UI Changes**:
- Clicked button shows spinner + "Signing in..."
- Other button becomes disabled (opacity 50%)
- Page prevents navigation
- Loading state maintains accessibility

**Fallback**: If >10s, show "Taking longer than expected" with retry option

### 3. Success State (Redirecting)
**Trigger**: OAuth success callback received
**Duration**: 100-500ms
**UI Changes**:
- Brief success indicator (optional green checkmark)
- "Redirecting to Rivor..." message
- Automatic redirect to destination

**Redirect Logic**:
- First-time user → `/app` with onboarding overlay
- Returning user → last visited `/app` route (fallback `/app`)
- Deep link user → original protected URL

### 4. Error State (Authentication Failed)
**Route**: `/auth/error?error={errorCode}`
**Triggers**:
- OAuth denied/revoked
- Provider unavailable
- Invalid token/expired session
- CSRF failure
- Rate limiting

**Error Messages by Code**:
- `OAuthCallback` → "We couldn't complete sign-in. Try again or use a different provider."
- `AccessDenied` → "Access was denied. Please check your permissions and try again."
- `Verification` → "Email verification required. Check your inbox."
- `Configuration` → "Provider unavailable. Please try again later."
- `Callback` → "Authentication failed. Please try signing in again."
- Default → "An error occurred during sign-in. Please try again."

**UI Elements**:
- Error icon (red warning triangle)
- Error title and description
- Retry buttons for both Google and Microsoft
- "Contact Support" link
- "System Status" link (status.rivor.com)

**Actions**:
- Retry Google → `/api/auth/signin/google`
- Retry Microsoft → `/api/auth/signin/azure-ad`
- Contact Support → `/help`
- Return to Home → `/`

### 5. Re-auth Required State
**Trigger**: Session exists but tokens are invalid/expired
**Route**: `/app` (with banner) or redirect to `/auth/signin`
**Implementation**: Two approaches

**Approach A - Banner in App**:
- Red/yellow banner at top of `/app`
- Message: "Your session has expired. Please reconnect your account."
- "Reconnect" button → `/auth/signin?reauth=true`
- User can still view cached data

**Approach B - Forced Redirect**:
- Automatic redirect to `/auth/signin?expired=true`
- Special message: "Your session expired. Sign in again to continue."
- After re-auth, return to original `/app` route

### 6. Org Invite/Join Flow (Optional)
**Route**: `/auth/signin?invite={token}`
**Trigger**: User clicks organization invite link
**Sequence**:
1. Show invite details (org name, inviter, permissions)
2. "Join [Org Name]" button triggers normal OAuth
3. After auth success, automatically join organization
4. Redirect to org-specific `/app` view

**UI Additions**:
- Invite card above signin form
- "Joining [Organization Name]" context
- Invite accepter: "[Inviter Name] invited you to join"

## Page Navigation Flow

```
[Landing /] 
    ↓ Click "Sign In"
[/auth/signin] 
    ↓ Click Provider
[OAuth Provider] 
    ↓ Success
[/auth/callback] 
    ↓ Process
[/app] (authenticated)

OR

[/auth/signin] 
    ↓ Click Provider  
[OAuth Provider] 
    ↓ Error/Denial
[/auth/error] 
    ↓ Retry
[/auth/signin]
```

## Security & Compliance Requirements

### Rate Limiting
- Max 5 sign-in attempts per IP per 15 minutes
- Max 3 failed attempts per email per hour
- Generic error messages (no user enumeration)

### CSRF Protection
- `state` parameter validation on OAuth callbacks
- SameSite cookie attributes
- Origin header validation

### Session Management
- JWT tokens with 24-hour expiry
- Refresh token rotation
- Secure cookie flags (HttpOnly, Secure, SameSite)

### Audit Logging
- All auth events logged with correlation IDs
- Redacted PII in logs
- Failed attempt monitoring

## Error Recovery Matrix

| Error Scenario | User Action | System Response |
|---------------|-------------|-----------------|
| Provider denied | Retry, try other provider | Clear error, allow retry |
| Network timeout | Retry same provider | Retry with exponential backoff |
| Invalid redirect | Contact support | Log incident, show support info |
| Expired invite | Request new invite | Show invite expiry message |
| Account disabled | Contact admin | Show admin contact info |

## Mobile Considerations
- 44px minimum touch targets
- Thumb-reachable button placement
- No horizontal scrolling
- Zoom accessibility
- Viewport meta tag: `width=device-width, initial-scale=1`

## Analytics & Telemetry Events

### Page View Events
- `auth_page_viewed` - User lands on signin page
- `auth_error_viewed` - User sees error page

### Interaction Events  
- `auth_provider_clicked` - Which provider button clicked
- `auth_provider_returned` - OAuth callback received
- `auth_success` - Successfully authenticated
- `auth_error` - Authentication failed with error code

### Performance Events
- `auth_page_load_time` - Time to interactive
- `auth_flow_duration` - Total signin completion time

All events include correlation ID for debugging and session replay.

## Acceptance Criteria
✅ All 6 states documented with precise UI specifications
✅ Every button/link destination mapped
✅ Error handling covers all OAuth failure modes
✅ Mobile responsive design requirements specified
✅ Security controls documented for SOC 2 compliance
✅ Analytics events defined for observability
✅ Zero ambiguity - ready for implementation

