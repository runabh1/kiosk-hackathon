# Single-Interaction Guarantee Mode (SIGM) - Implementation Guide

## Overview

SIGM is a feature that ensures citizens' requests at SUVIDHA kiosks are guaranteed to be completable without repeat visits or resubmissions. The system performs pre-submission validation checks and provides clear, citizen-friendly feedback about whether their request can be immediately fulfilled.

## Architecture

### Backend Components

#### 1. Database Models (`packages/database/prisma/schema.prisma`)

New models added:
- **`SIGMLog`**: Records every guarantee check performed
- **`RequestLock`**: Prevents duplicate submissions
- **`BackendActionQueue`**: Queues follow-up actions for non-guaranteed requests

New enums:
- **`GuaranteeStatus`**: GUARANTEED, NOT_GUARANTEED, BLOCKED
- **`RequestType`**: BILL_PAYMENT, NEW_CONNECTION, COMPLAINT_REGISTRATION, etc.
- **`BackendActionStatus`**: PENDING, IN_PROGRESS, COMPLETED, FAILED

#### 2. SIGM Service (`apps/api/src/modules/sigm/service.ts`)

Core functions:
- `performGuaranteeCheck()`: Main validation entry point
- `validateDocuments()`: Checks for required documents
- `checkServiceAvailability()`: Verifies service is available in the citizen's area
- `checkBackendDependencies()`: Checks technician availability, capacity, etc.
- `checkForDuplicates()`: Prevents duplicate submissions
- `checkRequestLock()`: Checks if a similar request is already locked
- `createRequestLock()`: Creates a lock to prevent duplicates
- `logSIGMCheck()`: Logs the check result
- `acknowledgeSIGMCheck()`: Records citizen acknowledgment
- `recordSIGMSubmission()`: Links the SIGM log to the created request
- `queueBackendActions()`: Queues follow-up actions

#### 3. SIGM Routes (`apps/api/src/modules/sigm/routes.ts`)

API Endpoints:
- `POST /api/sigm/check`: Perform pre-submission guarantee check
- `POST /api/sigm/acknowledge`: Record citizen acknowledgment
- `POST /api/sigm/check-lock`: Check if a request is locked
- `POST /api/sigm/record-submission`: Record actual submission
- `GET /api/sigm/history`: Get user's SIGM check history
- `GET /api/sigm/analytics`: Get SIGM analytics for admin dashboard
- `GET /api/sigm/backend-actions`: Get pending backend actions
- `PUT /api/sigm/backend-actions/:id`: Update backend action status

### Frontend Components

#### 1. Guarantee Check Modal (`apps/web/src/components/kiosk/GuaranteeCheckModal.tsx`)

A modal that displays the guarantee check result with:
- Color-coded status (Green = Guaranteed, Amber = Not Guaranteed, Red = Blocked)
- Citizen-friendly messages in English and Hindi
- Detailed blocking reasons with resolution hints
- Backend actions queue (for NOT_GUARANTEED)
- Acknowledgment checkbox for non-guaranteed requests
- Technical details (expandable)

#### 2. useSIGM Hook (`apps/web/src/lib/hooks/useSIGM.ts`)

A custom React hook for integrating SIGM checks into forms:
- State management for check results
- API calls for check, acknowledge, and record submission
- Computed values: `canProceed`, `isGuaranteed`, `isBlocked`, `needsAcknowledgment`

#### 3. SIGM Metrics Card (`apps/web/src/components/admin/SIGMMetricsCard.tsx`)

Admin dashboard component showing:
- Guaranteed percentage
- Repeat visits avoided
- Pending backend actions
- Check outcome breakdown (bar chart)
- Services with lowest guarantee rates

## Integration Guide

### Integrating SIGM into a Form

```tsx
import { useSIGM } from "@/lib/hooks/useSIGM";
import { GuaranteeCheckModal } from "@/components/kiosk/GuaranteeCheckModal";

function MyForm() {
  const {
    isChecking,
    checkResult,
    isModalOpen,
    performCheck,
    acknowledgeCheck,
    recordSubmission,
    closeModal,
    reset,
    canProceed,
  } = useSIGM({
    requestType: "BILL_PAYMENT",
    serviceType: "ELECTRICITY",
  });

  const handleSubmit = async () => {
    // Step 1: Perform SIGM check
    await performCheck({ billId: "123", amount: 500 });
  };

  const handleAcknowledge = async (sigmLogId: string) => {
    await acknowledgeCheck();
  };

  const handleProceed = async () => {
    closeModal();
    // Step 2: Proceed with actual submission
    const result = await submitMyForm();
    // Step 3: Record submission
    await recordSubmission(result.id, "lock-identifier");
  };

  return (
    <>
      <GuaranteeCheckModal
        isOpen={isModalOpen}
        checkResult={checkResult}
        isLoading={isChecking}
        onAcknowledge={handleAcknowledge}
        onCancel={() => { closeModal(); reset(); }}
        onProceed={handleProceed}
      />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

## Guarantee Status Rules

### GUARANTEED
Request will be completed without repeat visits when:
- All required documents are uploaded
- Service is available in the citizen's area
- No backend dependencies are blocking
- No duplicate requests exist

### NOT_GUARANTEED
Request accepted but requires backend action when:
- High technician queue (installation may take longer)
- High support queue (response time may be longer)
- All ERROR-level issues are backend-related

**Important**: Citizen explicitly acknowledges that:
- Additional backend action is required
- They will NOT need to resubmit

### BLOCKED
Cannot proceed when:
- Missing required documents
- Service not available in area
- Duplicate request already exists (payment, connection, complaint)

## Setup Instructions

1. **Generate Prisma Client**:
   ```bash
   cd packages/database
   npx prisma generate
   ```

2. **Push Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Restart API Server**:
   ```bash
   cd apps/api
   npm run dev
   ```

4. **Restart Frontend**:
   ```bash
   cd apps/web
   npm run dev
   ```

## Configuration

SIGM behavior can be configured in `apps/api/src/modules/sigm/types.ts`:

```typescript
export const SIGM_CONFIGS: Record<RequestType, SIGMConfig> = {
  BILL_PAYMENT: {
    requiredDocuments: [],
    serviceAreaCheck: false,
    technicianRequired: false,
    duplicateCheckWindow: 24,  // hours
    lockDuration: 24,          // hours
  },
  NEW_CONNECTION: {
    requiredDocuments: ['ID_PROOF', 'ADDRESS_PROOF'],
    serviceAreaCheck: true,
    technicianRequired: true,
    duplicateCheckWindow: 720, // 30 days
    lockDuration: 720,
  },
  // ... other request types
};
```

## Admin Analytics

The SIGM analytics dashboard shows:
- **Guaranteed Percentage**: % of requests completed in one interaction
- **Repeat Visits Avoided**: Estimated number of repeat visits saved
- **Pending Backend Actions**: Queue of actions needing staff attention
- **Services with Lowest Guarantee Rates**: Areas needing improvement

## Future Enhancements

1. **Integration with State APIs**: Replace mock checks with real service availability data
2. **Technician Scheduling**: Integrate with actual technician management system
3. **Predictive Analytics**: Predict guarantee rates based on time, location, service type
4. **SMS/WhatsApp Notifications**: Notify citizens when NOT_GUARANTEED requests are resolved
5. **Machine Learning**: Learn from patterns to improve guarantee predictions
