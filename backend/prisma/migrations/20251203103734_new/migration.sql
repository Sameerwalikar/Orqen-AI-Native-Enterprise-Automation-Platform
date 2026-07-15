-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" TEXT,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_metrics" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" TEXT,
    "duration" INTEGER NOT NULL,
    "memoryUsage" INTEGER,
    "cpuUsage" DOUBLE PRECISION,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER,
    "cost" DOUBLE PRECISION,
    "status" "ExecutionStatus" NOT NULL,
    "errorType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_analytics" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "organizationId" TEXT,
    "date" DATE NOT NULL,
    "agentsExecuted" INTEGER NOT NULL DEFAULT 0,
    "workflowsExecuted" INTEGER NOT NULL DEFAULT 0,
    "pipelinesExecuted" INTEGER NOT NULL DEFAULT 0,
    "vectorsSearched" INTEGER NOT NULL DEFAULT 0,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_resourceType_resourceId_idx" ON "schedules"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "schedules_enabled_nextRun_idx" ON "schedules"("enabled", "nextRun");

-- CreateIndex
CREATE INDEX "schedules_userId_idx" ON "schedules"("userId");

-- CreateIndex
CREATE INDEX "webhooks_resourceType_resourceId_idx" ON "webhooks"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "webhooks_userId_idx" ON "webhooks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_url_key" ON "webhooks"("url");

-- CreateIndex
CREATE INDEX "execution_metrics_resourceType_resourceId_createdAt_idx" ON "execution_metrics"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "execution_metrics_userId_createdAt_idx" ON "execution_metrics"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "execution_metrics_organizationId_createdAt_idx" ON "execution_metrics"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "execution_metrics_status_createdAt_idx" ON "execution_metrics"("status", "createdAt");

-- CreateIndex
CREATE INDEX "usage_analytics_userId_date_idx" ON "usage_analytics"("userId", "date");

-- CreateIndex
CREATE INDEX "usage_analytics_organizationId_date_idx" ON "usage_analytics"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_analytics_userId_date_key" ON "usage_analytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_analytics_organizationId_date_key" ON "usage_analytics"("organizationId", "date");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_metrics" ADD CONSTRAINT "execution_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_metrics" ADD CONSTRAINT "execution_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
