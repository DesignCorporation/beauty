// TP-02 T6: tenantPrisma helper with automatic tenant filtering

import { PrismaClient } from '@beauty/db';
import { TENANTED_MODELS } from '../types/tenant';

/**
 * Creates a Prisma client wrapper that automatically injects salonId filter
 * for all operations on tenanted models
 */
export function tenantPrisma(salonId: string) {
  const prisma = new PrismaClient();
  
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Only apply filtering to models that have salonId field
          if (model && TENANTED_MODELS.has(model)) {
            args = args || {};
            
            // Apply salonId filter based on operation type
            if (operation === 'findFirst' || operation === 'findMany' || 
                operation === 'findUnique' || operation === 'count' ||
                operation === 'update' || operation === 'updateMany' ||
                operation === 'delete' || operation === 'deleteMany') {
              
              if (!args.where) args.where = {};
              
              // Check for tenant mismatch
              if (args.where.salonId && args.where.salonId !== salonId) {
                throw new Error(`Tenant mismatch for model ${model}: expected ${salonId}, got ${args.where.salonId}`);
              }
              
              // Inject salonId filter
              args.where.salonId = salonId;
            }
            
            // For create operations, ensure salonId is set
            if (operation === 'create') {
              if (!args.data) args.data = {};
              
              // Check for tenant mismatch in create data
              if (args.data.salonId && args.data.salonId !== salonId) {
                throw new Error(`Tenant mismatch for model ${model}: expected ${salonId}, got ${args.data.salonId}`);
              }
              
              // Set salonId in create data
              args.data.salonId = salonId;
            }
            
            // For createMany operations
            if (operation === 'createMany') {
              if (args.data && Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => {
                  if (item.salonId && item.salonId !== salonId) {
                    throw new Error(`Tenant mismatch for model ${model}: expected ${salonId}, got ${item.salonId}`);
                  }
                  return { ...item, salonId };
                });
              }
            }
            
            // For upsert operations
            if (operation === 'upsert') {
              if (!args.where) args.where = {};
              if (!args.create) args.create = {};
              if (!args.update) args.update = {};
              
              // Filter where clause
              if (args.where.salonId && args.where.salonId !== salonId) {
                throw new Error(`Tenant mismatch for model ${model}: expected ${salonId}, got ${args.where.salonId}`);
              }
              args.where.salonId = salonId;
              
              // Set salonId in create and update data
              if (args.create.salonId && args.create.salonId !== salonId) {
                throw new Error(`Tenant mismatch in create for model ${model}: expected ${salonId}, got ${args.create.salonId}`);
              }
              args.create.salonId = salonId;
              
              // Don't overwrite explicit salonId in update unless it conflicts
              if (args.update.salonId && args.update.salonId !== salonId) {
                throw new Error(`Tenant mismatch in update for model ${model}: expected ${salonId}, got ${args.update.salonId}`);
              }
            }
          }
          
          return query(args);
        }
      }
    },
    
    // Add disconnect method for proper cleanup
    result: {
      $allModels: {
        async $allOperations({ result }) {
          return result;
        }
      }
    }
  });
}

/**
 * Type-safe wrapper that ensures tenant context exists
 */
export function createTenantPrisma(salonId: string | undefined) {
  if (!salonId) {
    throw new Error('Tenant context required: salonId is missing');
  }
  
  return tenantPrisma(salonId);
}
