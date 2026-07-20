const { PrismaClient } = require('@prisma/client');

// One process-wide client prevents each route/service from opening its own Supabase pool.
const prisma = global.__multiOpsPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__multiOpsPrisma = prisma;

module.exports = prisma;
