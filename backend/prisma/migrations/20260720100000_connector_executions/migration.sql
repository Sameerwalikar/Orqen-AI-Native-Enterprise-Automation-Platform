-- Audit trail for connector reads, previews, and pipeline usage.
CREATE TABLE "connector_executions" (
  "id" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL,
  "pipelineId" TEXT,
  "workflowId" TEXT,
  "userId" INTEGER NOT NULL,
  "rowsRetrieved" INTEGER NOT NULL DEFAULT 0,
  "duration" INTEGER NOT NULL,
  "status" "ExecutionStatus" NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "connector_executions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "connector_executions_connectorId_createdAt_idx" ON "connector_executions"("connectorId", "createdAt");
CREATE INDEX "connector_executions_userId_createdAt_idx" ON "connector_executions"("userId", "createdAt");
ALTER TABLE "connector_executions" ADD CONSTRAINT "connector_executions_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connector_executions" ADD CONSTRAINT "connector_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
