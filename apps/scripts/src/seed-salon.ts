#!/usr/bin/env tsx

import { seedServicesByNipOrId } from '@dc-beauty/db/seedServices';
import { PrismaClient } from '@dc-beauty/db';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: pnpm seed:salon <nip|salonId>');
    console.error('');
    console.error('Examples:');
    console.error('  pnpm seed:salon 1234567890');
    console.error('  pnpm seed:salon nip:1234567890');
    console.error('  pnpm seed:salon clpx1234567890');
    process.exit(1);
  }

  let nipOrId = args[0];
  
  // Handle "nip:" prefix
  if (nipOrId.startsWith('nip:')) {
    nipOrId = nipOrId.substring(4);
  }

  console.log(`🔍 Looking for salon with NIP/ID: ${nipOrId}`);
  
  const prisma = new PrismaClient();
  
  try {
    const result = await seedServicesByNipOrId(nipOrId, prisma);
    
    console.log('');
    console.log('🎉 Service seeding completed successfully!');
    console.log(`   Salon ID: ${result.salonId}`);
    console.log(`   Services created: ${result.servicesCreated}`);
    console.log(`   Services updated: ${result.servicesUpdated}`);
    console.log(`   Translations created: ${result.translationsCreated}`);
    
  } catch (error) {
    console.error('❌ Error seeding services:');
    if (error instanceof Error) {
      console.error('  ', error.message);
    } else {
      console.error('  ', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
