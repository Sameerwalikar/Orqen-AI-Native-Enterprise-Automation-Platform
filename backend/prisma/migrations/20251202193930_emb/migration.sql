-- CreateEnum
CREATE TYPE "DistanceMetric" AS ENUM ('COSINE', 'EUCLIDEAN', 'DOT_PRODUCT');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    "organizationId" TEXT,
    "dimensions" INTEGER NOT NULL,
    "distance" "DistanceMetric" NOT NULL DEFAULT 'COSINE',
    "status" "CollectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "vectorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vectors" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "metadata" JSONB,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collections_userId_status_idx" ON "collections"("userId", "status");

-- CreateIndex
CREATE INDEX "collections_organizationId_status_idx" ON "collections"("organizationId", "status");

-- CreateIndex
CREATE INDEX "collections_status_idx" ON "collections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "collections_name_userId_key" ON "collections"("name", "userId");

-- CreateIndex
CREATE INDEX "vectors_collectionId_idx" ON "vectors"("collectionId");

-- CreateIndex
CREATE INDEX "vectors_collectionId_createdAt_idx" ON "vectors"("collectionId", "createdAt");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vectors" ADD CONSTRAINT "vectors_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
