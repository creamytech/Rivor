# Rivor Robust Google Onboarding - QA Test Matrix

This document outlines comprehensive test scenarios for the robust Google Account onboarding system as specified in Milestone 8.

## Test Environment Setup

### Prerequisites
- PostgreSQL database with latest migrations applied
- Redis instance for queue processing
- KMS provider configured (or test with KMS failures)
- Google OAuth credentials configured
- All worker processes running

### Test Data Setup
```bash
# Apply database migrations
cd packages/db && npx prisma migrate deploy

# Start workers
npm run dev:workers

# Verify queue connectivity
redis-cli ping
```

## Core Test Scenarios

### 1. KMS Healthy Scenarios

#### Test 1.1: Fresh Google Connect (Happy Path)
**Scenario**: First-time user connects Google account with healthy KMS

**Steps**:
1. Navigate to `/auth/signin`
2. Click "Sign in with Google"
3. Complete OAuth flow with full scopes
4. Verify redirect to `/app`

**Expected Results**:
- ✅ Organization created with proper encryption key
- ✅ EmailAccount created with `status='connected'`
- ✅ `encryptionStatus='ok'`
- ✅ Tokens stored in SecureToken table
- ✅ Initial sync job scheduled
- ✅ Integrations panel shows "Connected"
- ✅ Health probe shows success

**Database Verification**:
```sql
SELECT * FROM "Org" WHERE "name" = 'user@example.com';
SELECT * FROM "EmailAccount" WHERE "provider" = 'google';
SELECT * FROM "SecureToken" WHERE "encryptionStatus" = 'ok';
```

**Logs to Check**:
- OAuth callback summary with `kmsStatus='ok'`
- Token encryption success logs
- Initial sync scheduled logs

#### Test 1.2: Existing User Reconnect
**Scenario**: Existing user reconnects Google account

**Steps**:
1. User with existing org connects Google again
2. Complete OAuth flow

**Expected Results**:
- ✅ No duplicate Organization created
- ✅ EmailAccount updated/upserted correctly
- ✅ New tokens encrypted and stored
- ✅ Status updated to connected

**Verification**: Check that `Org.createdAt` is not updated, only `EmailAccount.updatedAt`

### 2. KMS Down Scenarios

#### Test 2.1: KMS Down at Connect
**Scenario**: User connects Google while KMS is unavailable

**Setup**: 
- Temporarily disable KMS or provide invalid KMS configuration
- Or mock KMS client to throw errors

**Steps**:
1. Attempt Google OAuth flow
2. Complete authentication

**Expected Results**:
- ✅ Organization still created (with fallback encryption)
- ✅ EmailAccount created with `encryptionStatus='failed'`
- ✅ `status='action_needed'`
- ✅ SecureToken entries created with `encryptionStatus='failed'`
- ✅ User redirected to `/app` (not blocked)
- ✅ Integration panel shows "Action Needed"
- ✅ TokenHealthBanner displays retry option

**Database Verification**:
```sql
SELECT * FROM "EmailAccount" WHERE "encryptionStatus" = 'failed';
SELECT * FROM "SecureToken" WHERE "encryptionStatus" = 'failed';
```

**Logs to Check**:
- OAuth callback summary with `kmsStatus='failed'`
- KMS failure logs with error codes
- Fallback encryption warnings

#### Test 2.2: User Reconnects Later (KMS Recovery)
**Scenario**: After KMS is restored, user retries connection

**Setup**: 
- Restore KMS functionality
- User from Test 2.1 clicks "Retry" button

**Steps**:
1. Click "Retry" in TokenHealthBanner
2. Complete OAuth re-flow

**Expected Results**:
- ✅ `encryptionStatus` updated to 'ok'
- ✅ `status` flips to 'connected'
- ✅ Initial sync starts
- ✅ Integration panel shows "Connected"
- ✅ Banner disappears

**Verification**: Check that token encryption retry jobs succeeded

### 3. Idempotency Tests

