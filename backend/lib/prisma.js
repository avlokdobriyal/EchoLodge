// Single shared PrismaClient instance so routes and middleware don't each
// open their own connection pool.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
