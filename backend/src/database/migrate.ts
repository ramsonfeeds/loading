import { prisma } from './prisma.js';

await prisma.$connect();
console.log('Prisma client connected');
await prisma.$disconnect();