#### Test 3.1: Duplicate Connect Clicks
**Scenario**: User clicks back button or refreshes during OAuth flow

**Steps**:
1. Start OAuth flow
2. During callback processing, simulate multiple requests
3. Click back and forward in browser
4. Complete OAuth again

**Expected Results**:
- ✅ No duplicate Organizations created
- ✅ No duplicate EmailAccounts created
- ✅ Idempotency checks prevent data corruption
- ✅ Same result as single connection

**Verification**: Check unique constraints are enforced and duplicate detection works

### 4. Scope and Permission Tests

#### Test 4.1: Insufficient Scopes
**Scenario**: User grants only partial permissions

**Setup**: Configure OAuth with limited scopes (e.g., only email, no calendar)

**Steps**:
1. Connect with limited scopes
2. Check integration status

**Expected Results**:
- ✅ Account created but marked as `status='action_needed'`
- ✅ UI shows "Insufficient Permissions"
- ✅ Clear messaging about missing scopes
- ✅ Reconnect option available

#### Test 4.2: Scope Upgrade
**Scenario**: User reconnects with full permissions

**Steps**:
1. From Test 4.1, click "Reconnect"
2. Grant full permissions

**Expected Results**:
- ✅ Status updated to 'connected'
- ✅ All required scopes now available
- ✅ Full functionality enabled

### 5. Token Expiration and Revocation

#### Test 5.1: Token Expiration
**Scenario**: Simulate expired tokens

**Setup**: Manually update token expiry in database or wait for natural expiry

**Steps**:
1. Wait for tokens to expire or manually expire them
2. Trigger health probe

**Expected Results**:
- ✅ Health probe detects expired tokens
- ✅ Status changes to 'action_needed'
- ✅ UI prompts for reconnection

#### Test 5.2: User Revokes in Google
**Scenario**: User revokes app access in Google Account settings

**Steps**:
1. Go to Google Account settings
2. Revoke access to Rivor app
3. Wait for next health probe

**Expected Results**:
- ✅ Health probe fails with 401/403 error
- ✅ Status changes to 'disconnected'
- ✅ UI shows "Disconnected" state
- ✅ Reconnect option available

### 6. Queue and Worker Tests

#### Test 6.1: Token Encryption Queue Processing
**Scenario**: Verify queue jobs process correctly

**Setup**: 
- Ensure workers are running
- Create failed encryption job

**Steps**:
1. Trigger token encryption failure
2. Verify retry job is queued
3. Monitor job processing

**Expected Results**:
- ✅ Jobs queued with correct retry strategy
- ✅ Exponential backoff implemented
- ✅ Dead letter handling after max retries
- ✅ Proper error logging

#### Test 6.2: Initial Sync Queue
**Scenario**: Verify sync jobs only start after successful encryption

**Steps**:
1. Connect account with encryption failure
2. Verify no sync job scheduled
3. Fix encryption
4. Verify sync job now starts

**Expected Results**:
- ✅ Sync waits for encryption success
- ✅ Dependency ordering maintained
- ✅ No data corruption

### 7. UI Truth Model Tests

#### Test 7.1: Integration Panel States
**Scenario**: Verify UI correctly reflects all possible states

**Test all combinations**:
- Connected + Encryption OK + Recent probe success = "Connected"
- Connected + Encryption Failed = "Encryption Failed" 
- Action Needed + Missing tokens = "Missing Tokens"
- Action Needed + Probe failure = "Health Check Failed"
- Action Needed + Insufficient scopes = "Insufficient Permissions"
- Disconnected = "Disconnected"

**Expected Results**:
- ✅ UI status matches database state
- ✅ Appropriate actions available for each state
- ✅ Clear user messaging

#### Test 7.2: Health Probe UI
**Scenario**: Test health probe button functionality

**Steps**:
1. Click "Check Now" button
2. Monitor API calls and UI updates

**Expected Results**:
- ✅ Button shows loading state
- ✅ API call made to health probe endpoint
- ✅ UI updates with probe results
- ✅ Status reflects current health

