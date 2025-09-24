import { PrismaClient } from '@coldtrace/database';

export interface GraphQLContext {
  prisma: PrismaClient;
  requestId?: string;
}

export async function createContext(): Promise<GraphQLContext> {
  // Import Prisma client from our database package
  const { prisma } = await import('@coldtrace/database');

  // Generate a unique request ID for logging
  const requestId = `req-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  return {
    prisma,
    requestId,
  };
}
