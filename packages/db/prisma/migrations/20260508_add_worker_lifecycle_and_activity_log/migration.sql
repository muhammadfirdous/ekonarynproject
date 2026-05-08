-- AlterTable: User — worker lifecycle, verification, soft delete
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "statusReason" TEXT;
ALTER TABLE "User" ADD COLUMN "statusChangedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "statusChangedById" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationCodeExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "idNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "idDocumentUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "serviceAreas" TEXT;
ALTER TABLE "User" ADD COLUMN "vehicleType" TEXT;
ALTER TABLE "User" ADD COLUMN "vehiclePlate" TEXT;
ALTER TABLE "User" ADD COLUMN "vehicleCapacityKg" REAL;
ALTER TABLE "User" ADD COLUMN "maxConcurrentOrders" INTEGER DEFAULT 5;
ALTER TABLE "User" ADD COLUMN "onShift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "deletedAt" DATETIME;

-- Backfill: existing residents/admins are already active; existing workers we treat as approved/active
UPDATE "User" SET "accountStatus" = 'ACTIVE' WHERE "accountStatus" IS NULL OR "accountStatus" = '';
UPDATE "User" SET "phoneVerifiedAt" = "createdAt" WHERE "phoneVerifiedAt" IS NULL;

-- AlterTable: PickupRequest — assigned worker, lifecycle metadata, soft delete
ALTER TABLE "PickupRequest" ADD COLUMN "assignedWorkerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PickupRequest" ADD COLUMN "assignedAt" DATETIME;
ALTER TABLE "PickupRequest" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN "deletedAt" DATETIME;

-- Migrate legacy uppercase statuses to the new lowercase lifecycle vocabulary
UPDATE "PickupRequest" SET "status" = 'pending'   WHERE "status" = 'PENDING';
UPDATE "PickupRequest" SET "status" = 'assigned'  WHERE "status" = 'ASSIGNED';
UPDATE "PickupRequest" SET "status" = 'completed' WHERE "status" = 'COMPLETED';
UPDATE "PickupRequest" SET "status" = 'cancelled' WHERE "status" = 'CANCELLED';

-- CreateIndex: User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex: PickupRequest
CREATE INDEX "PickupRequest_status_idx" ON "PickupRequest"("status");
CREATE INDEX "PickupRequest_assignedWorkerId_idx" ON "PickupRequest"("assignedWorkerId");
CREATE INDEX "PickupRequest_createdAt_idx" ON "PickupRequest"("createdAt");

-- CreateIndex: Notification
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateTable: ActivityLog
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex: ActivityLog
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