### 8. Error Handling and Recovery

#### Test 8.1: Database Connection Failure
**Scenario**: Simulate database unavailability during OAuth

**Setup**: Temporarily disconnect database

**Expected Results**:
- ✅ OAuth flow fails gracefully
- ✅ User sees appropriate error message
- ✅ No partial data corruption
- ✅ Retry available when DB restored

#### Test 8.2: Redis Queue Failure
**Scenario**: Redis unavailable during token encryption

**Expected Results**:
- ✅ Account still created
- ✅ Encryption attempted synchronously as fallback
- ✅ Jobs queued when Redis restored

### 9. Security Tests

#### Test 9.1: Token Storage Security
**Scenario**: Verify tokens never stored in plain text

**Steps**:
1. Connect account
2. Inspect all database tables
3. Check application logs

**Expected Results**:
- ✅ No plain text tokens in database
- ✅ No tokens in application logs
- ✅ All sensitive data encrypted

#### Test 9.2: KMS Key Rotation
**Scenario**: Test behavior during KMS key rotation

**Expected Results**:
- ✅ Existing data remains accessible
- ✅ New data uses new key version
- ✅ Graceful transition

### 10. Monitoring and Alerting

#### Test 10.1: Metrics Collection
**Scenario**: Verify metrics API returns accurate data

**Steps**:
1. Create various account states
2. Call `/api/metrics/integrations`
3. Verify metrics accuracy

**Expected Results**:
- ✅ Accurate counts and percentages
- ✅ Health scores calculated correctly
- ✅ Alerts generated for issues

#### Test 10.2: Alert Generation
**Scenario**: Trigger various alert conditions

**Test alerts for**:
- High KMS failure rate (>10%)
- Dead letter jobs (>5)
- Low health probe success rate (<90%)
- Queue backlog (>50 jobs)
- Low connection rate (<80%)

**Expected Results**:
- ✅ Alerts generated at correct thresholds
- ✅ Alert levels (warning/critical) appropriate
- ✅ Structured logging includes alert data

## Automated Test Implementation

### Unit Tests
```typescript
// Example test structure
describe('OAuth Onboarding', () => {
  describe('KMS Healthy', () => {
    it('should create org and email account on first connect');
    it('should encrypt tokens successfully');
    it('should schedule initial sync');
  });
  
  describe('KMS Failures', () => {
    it('should create account with failed encryption status');
    it('should allow retry when KMS restored');
  });
  
  describe('Idempotency', () => {
    it('should handle duplicate callback requests');
  });
});
```

### Integration Tests
```typescript
describe('End-to-End OAuth Flow', () => {
  it('should handle complete Google OAuth flow');
  it('should handle health probes correctly');
  it('should process queue jobs properly');
});
```

### Load Tests
- Test with multiple concurrent OAuth flows
- Verify queue processing under load
- Test KMS failure scenarios at scale

## Performance Benchmarks

### Response Time Targets
- OAuth callback processing: <2 seconds
- Health probe: <1 second  
- Integration status API: <500ms
- Metrics collection: <5 seconds

### Throughput Targets
- Concurrent OAuth flows: 100/minute
- Queue job processing: 50 jobs/second
- Health probes: 1000/hour

## Sign-off Criteria

### All tests must pass:
- ✅ KMS healthy scenarios work perfectly
- ✅ KMS failures don't block account creation
- ✅ Recovery works when KMS restored
- ✅ Idempotency prevents duplicates
- ✅ All UI states display correctly
- ✅ Health probes detect issues
- ✅ Queue processing is reliable
- ✅ Monitoring provides accurate metrics
- ✅ Security requirements met
- ✅ Performance targets achieved

### Documentation complete:
- ✅ All test cases documented
- ✅ Expected behaviors defined
- ✅ Monitoring setup documented
- ✅ Recovery procedures documented

### Production readiness:
- ✅ All migrations tested
- ✅ Worker deployment verified
- ✅ Monitoring configured
- ✅ Alerting rules active
- ✅ Rollback procedures ready
