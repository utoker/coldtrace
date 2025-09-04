import { PrismaClient } from '@coldtrace/database';

export interface GraphQLContext {
  prisma: PrismaClient;
}

export async function createContext(): Promise<GraphQLContext> {
  // Import Prisma client from our database package
  const { prisma } = await import('@coldtrace/database');
  
  return {
    prisma,
  };
}